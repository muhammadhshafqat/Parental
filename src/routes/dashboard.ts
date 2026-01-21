import { Router, Request, Response, NextFunction } from "express";
import * as appTypes from "../utils/common";
import { createClient } from "../utils/database/server-database";



const dashRouter: Router = Router();

async function requireAuth(req: Request, res: Response, next: NextFunction) {

	const supabase = createClient({req, res});

	const {data, error} = await supabase.auth.getUser();

	if(error){

		res.redirect('/login');

	}else{

		next();

	}

}

dashRouter.use(requireAuth);

dashRouter.get('/', (req, res) => {

    res.render('dashboard', { layout: 'dashboard-base' })

});

export default dashRouter;
