import express from 'express';
import path from 'path';
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get()

app.listen(port, () => {
  return console.log(`Server: http://localhost:${port}`);
});
