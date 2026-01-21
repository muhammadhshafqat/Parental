import express from 'express';
import path from 'path';
import expressLayouts from 'express-ejs-layouts';
import ENV from "./ENV/ENV";
import { GoogleGenAI } from '@google/genai';
import dashRouter from './routes/dashboard';
import { SupabaseClient } from '@supabase/supabase-js';

const supabaseKey = ENV.supabaseKey;
const supabaseUrl = ENV.supabaseUrl;


if (!supabaseKey || !supabaseUrl){
  throw new Error("Missing the database key");
}


// ------------------------- DATABASE ------------
export const supabase = new SupabaseClient(supabaseUrl, supabaseKey);

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

import dasgRouter from './routes/dashboard';
app.use('/dashboard', dashRouter);



// ------------------------------------------------------- APP STARTUP   ----------------------
app.listen(port, () => {
  return console.log(`Server: http://localhost:${port}`);
});
