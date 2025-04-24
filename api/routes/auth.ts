import { Hono, type Context } from "hono";
import { deleteCookie, setCookie } from 'hono/cookie'
import { HTTPException } from "hono/http-exception";
import { type EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase.js';

const auth = new Hono();

const originUrl = process.env.ORIGIN_URL as string;

const setAuthCookies = (c: Context, accessToken: string, refreshToken: string) => {
    // Set access token
    setCookie(
        c,
        'access_token',
        accessToken,
        {
            httpOnly: true,
            secure: true,
            path: '/',
            sameSite: 'none',
            expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour 
        }
    );

    // Set refresh token
    setCookie(
        c,
        'refresh_token',
        refreshToken,
        {
            httpOnly: true,
            secure: true,
            path: '/',
            sameSite: 'none',
        }
    )
}

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

    setAuthCookies(c, data.session?.access_token || '', data.session?.refresh_token || '');

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

auth.get('/confirm', async (c) => {
    const token_hash = c.req.query('token_hash');
    const type = c.req.query('type');
    const next = c.req.query('next') ?? '/';

    if (token_hash && type) {
        const { data, error } = await supabase.auth.verifyOtp({
            type: (type as EmailOtpType),
            token_hash,
        });

        if (!error) {
            setAuthCookies(c, data.session?.access_token || '', data.session?.refresh_token || '');
            return c.redirect(`${originUrl}/${next.slice(1)}`, 303)
        }
    }

    // TODO: Need to redirect to an auth error page here
});

export default auth;