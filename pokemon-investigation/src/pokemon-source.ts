import axios, { AxiosError } from "axios";
import { PokemonDto, PokemonSource } from "./contracts.js";
import { PokemonApiResponseSchema } from "./schemas.js";
import https from "https"

export class PokemonApiSource implements PokemonSource {

    private readonly baseUrl = "https://pokeapi.co/api/v2/pokemon";


    // Create HTTPS agent for development
    private readonly httpsAgent = new https.Agent({
        rejectUnauthorized: false // only for development
    })


    async fetch(name: string, signal: AbortSignal): Promise<PokemonDto> {
        
        const url = `${this.baseUrl}/${name.toLowerCase()}`;

        try{
            //Make HTTP request with timeout signal
            const response = await axios.get(url, {
                signal,
                // Axios-specific timeout as fallback (30 seconds)
                timeout: 30000,
                httpsAgent: this.httpsAgent
            });

            //Treat response.data as unknown - validate with zod
            // This is the HTTP boundary validation
            const validationResult = PokemonApiResponseSchema.safeParse(response.data);

            if(!validationResult.success){
                //Validation failed - this is a non-retryable error
                throw new Error(`API response validation failed for "${name}": ${validationResult.error.message}`,
                    {cause: validationResult.error}
                );
            }

            // Map validated API response to domain DTO
            const data = validationResult.data;

            return {
                id: data.id,
                name: data.name,
                // Handle nullable base experience (default to 0 if null)
                baseExperience: data.base_experience ?? 0,
                height: data.height,
                // Extract type names from nested structure
                types: data.types.map((t) => t.type.name),
                // Extract move names from nested structure
                moves: data.moves.map((m) => m.move.name)
            };

        }catch(error){
            // Preserve orignal error as cause
            if(error instanceof Error && error.message.includes("validation failed")){
                // Already wrapped validation error - rethrow
                throw error;
            }

            //Handle Axios Errors with better context
            if(axios.isAxiosError(error)){
                const axiosError = error as AxiosError;

                //Http error response (4XX, 5XX)
                if(axiosError.response){
                    throw new Error(
                        `HTTP ${axiosError.response.status} for "${name}"`,
                        {cause: error}
                    );
                }

                // Timeout error
                if(axiosError.code === "ECONNABORTED" || axiosError.code === "ETIMEDOUT"){
                    throw new Error(
                        `Request timeout for "${name}"`,
                        {cause: error}
                    );
                }

                //Network errors (no response received)
                throw new Error(`Network error fetching "${name}"`, {cause: error});
            }

            //Handle abort signal errors (from AbortController)
            if(error instanceof Error && error.name === "AbortError"){
                throw new Error(`Request aborted for "${name}"`,{cause: error});
            }

            //Unknown error type
            throw new Error(`Failed to fetch "${name}"`,{cause: error instanceof Error ? error : new Error(String(error))});
        }
        
    }
    
}