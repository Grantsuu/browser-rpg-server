import { Hono } from "hono";
import { deleteCookie, setCookie } from 'hono/cookie'
import { HTTPException } from "hono/http-exception";
import { supabase } from '../lib/supabase.js';

const auth = new Hono();

auth.post('/login', async (c) => {
    const { email, password } = await c.req.json();
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.log(error);
        throw new HTTPException(401, { message: 'invalid credentials' });
    }

    setCookie(
        c,
        'access_token',
        data.session?.access_token || '',
        {
            httpOnly: true,
            secure: true,
            path: '/',
            sameSite: 'none',
            expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour 
        }
    );

    setCookie(
        c,
        'refresh_token',
        data.session?.refresh_token || '',
        {
            httpOnly: true,
            secure: true,
            path: '/',
            sameSite: 'none',
        }
    )

    return c.json(data);
});

auth.get('/logout', async (c) => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.log(error);
        throw new HTTPException(401, { message: 'unable to logout' });
    }
    deleteCookie(c, 'access_token');
    deleteCookie(c, 'refresh_token');
    return c.json({ message: 'logged out' });
});

export default auth;