import { AxiosError } from "axios";


/**
 * Configuration for retry behaviour
 */

export interface RetryConfig {
    readonly maxAttempts: number;
    readonly baseDelayMs: number;
}


/**
 * Determines if an error is transient and should be retried
 * 
 * Retryable errors (transient)
 * - Network errors (no response recieved)
 * - Timeout (ECONNABORTED , ETIMEDOUT)
 * - HTTP 429 (Rate Limit)
 * - HTTP 5xx (Server Errors)
 * 
 * Non-retryable errors:
 * - Validation errors
 * - Parsing errors
 * - Non-429 4xx responses (client errors)
 * 
 * @param error - The error to evaluate
 * @returns true if the error is transient and should be retried
 */

function isTransientError(error: unknown): boolean  {

    if(!(error instanceof Error)){
        return false;
    }

    //Check Axios errors
    if(error.name === "AxiosError" || "isAxiosError" in error){
        const axiosError = error as AxiosError;

        // Network error (no response recieved) - retry
        if(!axiosError.response){
            return true;
        }

        //Check HTTP status codes
        const status = axiosError.response.status;

        //Rate limit (429) - retry
        if(status === 429){
            return true;
        }


        // Server Errors (5xx) - retry
        if(status >= 500 && status < 600){
            return true;
        }

        //Client errors (4xx except 429) - don't retry
        return false;
    }


    //Timeout errors from AbortController - retry
    if(error.name === "timeoutError" || error.name === "AbortError"){
        return true;
    }

    //Other errors are not retryable by default
    return false;
}





export async function withRetry<T>(operation: () => Promise<T>, config: RetryConfig, context: string): Promise<T> {

    let lastError: Error | undefined;
    
    for(let attempt = 1; attempt < config.maxAttempts; attempt++){
        try{
            return await operation();
        } catch(error){
            const err = error instanceof Error ? error : new Error(String(error));
            lastError = err;

            //Don't retry if this is the last attempt
            if(attempt === config.maxAttempts){
                break;
            }

            //Don't retry if the error is not transient
            if(!isTransientError(err)){
                throw new Error(`Non-retryable error for ${context} on attempt ${attempt}/${config.maxAttempts}`,{cause: err});
            }


            //Calculate exponential  backoff delay: baseDelay * 2^(attempt - 1)
            //Attempt 1: 1s , Attempt 2: 2s , Attempt 3: 3s , 4s , etc 
            const dealyMS = config.baseDelayMs * Math.pow(2, attempt - 1);


            //Log retry attempt
            console.log(`Retrying ${context} after ${dealyMS}ms (attempt ${attempt}/${config.maxAttempts})`);
            
            //Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, dealyMS));
        }
    }

    throw new Error(`All ${config.maxAttempts} attempts failed for ${context}`,{cause:lastError})
}


