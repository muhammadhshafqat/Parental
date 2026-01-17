import express from 'express';
import path from 'path';
import expressLayouts from 'express-ejs-layouts';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import dashRouter from './routes/dashboard';
dotenv.config();

// ------------------------------ DATABASE SETUP ---------------------------

import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey || !supabaseUrl){
  throw new Error("Missing Url and Key");
}

export const supabase = createClient(supabaseUrl, supabaseKey);




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
app.use('/', authRoutes)

// dashboard route
app.use('/dashboard', dashRouter);



// ------------------------------------------------------- APP STARTUP   ----------------------
app.listen(port, () => {
  return console.log(`Server: http://localhost:${port}`);
});
