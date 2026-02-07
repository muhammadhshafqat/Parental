import{ WebSocketServer }from "ws";
import { Chat, Content, Part } from "@google/genai";
import { createNewChat, sendPromptToChat } from "../ai/ai";
import { marked } from "marked";
import  {chatDbType} from  "../common";
import ENV from "../../ENV/ENV";
import { createClient } from '@supabase/supabase-js';



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

// ----------------------------------------------  DATABASE CLIENT -----------------
const supabase = createClient(ENV.supabaseUrl, ENV.supabasePublishableKey);

export const wss: WebSocketServer = new WebSocketServer({noServer: true});


wss.on("connection", async (ws, request)=>{

    console.log("Connected to client");


    ws.on("message", async (data) =>{

        const incomingData:{role: string, message: string, chatId: string} = JSON.parse(data.toString());
        const prompt: string = incomingData.message;
        const chatId = incomingData.chatId;

        let chatHistory: Content[] | null = [];

        const {data: histData, error: histErr} = await supabase.from("Chats").select("messages").eq("id", chatId).maybeSingle();

        if(histErr || !histData.messages){

            chatHistory = null;

        }else{

            chatHistory = convertToParts(histData.messages);


        }

        const chat:Chat = await createNewChat(chatHistory); 

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

                const currentArr = messageArr.messages || [];

                currentArr.push({role: incomingData.role, message: incomingData.message});
                currentArr.push(responseData);

                const {error: upErr} = await supabase.from("Chats").update({messages: currentArr}).eq("id", chatId);

                if(upErr){
                    throw new Error(upErr.message.toString());
                }

            }else {
                throw new Error(error.message.toString());
            }



            ws.send(JSON.stringify(responseData));



        }catch(err){

            const data:chatDbType = {role: "model", message: "Something went wrong."};
            console.log(err); 
            ws.send(JSON.stringify(data)); 

        }

    });


    ws.on("close", ()=>{
        console.log("Disconnected");
    });
});
