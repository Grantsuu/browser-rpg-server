import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type User } from '@supabase/supabase-js';
import { getTrainingAreas, getMonstersByArea } from "../controllers/combat.js";

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

combat.get('/monsters', async (c) => {
    const areaName = c.req.query('area');
    if (!areaName) {
        return c.json({ message: 'area query parameter is required' }, 400);
    }
    try {
        const monsters = await getMonstersByArea(areaName);
        return c.json(monsters);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default combat;