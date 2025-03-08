import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { serve } from '@hono/node-server';
import { authorization } from './middleware/authorization.ts';
import inventory from './routes/inventory.ts';
import shop from './routes/shop.ts';

const app = new Hono()

app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return err.getResponse()
    }
    c.status(500);
    return c.json(err);
})

app.use(cors());
app.use(authorization);

app.get('/', (c) => {
    return c.text('Hello Hono!')
})
app.route('/inventory', inventory);
app.route('/shop', shop)

serve({
    fetch: app.fetch,
    port: 8080
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
})
