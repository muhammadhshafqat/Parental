import { Router } from "express";

const dashRouter: Router = Router();


// need to implement security middleware to prevent non-login users from accessing dashboard
dashRouter.use('/', (_, res) => {

    res.render('dashboard', {layout: 'dashboard-base'});

});

export default dashRouter;