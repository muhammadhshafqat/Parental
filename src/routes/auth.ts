import {Router, Request, Response} from 'express';
import { supabase } from '../app';

const router = Router();

router.get('/login', (req, res) => {
  res.render('login', {title: 'Login'});
})

router.get('/register', (req,res) =>{
  res.render('register', {title: 'Create Account'});
})


router.post('/login', async (req: Request, res:Response) => {
    const {email, password} = req.body;
    const {data, error} = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) {
        return res.render('login', {title: 'Login', error: error.message});
    }

    res.redirect('/dashboard');
})

export default router;