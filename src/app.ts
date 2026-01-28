import express from 'express';
import path from 'path';
import expressLayouts from 'express-ejs-layouts';



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

import dashRouter from './routes/dashboard';
app.use('/dashboard', dashRouter);

import callbackRouter from "./routes/callbackRedirect";
app.use('/callbackRedirect', callbackRouter);


// ------------------------------------------------------- APP STARTUP   ----------------------
app.listen(port, () => {
  return console.log(`Server: http://localhost:${port}`);
});
