// contracts.ts

/** Normalized Pokémon data after validation/parsing. */
export interface PokemonDto {
  readonly id: number;
  readonly name: string;
  readonly baseExperience: number;
  readonly height: number;
  readonly types: readonly string[];
  readonly moves: readonly string[];
}

/** Final output object for a matched Pokémon. */
export interface Passport {
  readonly runId: string;
  readonly id: number;
  readonly name: string;
  readonly baseExperience: number;
  readonly height: number;
  readonly types: readonly string[];
  readonly moves: readonly string[];
  readonly fetchedAt: string; // ISO string
}

/**
 * Enum for match failure reasons
 */
export enum MatchFailureReason { 
  NO_MATCHING_MOVE = "NO_MATCHING_MOVE",
  NO_MATCHING_TYPE = "NO_MATCHING_TYPE"
}

/**
 * Enum for kind
 */
export enum CriteriaResultKind {
  MATCHED = "matched",
  NOT_MATCHED = "not_matched"
}


/** Criteria evaluation result (discriminated union). */
export type CriteriaResult =
  | {
      readonly kind: CriteriaResultKind.MATCHED;
      readonly matchedTypes: readonly string[];
      readonly matchedMoves: readonly string[];
    }
  | {
      readonly kind: CriteriaResultKind.NOT_MATCHED;
      readonly reason: MatchFailureReason
    };

/** Per-item processing result (discriminated union). */
export type ItemResult =
  | {
      readonly kind: "success";
      readonly name: string;
      readonly passport: Passport;
      readonly attempts: number;
    }
  | {
      readonly kind: "failure";
      readonly name: string;
      readonly error: Error;
      readonly attempts: number;
    };

/** Run configuration (validated from CLI using Zod). */
export interface RunConfig {
  readonly names: readonly string[];
  readonly concurrency: number; // default 5
  readonly timeoutMs: number; // default 30000
  readonly retries: number; // default 2
  readonly minMatches: number; // default 10
}

/** Report for the entire run. */
export interface RunReport {
  readonly runId: string;
  readonly processed: number;
  readonly matched: number;
  readonly failed: number;
  readonly durationMs: number;
}

/** Output payload written by the CLI. */
export interface RunOutput {
  readonly report: RunReport;
  readonly passports:  Passport[];
  readonly failures:  Array<{
    readonly name: string;
    readonly attempts: number;
    readonly message: string;
    readonly cause?: unknown;
  }>;
}

/** Boundary for fetching Pokémon data (enables clean separation and mocking). */
export interface PokemonSource {
  fetch(name: string, signal: AbortSignal): Promise<PokemonDto>;
}

/** Main library API. */
export interface InvestigationRunner {
  run(config: RunConfig): Promise<RunOutput>;
}
