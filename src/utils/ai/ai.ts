import { Content, GoogleGenAI, SafetySetting, HarmCategory, HarmBlockThreshold, Chat, GenerateContentResponse} from '@google/genai';
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

// creates a new chat and returns it if created successfully else it returns null
export async function createNewChat(history: Content[] | null): Promise<Chat | null>{

    const currentChat = await aiClient.chats.create(

        {
            model: MODEL_ID,
            config: {
                safetySettings: safetySettings,
                systemInstruction: system_instruction
            },
            ...(history && {history}) 
        }

    );
    

    if (currentChat){
        return currentChat;
    }else {
        return null;
    }

}


export async function sendPromptToApi(prompt: string, chat: Chat): Promise<string>{

    const response: GenerateContentResponse = await chat.sendMessage({
        message: prompt,
    });

    return response.data;
}