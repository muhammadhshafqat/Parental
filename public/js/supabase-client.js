import { createBrowserClient } from "@supabase/ssr";

let supabase;

export const getSupabase = () =>{

    if (!supabase){

        supabase = createBrowserClient(
            "https://mhqnhqqvdcpqononniwe.supabase.co",
            'sb_publishable_nHe0kFr8YQYGMK86hhtX8g_NIjvg_5o'
        );

    }

    return supabase;
}