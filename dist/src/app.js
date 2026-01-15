"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express'); // import express
const app = express(); // create an app instance
const PORT = 3000;
// middleware to parse JSON
app.use(express.json());
// simple route
app.get('/', (req, res) => {
    res.send('Hello, Express!');
});
// start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
//# sourceMappingURL=app.js.map