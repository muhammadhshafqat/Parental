import { Router, Request, Response, NextFunction } from "express";
import { supabase } from "../app";

const dashRouter: Router = Router();

// async function requireAuth(req: Request, res: Response, next: NextFunction) {
//   const token = req.cookies?.['sb-access-token'];
//   if (!token) {
//     return res.redirect('/login');
//   }

//   try {
//     const {data,error} = await supabase.auth.getUser(token);
//     if (error || !data.user) {
//       return res.redirect('/login');
//     }
//     next();
//   } catch (err) {
//     console.error(err);
//     return res.redirect('/login');
//   } 
// }

dashRouter.get('/', (req: Request, res: Response) => {
  res.locals.title = "Dashboard";
  res.locals.layout = "dashboard-base";
  res.render("dashboard", {layout: 'dashboard-base'});
});

export default dashRouter;
