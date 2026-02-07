import{ WebSocketServer }from "ws";
import { Chat } from "@google/genai";
import { createNewChat, sendPromptToChat } from "../ai/ai";
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
            const data:chatDbType = {role: "model", message: response.text.toString()}; 
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
