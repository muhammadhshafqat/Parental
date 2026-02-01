import { GenerateContentParameters, GoogleGenAI, Models } from '@google/genai';
import ENV from "../../ENV/ENV";


// --------------------------------------- AI CLIENT --------------------------
const aiClient = new GoogleGenAI({apiKey:ENV.geminiKey});
const MODEL_ID = "gemini-2.5-flash";

const system_instruction:string  = "You are an expert on child education. Use formal language.";
const safetySettings = [
    {category: "HARM_CATEGORY_SEXUAL", threshold: "BLOCK_LOW_AND_ABOVE"},
    {category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE"},
    {category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold:"BLOCK_LOW_AND_ABOVE"},
    {category: "HARM_CATEGORY_HARRASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE"}

];


async function sendPromptToApi(prompt: string){

    const response = aiClient.models.generateContent({
        model: MODEL_ID,
        config: {
            systemInstruction: system_instruction,
            safetySettings: safetySettings
        },
        contents: [{
            role: "user",
        }]
    } as GenerateContentParameters);

}