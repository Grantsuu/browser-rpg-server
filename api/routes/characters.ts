import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type User } from '@supabase/supabase-js';
import { getCharacterGold, getCharacterIdByUserId } from '../controllers/characters.js'

type Variables = {
    user: { user: User };
}

const characters = new Hono<{ Variables: Variables }>();

characters.get('/gold', async (c) => {
    try {
        const user = c.get('user').user;
        const characterId = await getCharacterIdByUserId(user.id);
        const currentGold = await getCharacterGold(characterId);
        return c.json(currentGold);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default characters;