import { GenerateContentParameters, GoogleGenAI, Models } from '@google/genai';
import ENV from "../../ENV/ENV";
import { response } from 'express';


// --------------------------------------- AI CLIENT --------------------------
const aiClient = new GoogleGenAI({apiKey:ENV.geminiKey});
const MODEL_ID = "gemini-2.5-flash";
async function sendPromptToApi(prompt: string){

    const response = aiClient.models.generateContent({
        model: MODEL_ID,
    } as GenerateContentParameters) 

}