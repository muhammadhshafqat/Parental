import { createServerClient, serializeCookieHeader, parseCookieHeader } from "@supabase/ssr";
import { Request, Response, NextFunction } from "express";
import ENV from "../../ENV/ENV";
import { parse } from "dotenv";


// ------------------------- CREATE CLIENT FUNCTION------------
export const createClient =  (context: {req: Request, res: Response}) =>{

    return createServerClient(ENV.supabaseUrl, ENV.supabaseKey, {
        cookies:{
            getAll(){
                return parseCookieHeader(context.req.headers.cookie ?? '') as {name: string; value:string}[];
            },
            setAll(cookiesToSet){
                cookiesToSet.forEach(({name, value}) =>{
                    context.res.appendHeader('Set-Cookie', serializeCookieHeader(name, value, {}));
                });
            }
        }
    });

}