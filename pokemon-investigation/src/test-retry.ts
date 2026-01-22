// import { withRetry } from "./retry.js"


// // Test successful operation
// async function testSuccess(){

//     const result = await withRetry(
//         async () => "success", 
//         { maxAttempts: 3 , baseDelayMs: 100 },
//         "test operation"
//     );

//     console.log("Success test:",result);
// }



// async function testRetry(){
//     let attempts = 0;

//     try{
//         await withRetry(
//             async () => {
//                 attempts++;

//                 if(attempts < 2){
//                     const error: any = new Error("Network error");
//                     error.name = "AxiosError";
//                     throw error;
//                 }
//                 return "success after retry";
//             },
//             { maxAttempts: 3 , baseDelayMs: 100},
//             "retry test"
//         );
//         console.log("Retry test passed , attempts",attempts);
//     } catch(error){
//         console.error("Retry test failed:",error)
//     }
// }


// // Test non-retryable error

// async function testNonRetryable(){
//     try{
//         await withRetry(
//             async () => {
//                 throw new Error("Validation error");
//             },
//             {maxAttempts: 3 , baseDelayMs: 100},
//             "non-retyable test"
//         );
//     }catch(error){
//         console.log("Non-retryable test correctly threw error");
        
//     }
// }



// testSuccess();
// testRetry();
// testNonRetryable();