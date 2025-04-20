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
        if (error.status === 400) {
            throw new HTTPException(error.status, { message: 'Invalid login credentials' });
        } else {
            throw new HTTPException(500, { message: 'Error logging in' });
        }
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

    return c.json({ message: 'logged in successfully' });
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

auth.post('/register', async (c) => {
    const { email, password, redirectUrl } = await c.req.json();
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: redirectUrl
        }
    });

    if (error) {
        console.log(error);
        if (error.status === 400) {
            throw new HTTPException(error.status, { message: 'Invalid registration credentials' });
        } else {
            throw new HTTPException(500, { message: 'Error registering' });
        }
    }

    return c.json({ message: 'registered successfully' });
});

auth.post('/reset-password', async (c) => {
    const { email, redirectUrl } = await c.req.json();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl + '/login-access-token',

    });
    if (error) {
        console.log(error);
        if (error.status === 400) {
            throw new HTTPException(error.status, { message: 'Invalid email' });
        } else {
            throw new HTTPException(500, { message: 'Error sending reset password email' });
        }
    }
    return c.json({ message: 'reset password email sent' });
});

auth.post('/update-password', async (c) => {
    const { password } = await c.req.json();
    const { error } = await supabase.auth.updateUser({ password: password });
    if (error) {
        console.log(error);
        if (error.status === 400) {
            throw new HTTPException(error.status, { message: 'Invalid password' });
        } else {
            throw new HTTPException(500, { message: 'Error updating password' });
        }
    }
    return c.json({ message: 'password updated successfully' });
});

export default auth;