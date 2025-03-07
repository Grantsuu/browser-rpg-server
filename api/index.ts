import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors'
import shop from './routes/shop.ts';

const app = new Hono()

app.use(cors());

app.get('/', (c) => {
    return c.text('Hello Hono!')
})
app.route('/shop', shop)

serve({
    fetch: app.fetch,
    port: 8080
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
})
