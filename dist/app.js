"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const express_ejs_layouts_1 = __importDefault(require("express-ejs-layouts"));
const app = (0, express_1.default)();
const port = 3000;
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, '../public/views'));
app.use(express_ejs_layouts_1.default);
app.set('layout', 'base');
app.get('/', (req, res) => {
    res.send('Hello Hassan World!');
});
app.get('/home', (req, res) => {
    res.render('home', { title: 'Home' });
});
app.listen(port, () => {
    return console.log(`Server: http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map