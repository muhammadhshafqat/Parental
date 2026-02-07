import dotenv from "dotenv"
dotenv.config();

const ENV = {
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_KEY || '',
    supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
    geminiKey: process.env.GEMINI_API_KEY || '',
    port: process.env.PORT || 3000,
    altGeminiKey: process.env.OTHER_GEMINI_API_KEY || ''

}

if (!ENV.geminiKey || !ENV.altGeminiKey || !ENV.supabaseKey || !ENV.supabasePublishableKey || !ENV.supabaseUrl){

    throw new Error("One or more environment variable is not available");

}

export default ENV;