import { InputFileSchema, PokemonApiResponseSchema, RunConfigSchema } from "./schemas.js";


/**
 * Test 1: InputFileSchema - Valid input
 */
const validInput = {names : ["pikachu" , "bulbasaur"]};

console.log("Input validation", InputFileSchema.safeParse(validInput).success);

/**
 * Test 2: InputFileSchema - InValid input (empty array)
 */

const invalidInput = { names: []};
const InvalidResult = InputFileSchema.safeParse(invalidInput);
console.log("Invalid input (empty array):", InvalidResult.success);

if(!InvalidResult.success){
    console.log("Error:", InvalidResult.error.issues[0].message);
}


/**
 * Test 3: PokemonApiResponseSchema - Mock API response
 */

const mockApiResponse = {
    id: 1,
    name: "bulbasaur",
    base_experience: 112,
    height: 4,
    types: [{ type: { name: "electric" } }],
    moves: [{ move: { name: "thunder-shock" } }],
};

const apiResult = PokemonApiResponseSchema.safeParse(mockApiResponse);
console.log("Mock API Response:", apiResult.success); 




/**
 * Test 4: RunConfigSchema - Mock API response
 */

const configInput = {
    names: ["pikachu"],
    concurrency: 10
}

const configResult = RunConfigSchema.parse(configInput);
console.log("config with defaults:" , configResult);
console.log("Default timeout", configResult.timeoutMs);
console.log("Default retries:", configResult.retries);





// Running Commands

// 1. delete dist folder first

// 2. npm run build

// 3. node dist/test.js