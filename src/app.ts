import express from 'express';
import path from 'path';
import expressLayouts from 'express-ejs-layouts';
import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';
import dashRouter from './routes/dashboard';
import { SupabaseClient } from '@supabase/supabase-js';

export const supabaseKey = process.env.SUPABASE_KEY;
export const supabaseUrl = process.env.SUPABASE_URL;


if (!supabaseKey || !supabaseUrl){
  throw new Error("Missing the database key");
}




// --------------------------------------- AI CLIENT --------------------------
const aiClient = new GoogleGenAI({});



//----------------------------------------------- APP SETUP ---------------------------------
const app = express();
const port = process.env.PORT || 3000;


// layout setup templating
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../public/views'));
app.use(expressLayouts); 
app.use(express.static('public'));
app.set('layout', 'base');
app.use(express.urlencoded({extended: true}));
app.use(express.json());


//----------------------------------------------------- ROUTING ------------------------------
app.get('/', (req, res) =>  {
  res.render('home', {title : 'Home'});
});


import authRoutes from './routes/auth';
import { create } from 'domain';
app.use('/', authRoutes)

// dashboard route
app.use('/dashboard', dashRouter);



// ------------------------------------------------------- APP STARTUP   ----------------------
app.listen(port, () => {
  return console.log(`Server: http://localhost:${port}`);
});
