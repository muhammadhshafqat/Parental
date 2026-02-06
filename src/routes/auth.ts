import {Router, Request, Response, NextFunction} from 'express';
import { createClient } from '../utils/database/server-database';
const router = Router();

router.get('/login', (req, res) => {
  res.render('login', {title: 'Login'});
})

router.get('/register', (req,res) =>{
  res.render('register', {title: 'Create Account'});
})

router.post('/login', async (req: Request, res:Response) => {


    const {email, password} = req.body;

    const supabase = createClient({req, res});

    const {data, error} = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) {
        console.log(error.message);
        return res.render('login', {title: 'Login', error: error.message});
    }

    res.cookie('sb-access-token', data.session.access_token, {httpOnly: true});
    res.redirect('/dashboard');
})

router.post('/register', async (req:Request, res:Response, next: NextFunction) => {
    const {email, password, cpassword, dob, name} = req.body;
    if (cpassword != password){
        return res.render('register', {title: "Register", error: "Passwords do not match"});
    }
    
    const supabase = createClient({req, res});


    const {data:authData,error: authError} = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    dob,
                }
            }
        });

    if(authError){
        return res.render("register", {title: "Register", error: authError.message});
    }

    const {error: dbError} = await supabase.from("users").insert({email: email, dob: dob, name: name, id: authData.user.id});

    if(dbError){
        console.log("Could not create user profile:", dbError);
        return next(dbError);

    }

    res.redirect('/dashboard');
});


export default router;