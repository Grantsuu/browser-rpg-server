import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type User } from '@supabase/supabase-js';
import { getTrainingAreas } from "../controllers/combat.js";

type Variables = {
    user: { user: User };
}

const combat = new Hono<{ Variables: Variables }>();

combat.get('/training/areas', async (c) => {
    try {
        const trainingAreas = await getTrainingAreas();
        return c.json(trainingAreas);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default combat;