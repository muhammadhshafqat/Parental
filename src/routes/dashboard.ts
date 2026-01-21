import { Router, Request, Response } from "express";
import * as appTypes from "../utils/common";
// import { getData } from "../utils/database";
import { supabase } from "../app";

const dashRouter: Router = Router();

// // checks authentication
export async function requireAuth(req: Request, res: Response, next) {
  

  const {data: user} = await supabase.auth.getUser();


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

  res.render('dashboard' , {layout: 'dashboard-base'})

});

export default dashRouter;
