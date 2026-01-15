import express from 'express';
import path from 'path';
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello Hassan World!');
});

app.get('/home', (req, res) =>  {
  res.send("THIS IS THE HOME PAGE");
});

app.listen(port, () => {
  return console.log(`Server: http://localhost:${port}`);
});
