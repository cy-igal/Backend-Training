import { CriteriaResult, PokemonDto } from "./contracts";

/**
 * Matching criteria configuartion.
 * A Pokemon is considered a match if it has:
 * - At lease ONE of the specified types AND
 * - At lease ONE of the specified moves
 */
const CRITERIA = {
    types: ["electric", "fire", "psychic"],
    moves: ["thunder-shock", "quick-attack", "electro-ball", "thunder-wave"]
} as const;



/**
 * Evaluates whether a Pokemon meets the matching criteria.
 * Returns a discriminated union indicating match status with details.
 * 
 * Matching Logic:
 * 1. Check if Pokemon has at least one matching type
 * 2. If no matching type, return not_matched with reason
 * 3. Check if Pokemon has at least one matching move
 * 4. If no matching move, return not_matched with reason
 * 5. If both conditions met, return matched with lists
 * 
 * @param pokemon - The Pokemon to evaluate against criteria
 * @returns CriteriaResult with match details or failure reason
 * 
 * @example
 * const pikachu = { types: ["electric"], moves: ["thunder-shock", "tackle"], ... };
 * const result = evaluateCriteria(pikachu);
 * // result.kind === "matched"
 * // result.matchedTypes === ["electric"]
 * // result.matchedMoves === ["thunder-shock"]
 * 
 * @example
 * const bulbasaur = { types: ["grass", "poison"], moves: ["vine-whip"], ... };
 * const result = evaluateCriteria(bulbasaur);
 * // result.kind === "not_matched"
 * // result.reason === "NO_MATCHING_TYPE"
 */
export function evaluateCriteria(pokemon:PokemonDto): CriteriaResult {

    // normalize types to lowercase for case-insensitive comparison
    const normalizedTypes = pokemon.types.map((t) => t.toLowerCase());
    const normalizedMoves = pokemon.moves.map((t) => t.toLowerCase());

    // Find all matching types from the criteria
    const matchedTypes = normalizedTypes.filter((t) => CRITERIA.types.includes(t as any));

    //Must have atleast one matching types
    if(matchedTypes.length == 0){
        return {
            kind : "not_matched",
            reason: "NO_MATCHING_TYPE",
        }
    }


    // Find all matching moves from the criteria
    const matchedMoves = normalizedMoves.filter((m) => CRITERIA.moves.includes(m as any));

    //Must have atleast one matching movbes
    if(matchedMoves.length == 0){
        return {
            kind : "not_matched",
            reason: "NO_MATCHING_MOVE",
        }
    }


    //Both criteria met - return matches result with details
    return {
        kind: "matched",
        matchedMoves,
        matchedTypes
    };
}