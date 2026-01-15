"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const express_ejs_layouts_1 = __importDefault(require("express-ejs-layouts"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
//database
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseKey || !supabaseUrl) {
    throw new Error("Missing Url and Key");
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
// set app
const app = (0, express_1.default)();
const port = process.env.PORT;
// layout setup templating
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, '../public/views'));
app.use(express_ejs_layouts_1.default);
app.use(express_1.default.static('public'));
app.set('layout', 'base');
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.render('home', { title: 'Home' });
});
const auth_1 = __importDefault(require("./routes/auth"));
app.use('/', auth_1.default);
app.get('/dashboard', (req, res) => {
    res.render('dashboard', { title: 'Dashboard' });
});
app.listen(port, () => {
    return console.log(`Server: http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map