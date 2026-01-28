// this is the redirect route
import { createClient } from "../utils/database/server-database"
import { Router } from "express"

const callbackRouter = Router();

// routes/auth.js
callbackRouter.get('/', async (req, res) => {
    const code = req.query.code as string;
    const next = req.query.next || '/' as string;

    if (code) {
        const supabase = createClient({ req, res });
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return res.redirect(next as string);
        }
    }

    res.redirect('/login?error=auth_failed');
})

export default callbackRouter;