"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = 3000;
app.get('/', (req, res) => {
    res.send('Hello Hassan World!');
});
app.get('/home', (req, res) => {
    res.send("THIS IS THE HOME PAGE");
});
app.listen(port, () => {
    return console.log(`Server: http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map