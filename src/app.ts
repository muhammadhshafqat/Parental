import express from 'express';
import path from 'path';
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../public/views'));

app.get('/', (req, res) => {
  res.send('Hello Hassan World!');
});

app.get('/home', (req, res) =>  {
  res.render('home');
});

app.listen(port, () => {
  return console.log(`Server: http://localhost:${port}`);
});
