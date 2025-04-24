import { getCookie, setCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';

export const authorization = createMiddleware(async (c, next) => {
    if (c.req.path.startsWith('/auth')) {
        // Skip authorization for auth routes
        return await next();
    }

    const accessToken = getCookie(c, 'access_token');
    const refreshToken = getCookie(c, 'refresh_token');

    if (!accessToken && !refreshToken) {
        console.log(c.req);
        throw new HTTPException(401, { message: 'Unauthorized' });
    }

    if (!accessToken) {
        // If the access token is expired, try to refresh it
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({ refresh_token: refreshToken as string });
        if (refreshError) {
            // If refreshing the session fails, redirect to login
            return c.redirect('/login');
        }
        // console.log('Refreshed session:', refreshData);

        // Set new access token and refresh token in cookies
        setCookie(
            c,
            'access_token',
            refreshData?.session?.access_token || '',
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
            refreshData?.session?.refresh_token || '',
            {
                httpOnly: true,
                secure: true,
                path: '/',
                sameSite: 'none',
            }
        )

        supabase.auth.setSession({
            access_token: refreshData?.session?.access_token as string,
            refresh_token: refreshData?.session?.refresh_token as string,
        });

        c.set('user', refreshData.user);
    } else {
        const { data, error } = await supabase.auth.getUser(accessToken);

        if (error) {
            throw new HTTPException(500, { message: error.message });
        }

        supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken as string,
        });

        c.set('user', data);
    }

    await next();
});