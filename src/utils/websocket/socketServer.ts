import{ WebSocketServer }from "ws";
import { Chat } from "@google/genai";
import { createNewChat, sendPromptToChat } from "../ai/ai";
import { marked } from "marked";
import * as DOMPurify from "dompurify";
import  {chatDbType} from  "../common";


export const wss: WebSocketServer = new WebSocketServer({noServer: true});

async function onRecievePrompt(chat: Chat, prompt: string): Promise<string | null>{

    try{
        
        

    }catch(err){

        console.error(err);
        return null;

    }

} 


wss.on("connection", async (ws, request)=>{

    console.log("Connected to client");

    let chat:Chat | null = await createNewChat(null);

    ws.on("message", async (data) =>{

        const prompt:string = data.toString();

        try{

            const response = await chat.sendMessage({message: prompt});
            
            const raw =  response.text;
            const html = marked.parse(raw) as string;
            
            const data:chatDbType = {role: "model", message: html}; 
            ws.send(JSON.stringify(data));

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
