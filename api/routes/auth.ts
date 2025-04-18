import { Hono } from "hono";
import { setCookie } from 'hono/cookie'
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

    console.log(data);
    setCookie(
        c,
        'access_token',
        data.session?.access_token || '',
        {
            httpOnly: true,
            secure: true,
            path: '/',
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
            path: '/'
        }
    )

    return c.json(data);
});

export default auth;