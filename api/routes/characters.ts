import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type User } from '@supabase/supabase-js';
import { getCharacterGold, getCharacterByUserId, getCharacterIdByUserId, postCreateCharacter } from '../controllers/characters.js'

type Variables = {
    user: { user: User };
}

const characters = new Hono<{ Variables: Variables }>();

// Get character
characters.get('/', async (c) => {
    const user = c.get('user').user;
    const character = await getCharacterByUserId(user.id);
    return c.json(character);
});


// Get character gold
characters.get('/gold', async (c) => {
    try {
        const user = c.get('user').user;
        const characterId = await getCharacterIdByUserId(user.id);
        if (characterId === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        const currentGold = await getCharacterGold(characterId);
        return c.json(currentGold);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Create character
characters.post('/', async (c) => {
    try {
        const user = c.get('user').user;
        const name = c.req.query('name');
        if (!name) {
            throw new HTTPException(400, { message: `missing query param 'name'` });
        }
        const characterId = await getCharacterIdByUserId(user.id);
        if (characterId !== "") {
            throw new HTTPException(500, { message: 'character already exists for this user' });
        }
        const newCharacter = await postCreateCharacter(user.id, name);
        return c.json({ message: 'character created' });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default characters;