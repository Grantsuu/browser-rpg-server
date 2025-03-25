import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type User } from '@supabase/supabase-js';
import { getCrops } from "../controllers/crops.js";

type Variables = {
    user: { user: User };
}

const crops = new Hono<{ Variables: Variables }>();

export default crops;

crops.get('/', async (c) => {
    try {
        const crops = await getCrops();
        return c.json(crops);
    }
    catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});
