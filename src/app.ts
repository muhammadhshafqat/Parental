import express from 'express';
import path from 'path';
import expressLayouts from 'express-ejs-layouts';


const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../public/views'));
app.use(expressLayouts); 
app.set('layout', 'base');

app.get('/', (req, res) => {
  res.send('Hello Hassan World!');
});

app.get('/home', (req, res) =>  {
  res.render('home', {title : 'Home'});
});

app.get('/login', (req, res) => {
  res.render('login', {title: 'Login'});
})

app.get('/register', (req,res) =>{
  res.render('register', {title: 'Create Account'});
})

app.listen(port, () => {
  return console.log(`Server: http://localhost:${port}`);
});
