import{ WebSocketServer }from "ws";
import { Chat, Content, Part } from "@google/genai";
import { createNewChat, sendPrompt, baseSystemInstruction } from "../ai/ai";
import { marked } from "marked";
import  {chatDbType, SearchResultEntry} from  "../common";
import ENV from "../../ENV/ENV";
import { createClient } from '@supabase/supabase-js';
import { fetchEvents } from "../ai/eventsFeature";


// ----------------------------- USEFUL FUNCTIONS ---------------------------
//converting from my type to parts
function convertToParts(arr: { role: string, message: string }[]): Content[] {

    const parts: Content[] = [];

    arr?.forEach((el) => {

        const partArr: Part[] = [{ text: el.message }];

        const obj: Content = { role: el.role, parts: partArr };

        parts.push(obj);
    });

    return parts;
}
// sends structured data to ai
async function getFilteredEvents(structuredData: SearchResultEntry[], interests: string[]): Promise<SearchResultEntry[]>{

    const prompt: string = `You are an AI assistant filtering search results for a user based on their specific interests.
    
    USER INTERESTS: [${interests.join(", ")}]
    
    SEARCH DATA:
    ${JSON.stringify(structuredData, null, 2)}
    
    TASK:
    1. Analyze each item in the SEARCH DATA.
    2. Keep only the items that are highly relevant to the USER INTERESTS.
    3. Return the filtered list as a valid JSON array of objects. 
    4. Maintain the exact same structure: {name, place, data, time, url}.
    5. DO NOT include any conversational text, only the JSON array.
    `;

    const response = await sendPrompt(prompt);

    if (!response) {
        return [];
    } else {
        try {
            // 2. Clean the response of potential markdown code blocks
            const cleanedResponse = response.replace(/```json|```/g, "").trim();
            return JSON.parse(cleanedResponse);
        } catch (error) {
            console.error("Failed to parse Gemini response:", error);
            return []; // Return empty array to avoid breaking downstream logic
        }
    }
}

//structures the raw data
function extractSearchDetails(rawData: any): SearchResultEntry[] {
  // Extract global metadata once
  const place = rawData.search_parameters?.location_used ?? "Unknown Location";
  const time = rawData.search_metadata?.processed_at ?? new Date().toISOString();

  // Return a strictly typed array
  return (rawData.organic_results || []).map((result: any): SearchResultEntry => ({
    name: result.title || "Untitled",
    place: place,
    data: result.snippet || "No description available",
    time: time,
    url: result.link || ""
  }));
}


// ----------------------------------------------  DATABASE CLIENT -----------------
const supabase = createClient(ENV.supabaseUrl, ENV.supabasePublishableKey);

export const wss: WebSocketServer = new WebSocketServer({noServer: true});


wss.on("connection", async (ws, request)=>{

    console.log("Connected to client");


    // events ki request
    ws.on("request-events", async (data)=>{


        try {

            // get data sent from client
            const location:string = data.location;
            const interests: string[] = data.interests;

            // get events
            const eventsResultUnstructured = await fetchEvents(location,interests);

            // structure data
            const structuredData:SearchResultEntry[] = extractSearchDetails(eventsResultUnstructured);


            // filter data
            const filtered:SearchResultEntry[] = await getFilteredEvents(structuredData, interests);
            
            // send to user
            ws.emit("events", filtered);

            return;

        }catch(err){

            console.log("Error:", err);
            ws.emit("events-error");
            return;
        }
        

    })


    ws.on("message", async (data) =>{

        //{role: string, message: {message, interests, events}, chatId: string}
        const incomingData = JSON.parse(data.toString());
        const prompt: string = incomingData.message.message;
        const chatId = incomingData.chatId;



        let chatHistory: Content[] | null = [];

        const {data: histData, error: histErr} = await supabase.from("Chats").select("messages").eq("id", chatId).maybeSingle();

        if(histErr || !histData.messages){

            chatHistory = null;

        }else{

            chatHistory = convertToParts(histData.messages);

        }

        const systemInstruction = baseSystemInstruction + ` Remember these details: CHILD_NAME: ${incomingData.message.name} CHILD_INTERESTS: ${incomingData.message.interests} and UPCOMING EVENTS: ${JSON.stringify(incomingData.message.events)}` 

        const chat:Chat = await createNewChat(chatHistory, systemInstruction); 

        try{

            const response = await chat.sendMessage({
                message: prompt
            });
            
            if(!response){
                throw new Error("Could not get response from gemini api");
            }

            const raw =  response.text;
            const html = marked.parse(raw) as string;

            //formatting data according to appropriate type
            const responseData:chatDbType = {role: "model", message: html}; 

            //saving to database
            const {data: messageArr, error} = await supabase.from("Chats").select("messages").eq("id", chatId).maybeSingle();
            
            if(messageArr&& !error){

                const currentArr = messageArr.messages|| [];

                currentArr.push({role: incomingData.role, message: incomingData.message.message});
                currentArr.push(responseData);

                const {error: upErr} = await supabase.from("Chats").update({messages: currentArr}).eq("id", chatId);

                if(upErr){
                    throw new Error(upErr.message.toString());
                }

            }else {
                throw new Error(error.message.toString());
            }



            ws.send(JSON.stringify(responseData));

            return;

        }catch(err){

            const data:chatDbType = {role: "model", message: "Something went wrong."};
            console.log(err); 
            ws.send(JSON.stringify(data)); 

            return;
        }

    });


    ws.on("close", ()=>{
        console.log("Disconnected");
        return;
    });
});
