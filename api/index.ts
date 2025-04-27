import { Hono } from 'hono';
import { env } from 'hono/adapter'
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { serve } from '@hono/node-server';
import { authorization } from './middleware/authorization.js'; // have to import these .ts files as .js for Vercel
import auth from './routes/auth.js';
import characters from './routes/characters.js'
import shop from './routes/shop.js';
import inventory from './routes/inventory.js';
import crafting from './routes/crafting.js';
import farming from './routes/farming.js';
import crops from './routes/crops.js';
import fishing from './routes/fishing.js';
import combat from './routes/combat.js';
import items from './routes/items.js';
import equipment from './routes/equipment.js';

const app = new Hono()

// CORS Policy
app.use(cors(
    { credentials: true, origin: [process.env.ORIGIN_URL as string] }
));

// Authorization middleware
app.use(authorization);

// Auth
app.route('/auth', auth);
// Character
app.route('/characters', characters);
// Shop
app.route('/shop', shop);
// Inventory
app.route('/inventory', inventory);
// Training
app.route('/combat', combat);
// Crafting
app.route('/crafting', crafting);
// Farming
app.route('/farming', farming);
// Crops
app.route('/crops', crops);
// Fishing
app.route('/fishing', fishing);
// Items
app.route('/items', items);
// Equipment
app.route('/equipment', equipment);

// Error handling
app.onError(async (err, c) => {
    console.log(err);
    if (err instanceof HTTPException) {
        c.status(err.status);
        return c.json(err.message);
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
