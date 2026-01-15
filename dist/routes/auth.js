"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});
router.get('/register', (req, res) => {
    res.render('register', { title: 'Create Account' });
});
exports.default = router;
//# sourceMappingURL=auth.js.map