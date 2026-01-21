import {z} from "zod";


/**
 * Schema for validating the input JSON file structure.
 * Ensure we have a "names" array with non empty strings.
 * Boundary: Input file(pokemon.input.json)
 */
export const InputFileSchema = z.object({
    names : z.array(z.string().min(1, "Pokemon name cannot be empty"))
    .min(1, "Names array cannot be empty"),
})



/**
 * Schema for validating Pokemon API response from PokeAPI.
 * Treat axios reponse data as unknown and validates the exact shape we need.
 * 
 * Boundary: HTTP Response (PokeAPI)
 */
export const PokemonApiResponseSchema = z.object({
    id : z.number().positive(),
    name : z.string(),
    base_experience: z.number().nullable(),
    height: z.number(),
    types: z.array(
        z.object({
            type: z.object({
                name : z.string(),
            })
        })
    ),
    moves: z.array(
        z.object({
            move: z.object({
                name: z.string()
            })
        })
    ),
});



/**
 * Schema for validating CLI arguments and runtime configuration.
 * Provides sensible defaults and validates constraints
 * 
 * Boundary: CLI / Runtime configuration
 */

export const RunConfigSchema = z.object({
    names: z.array(z.string().min(1).min(1)),
    concurrency: z.number().int().min(1, "Concurrancy must be at least 1")
                 .max(50,"concurrency cannot exceed 50")
                 .default(5),
    timeoutMs: z.number()
                .int()
                .min(1000,"Timeout must be at least 1000ms")
                .max(120000, "Timeout cannot exceed 120000ms")
                .default(30000),
    retries: z.number()
                .int()
                .min(0,"Retries cannot be negetive")
                .max(120000, "Retries cannot exceed 10")
                .default(2),
    minMatches: z
                .number()
                .int()
                .min(1, "Minimum matches must be at least 1")
                .default(10)
});



export type InputFile = z.infer<typeof InputFileSchema>;
export type PokemonApiResponse = z.infer<typeof PokemonApiResponseSchema>;
export type RunConfigInput = z.infer<typeof RunConfigSchema>