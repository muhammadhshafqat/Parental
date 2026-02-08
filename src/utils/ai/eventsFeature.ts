import { BaseResponse, EngineParameters, getJson  } from "serpapi";
import ENV from "../../ENV/ENV";

export async function fetchEvents(location: string, interests: string[]){

    // define parameters
    const interestString: string = interests.join(',');

    try{
        const results: BaseResponse = await getJson({
            engine: "google",
            api_key:ENV.serpKey,
            q:  interestString,
            hl: "en",
            location: location
        });

        return results;

    }catch(err){

        console.log("[]");
        console.log(err);

    }

}