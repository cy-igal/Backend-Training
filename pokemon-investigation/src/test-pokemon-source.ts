import { PokemonApiSource } from "./pokemon-source.js";



async function testFetch(){
    const source = new PokemonApiSource();
    const controller = new AbortController();
    
    try{
        //Test Successful fetch
        console.log("Fetching Pikachu");
        const pikachu = await source.fetch("pikachu",controller.signal);
        console.log("Success:",pikachu.name,"- Types:",pikachu.types);

        //Test 404 error
        console.log("\n Testing 404 error...");
        try{
            await source.fetch("InvalidPokmon123",controller.signal)
        }catch(error){
            console.log("404 error caught",(error as Error).message);
        }


        //Test timeout
        console.log("\n Testing timout....");
        const timeoutController = new AbortController();

        setTimeout(() => timeoutController.abort(), 1); // Abort immediately
        try{    
            await source.fetch("pikachu", timeoutController.signal);
        }catch(error){
            console.log("Timeout error caught:",(error as Error).message);
        }
        

    }catch(error){
        console.error("Test failed",error);
    }
}


testFetch();