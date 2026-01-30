import { randomUUID } from "crypto";
import { CriteriaResultKind, InvestigationRunner, ItemResult, Passport, PokemonSource, RunConfig, RunOutput } from "./contracts.js";
import { withRetry } from "./retry.js";
import { evaluateCriteria } from "./criteria.js";


/**
 * Implementation of the main investigation runner.
 * Processes Pokemon with bounded concurrency and early termination. 
 * 
 * Key featureS:
 * - Batch-wise processing with bounded concurrency
 * - Promise.all used per batch (not unbounded)
 * - Early termination: let in-flight requests complete, don't queue new batches
 * - Retry logic for transient failures
 * - Individual timeout per request
 * - Comprehensive error handling
 * 
 * 
 */
export class PokemonInvestigationRunner implements InvestigationRunner {

    constructor(private readonly source : PokemonSource){}

    /**
     * Run the investigation with the given configuration.
     * Implements bounded concurency and stops early when minMatches is reached.
     * 
     * @param config - Run configuration (names , concurrency , timeout, retries , minMatches)
     * @returns Complete run output with report , passports and failures
     */
    async run(config: RunConfig): Promise<RunOutput> { 

        const runId = randomUUID();
        const startTime = Date.now();


        const passports: Passport[] = [];
        const failures: Array<{
            readonly name: string;
            readonly attempts: number;
            readonly message: string;
            readonly cause?: unknown;
        }> = [];

        //Process with bounded concurrency in batches
        const results = await this.processConcurrently(
            config.names,
            config.concurrency,
            config.timeoutMs,
            config.retries,
            config.minMatches,
            runId
        );

        for(const result of results){
            if(result.kind === "success"){
                passports.push(result.passport);
            } else {
                failures.push({
                    name: result.name,
                    attempts: result.attempts,
                    message: result.error.message,
                    cause: result.error.cause,
                });
            }
        }

        const durationMs = Date.now() - startTime;

        return {
            report: {
                runId,
                processed: results.length,
                matched: passports.length,
                failed: failures.length,
                durationMs,
            },
            passports,
            failures,
        };
    }


    /**
     * Processes Pokemon names with bounded concurrency in batches.
     * Implements early termination when minimum matches are reached.
     * 
     * Strategy
     * - Process names in batches of size = concurrency
     * - Use Promise.all for each batch (bounded)
     * - When minMatches reached: let in-flight request complete, don't queue new ones
     * - This ensures we don't cancel in-progress work
     * 
     * @param names - Array of Pokemon names to process
     * @param concurrency - Maximum concurrent requests per batch
     * @param timeoutMs - Timeout per request
     * @param retries - number of retry per attempts
     * @param minMatches - Minimum matches before early termination
     * @param runId - Unique run identifier
     * @returns Array of processing results
     */
    private async processConcurrently(names: readonly string[], 
        concurrency: number, 
        timeoutMs: number, 
        retries: number, 
        minMatches: number, 
        runId: string
    ) : Promise<ItemResult[]> {
        
        const results: ItemResult[] = [];
        let matchCount = 0;
        let index = 0;

        // Process in batches untill we reach minMatches or run out of names
        while(index < names.length && matchCount < minMatches){

            // Create a batch up to 'concurrency' items
            const batch = names.slice(index , index + concurrency);
            index += concurrency

            // Process entire batch concurrently using Promise.all (bounded by batch size)
            const batchPromises = batch.map((name) => 
                this.processOne(name , timeoutMs, retries, runId)
            );

            // Wait for all items in this batch to complete
            const batchResults = await Promise.all(batchPromises);

            // Add results and count matches
            for(const result of batchResults){
                results.push(result);

                if(result.kind === "success"){
                    matchCount++;
                }
            }   

            //Early termination check after batch completes
            //If we've reached minMatches , we stop queuing new batches
            //but we don't cancel in-flight requests (they all completed)
            if(matchCount >= minMatches){
                break;
            }

        }

        return results;
    }

    /**
     * Processes a single Pokemon with retry logic.
     * 
     * Steps:
     * 1. Fetch Pokemon data with retry logic
     * 2. Evalute against criteria
     * 3. Create passport if matched
     * 4. Return success or failure result
     * 
     * @param name - Pokemon name
     * @param timeoutMs - Timeout in milliseconds
     * @param maxRetries - Maximum retry attempts
     * @param runId - Run identifier
     * @returns Processing result (success or failure)
     */
    private async processOne(
        name: string, 
        timeoutMs: number, 
        maxRetries: number, 
        runId: string
    ): Promise<ItemResult> {

        const totalAttempts = maxRetries + 1;

        try{
            // Use retry wrapper for transient failure handling
            const pokemon = await withRetry(
                async () => {
                    // Create abort controller for timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(),timeoutMs);

                    try{
                        return await this.source.fetch(name,controller.signal);
                    } finally{
                        clearTimeout(timeoutId);
                    }
                },
                {
                    maxAttempts: totalAttempts,
                    baseDelayMs: 1000,
                },
                `Pokemon "${name}"`
            );

            //Evaluate against criteria
            const criteriaResult = evaluateCriteria(pokemon);

            // Check if Pokemon matches
            if(criteriaResult.kind === CriteriaResultKind.NOT_MATCHED){
                // Not a match - treat as failure for output purposes
                // (We don't want to include non-matching Pokemon in passports)
                throw new Error(`Pokemon "${name}" does not match criteria: ${criteriaResult.reason}`);
            }

            // Success - create passport 
            const passport: Passport = {
                runId,
                id: pokemon.id,
                name: pokemon.name,
                baseExperience: pokemon.baseExperience,
                height: pokemon.height,
                types: pokemon.types,
                moves: pokemon.moves,
                fetchedAt: new Date().toISOString(),
            };

            return {
                kind: "success",
                name,
                passport,
                attempts: totalAttempts
            };
        } catch(error){
            // Failure - return error details
            const err = error instanceof Error ? error : new Error(String(error));

            return {
                kind: "failure",
                name,
                error: err,
                attempts: totalAttempts,
            }
        }

    }
    
}