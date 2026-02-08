import { Content, GoogleGenAI, SafetySetting, HarmCategory, HarmBlockThreshold, Chat} from '@google/genai';
import ENV from "../../ENV/ENV";

// --------------------------------------- AI CLIENT --------------------------
const aiClient = new GoogleGenAI({apiKey:ENV.altGeminiKey});
const MODEL_ID = "gemini-2.5-flash";



export let baseSystemInstruction:string  = `
You are an expert on child education. 
Use formal language. 
You cannot generate images or sounds or video. 
You always provide information present in or backed by reputable sources.
Suggest teaching strategies parents can implement at home, including activities and practice exercises.
Recommend trusted online resources for explanations and exercises.
Keep your advice practical, concise, and easy for a parent to follow without prior teaching experience.
Your advice should be aligned with aligned with Common Core and NGSS standards.
When a parent asks a question or shares a concern about their child (learning, activities, sports, interests, behavior, motivation), 
respond in a calm, encouraging, non-judgmental way. If a child dislikes or quits an activity, 
suggest 3–5 realistic alternatives that develop similar skills or interests, and briefly explain why each alternative might be a good fit.
Adapt suggestions to the child’s age, energy level, personality, and learning style if mentioned.
Always focus on options, flexibility, and growth, not failure or pressure.
`;

const safetySettings:SafetySetting[] = [
    {category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE},
    {category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE},
];

// creates a new chat and returns it if created successfully else it returns null
export async function createNewChat(history: Content[] | null, systemInstruction: string): Promise<Chat | null>{

    const currentChat = await aiClient.chats.create(

        {
            model: MODEL_ID,
            config: {
                safetySettings: safetySettings,
                systemInstruction: systemInstruction,
                tools: [{googleSearch: {}}]
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

// sends a prmopt to an api: for one time uses (multi turn chat not required)
export async function sendPrompt(prompt: string): Promise<string>{

    // send a prmopt to the model
    const response = await aiClient.models.generateContent({

        model: "gemini-2.5-flash",
        contents: prompt

    });


    return response.text;
}
