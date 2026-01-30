import { RunConfig } from "./contracts.js";
import { PokemonApiSource } from "./pokemon-source.js";
import { PokemonInvestigationRunner } from "./runner.js";

async function testRunner() {
  const source = new PokemonApiSource();
  const runner = new PokemonInvestigationRunner(source);

  // Test batch processing with early termination
  const config: RunConfig = {
    names: ["pikachu", "raichu", "bulbasaur", "charmander", "squirtle", 
            "eevee", "jigglypuff", "meowth", "psyduck", "alakazam"],
    concurrency: 3, // Process 3 at a time
    timeoutMs: 10000,
    retries: 1,
    minMatches: 2, // Stop after 2 matches
  };

  console.log("Testing Batch-Wise Processing");
  console.log("Configuration:");
  console.log("  Names:", config.names.length);
  console.log("  Concurrency:", config.concurrency);
  console.log("  Min Matches:", config.minMatches);
  console.log("\nStarting test run...\n");

  const output = await runner.run(config);

  console.log("\n Results:");
  console.log("  Run ID:", output.report.runId);
  console.log("  Processed:", output.report.processed);
  console.log("  Matched:", output.report.matched);
  console.log("  Failed:", output.report.failed);
  console.log("  Duration:", output.report.durationMs, "ms");
  
  console.log("\n Matched Pokemon:");
  output.passports.forEach(p => {
    console.log(`  - ${p.name} (${p.types.join(", ")})`);
  });

  if (output.failures.length > 0) {
    console.log("\n Failed Pokemon:");
    output.failures.forEach(f => {
      console.log(`  - ${f.name}: ${f.message.substring(0, 90)}...`);
    });
  }

  console.log("\n Observations:");
  console.log(`  - Processed count should be multiple of concurrency (${config.concurrency})`);
  console.log(`  - Or close to minMatches + one batch (${config.minMatches + config.concurrency})`);
  console.log(`  - Actual processed: ${output.report.processed}`);
  
  console.log("\n Batch processing test completed!");
}

testRunner().catch(console.error);