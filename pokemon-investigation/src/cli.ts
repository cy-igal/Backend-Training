import { resolve } from "path";
import { CliArgs, RunConfig } from "./contracts.js";
import { readFile, writeFile } from "fs/promises";
import { InputFileSchema, RunConfigSchema } from "./schemas.js";
import { PokemonApiSource } from "./pokemon-source.js";
import { PokemonInvestigationRunner } from "./runner.js";

/**
 * Parses command-line arguments into a configuration object
 * Provides defaults for optional parameters.
 * 
 * Supported arguments:
 * - --input , -i : Path to input JSON file
 * - --concurrency , -c : Max concurrent requests
 * - --timeout , -t : Request timeout in ms
 * - --retries , -r : Retry attempst
 * - --min-matches , -m : Minimum matches before stopping
 * - --help , -h : Show usage information
 */
function parseCliArgs(): CliArgs {

    const args = process.argv.slice(2);

    const config: CliArgs = {
        inputPath: "./pokemon.input.json",
        concurrency: 5,
        timeoutMs: 30000,
        retries: 2,
        minMatches: 10,
    }

    for(let i = 0; i<args.length; i++){
        const arg = args[i];
        const next = args[i + 1];

        switch(arg){
            case "--input":
            case "-i":
                if(next) 
                    config.inputPath = next;
                i++;
                break;

            case "--concurrency":
            case "-c":
                if(next)
                    config.concurrency = parseInt(next, 10);
                i++;
                break;

            case "--timeout":
            case "-t":
                if(next)
                    config.timeoutMs = parseInt(next, 10)
                i++;
                break;

            case "--retries":
            case "-r" : 
                if(next)
                    config.retries = parseInt(next, 10)
                i++;
                break;

            case "--min-matches":
            case "-m":
                if(next)
                    config.minMatches = parseInt(next, 10)
                i++;
                break;
            
            case "--help":
            case "-h":
                printUsage();
                process.exit(0);
                break;    
        }
    }
    return config;
}


/**
 * Prints usage information to the console.
 */
function printUsage(): void {
    console.log(`
        Pokemon Investigation CLI


        Usage: npm start -- [options]

        Options:
         --input , -i <path> : Path to input JSON file (default: ./pokemon.input.json)
         --concurrency , -c : Max concurrent requests (default: 5, range: 1-50)
         --timeout , -t : Request timeout in ms (default: 30000, range: 1000-120000)
         --retries , -r : Retry attempst (default: 5, range: 0-10)
         --min-matches , -m : Minimum matches before stopping (default: 10)
         --help , -h : Show this help message

         Examples:
            npm start
            npm start -- --input ./pokemon.input.json --concurrency 10 --min-matches 15
            npm start -- -i ./data.json -c 5 -m 20 -r 3 -t 45000
        `);
}


/**
 * Main CLI entry point.
 * Orchestaration: input reading
 */
async function main(): Promise<void> {
    try{
        console.log("Pokemon Investigation Starting... \n");

        //Parse CLI Arguments
        const cliArgs = parseCliArgs();
        console.log(`Reading input from: ${cliArgs.inputPath}`);

        //Read and validate input file (I/O boundary)
        const inputFilePath = resolve(cliArgs.inputPath);
        const inputContent = await readFile(inputFilePath, "utf8");

        let inputData: unknown;

        try{
            inputData = JSON.parse(inputContent);
        }catch(error){
            console.error("Failed to parse input JSON file")
            console.error("Make sure the file contains valid JSON");
            process.exit(1);
        }

        //Validate input file structure with Zod
        const inputValidation = InputFileSchema.safeParse(inputData);
        if(!inputValidation.success){
            console.error("Input file validation Failed");
            console.error(inputValidation.error.format());
            process.exit(1);
        }

        const { names } = inputValidation.data
        console.log(`Found ${names.length} Pokemon names in input file\n`);
        

        // Build and validate runtime configuration with Zod
        const configInput = {
            names,
            concurrency: cliArgs.concurrency,
            timeoutMs: cliArgs.timeoutMs,
            retries: cliArgs.retries,
            minMatches: cliArgs.minMatches
        };

        const configValidation = RunConfigSchema.safeParse(configInput);
        if(!configValidation.success){
            console.error("Configuration validation failed:");
            console.error(configValidation.error.format());
            process.exit(1);
        }

        const config: RunConfig = configValidation.data;

        //Display configuration
        console.log("Configuration:");
        console.log(`Concurrency: ${config.concurrency}`);
        console.log(`Timeout:${config.timeoutMs}ms `);
        console.log(`Retries: ${config.retries}`);
        console.log(`Min matches: ${config.minMatches}`);
        

        // Initialize dependancies and run investigation
        const source = new PokemonApiSource();
        const runner = new PokemonInvestigationRunner(source);

        console.log("Starting investigation...\n");
        const output = await runner.run(config);

        //Display results summary
        console.log("\n Investigation Complete!");
        console.log(`Run ID:${output.report.runId}`);
        console.log(`Duration: ${output.report.durationMs}ms`);
        console.log(`Processed: ${output.report.processed}`);
        console.log(`Matches: ${output.report.matched}`);
        console.log(`Failed: ${output.report.failed}`);
        
        //Write output files
        console.log("Writing output files...");


        //1. Run Summary
        await writeFile("output.summary.json", JSON.stringify(output.report, null , 2), "utf8");
        console.log("output.summary.json");
        

        //2. Passports
        await writeFile("output.passports.json", JSON.stringify(output.passports, null , 2), "utf8")
        console.log("output.passports.json");

        //3. Failures
        await writeFile("output.failures.json", JSON.stringify(output.failures, null , 2), "utf8");
        console.log("output.failures.json");

        console.log("\n All Done ! Check the output files for results.");
        
    }catch(error){
        console.error("Fatal error:")
        if(error instanceof Error){
            console.error(`${error.message}`)
            if(error.cause){
                console.error(` Cause ${error.cause}`)     
            }
        } else {
            console.error(`${String(error)}`);
        }
        process.exit(1);
    }
}


//Run the CLI
main()