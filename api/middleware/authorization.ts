import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.ts';

export const authorization = createMiddleware(async (c, next) => {
    const jwt = c.req.header('Authorization')?.replace('Bearer ', '');

    if (!jwt) {
        throw new HTTPException(401, { message: 'Authorization header missing or malformed.' });
    }

    const { data, error } = await supabase.auth.getUser(jwt);
    if (error) {
        throw new HTTPException(500, { message: error.message });
    }

    c.set('user', data);

    await next();
});