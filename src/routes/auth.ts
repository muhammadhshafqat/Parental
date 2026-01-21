import {Router, Request, Response} from 'express';
import { createClient } from '../utils/database';
const router = Router();

router.get('/login', (req, res) => {
  res.render('login', {title: 'Login'});
})

router.get('/register', (req,res) =>{
  res.render('register', {title: 'Create Account'});
})

router.post('/login', async (req: Request, res:Response) => {

    const supabase = createClient({req,res});

    const {email, password} = req.body;

    const {data, error} = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) {
        console.log("Wrong Password");
        console.log(error.message);
        return res.render('login', {title: 'Login', error: error.message});
    }

    

    // res.cookie('sb-access-token', data.session.access_token, {httpOnly: true});
    res.redirect('/dashboard');
})

router.post('/register', async (req:Request, res:Response) => {
    const {email, password, cpassword, dob, name} = req.body;
    if (cpassword != password){
        return res.render('register', {title: "Register", error: "Passwords do not match"});
    }
    
    const supabase = createClient({req, res});

    const {data,error} = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
                dob,
            }
        }
    })
    if (error) {
        return res.render('register', {title: 'Register', error: error.message});
    }
    res.redirect('/dashboard')
})


export default router;