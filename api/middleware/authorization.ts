import { createMiddleware } from 'hono/factory';
import { supabase } from '../lib/supabase.ts';

export const authorization = createMiddleware(async (c, next) => {
    try {
        const authHeader = c.req.header('Authorization');
        console.log(authHeader);
        // Authorization request header
        if (!authHeader) {
            c.status(401);
            c.set('error', 'Unauthorized, no authorization header in request.');
            throw new Error('Unauthorized, no authorization header in request.');
        }
        // Check for malformed auth header
        const jwt = authHeader.split('Bearer ');
        if (jwt.length < 1) {
            c.status(401);
            throw new Error('Unauthorized, malformed authorization header.');
        }

        return c.json(jwt[1]);
        // const { data, error } = await supabase.auth.getUser(c.req.header('Authorization')?.split('Bearer ')[1]);
    } catch {

    }

    await next();
});