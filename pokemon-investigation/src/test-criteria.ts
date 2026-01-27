import { PokemonDto } from "./contracts.js";
import { evaluateCriteria } from "./criteria.js";



// test matching Pokemon (electric type + thuner-shock move)
const pikachu: PokemonDto = {
    id: 23,
    name: "pikachu",
    baseExperience:113,
    height:4,
    types: ["electric"],
    moves: ["thunder-shock", "quick-attack", "tackle"]
}

const pikachuResult = evaluateCriteria(pikachu);
console.log("pikachu Result:",pikachuResult);



// test non matching type
const bulbasaur: PokemonDto = {
    id: 3,
    name: "bulbasaur",
    baseExperience:131,
    height:4,
    types: ["grass", "poison"],
    moves: ["vine-whip", "tackle"]
}

const bulbasaurResult = evaluateCriteria(bulbasaur);
console.log("bulbasaur Result:",bulbasaurResult);



// test matching Pokemon type but no matching move
const charmander: PokemonDto = {
    id: 4,
    name: "charmander",
    baseExperience: 62,
    height:6,
    types: ["fire"],
    moves: ["vine-whip", "growl"]
}

const charmanderResult = evaluateCriteria(charmander);
console.log("charmander Result:",charmanderResult);


// Test Case insensitivity
const raichu: PokemonDto = {
    id: 14,
    name: "raichu",
    baseExperience: 62,
    height:6,
    types: ["FIRE"],
    moves: ["THUNDER-SHOCK"]
}

const raichuResult = evaluateCriteria(raichu);
console.log("raichu Result:",raichuResult);