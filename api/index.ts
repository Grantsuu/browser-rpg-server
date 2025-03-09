import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { serve } from '@hono/node-server';
import { authorization } from './middleware/authorization.js'; // have to import these .ts files as .js for Vercel
import inventory from './routes/inventory.js';
import shop from './routes/shop.js';
import crafting from './routes/crafting.js';

const app = new Hono()

// CORS Policy
app.use(cors());
// Authorization middleware
app.use(authorization);

// Shop
app.route('/shop', shop)
// Inventory
app.route('/inventory', inventory);
// Crafting
app.route('/crafting', crafting);

// Error handling
app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return err.getResponse()
    }
    c.status(500);
    return c.json(err);
})

serve({
    fetch: app.fetch,
    port: 8080
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
})
