import { Router, Request, Response, NextFunction } from "express";
// import { supabase } from "../app";

const dashRouter: Router = Router();

dashRouter.get('/', (req: Request, res: Response) => {
  res.locals.title = "Dashboard";
  res.locals.layout = "dashboard-base";
  res.render("dashboard", {layout: 'dashboard-base'});
});

export default dashRouter;
