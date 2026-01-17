import { Router, Request, Response } from "express";

const dashRouter: Router = Router();


// need to implement security middleware to prevent non-login users from accessing dashboard
dashRouter.get('/', (reqs, res) => {
    res.render('dashboard', {title: 'dashboard'});
});

export default dashRouter;