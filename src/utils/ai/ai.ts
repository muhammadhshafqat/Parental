import { GenerateContentParameters, GoogleGenAI, SafetySetting, HarmCategory, HarmBlockThreshold, Chat} from '@google/genai';
import ENV from "../../ENV/ENV";


// --------------------------------------- AI CLIENT --------------------------
const aiClient = new GoogleGenAI({apiKey:ENV.geminiKey});
const MODEL_ID = "gemini-2.5-flash";

const system_instruction:string  = "You are an expert on child education. Use formal language.";
const safetySettings:SafetySetting[] = [
    {category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE},
    {category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE},
    {category: HarmCategory.HARM_CATEGORY_IMAGE_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE}

];

// creates a new chat and returns it
async function createNewChat(): Promise<Chat>{

    const chat:Chat = await aiClient.chats.create(

        {
            model: MODEL_ID,
            config: {
                safetySettings: safetySettings,
                systemInstruction: system_instruction
            }
        }

    );

    return chat;

}


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