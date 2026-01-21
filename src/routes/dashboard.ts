import { Router, Request, Response } from "express";
import * as appTypes from "../utils/common";
// import { getData } from "../utils/database";
import { User } from "@supabase/supabase-js";
import { createClient } from "../app";

const dashRouter: Router = Router();

// // checks authentication
export async function requireAuth(req: Request, res: Response, next) {
  
  // creating the server client
  const supabaseServerClient = createClient({req, res});

  const {data: user} = await supabaseServerClient.auth.getUser();


  if (!user.user){

    console.log("No user logged in");
    res.redirect('/login');
    return;

  }else{
    console.log(`User  authorized`);
    next();    
  }

  return;

};

dashRouter.use(requireAuth);

dashRouter.get('/', (req, res)=>{

  console.log("in dashRouter");
  res.render('dashboard' , {layout: 'dashboard-base'})

});

export default dashRouter;
