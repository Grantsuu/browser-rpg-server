import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type User } from '@supabase/supabase-js';
import { getCharacter, postCreateCharacter, postCharacterCombatStats } from '../controllers/characters.js'
import { getCharacterLevels, postCreateCharacterLevels } from "../controllers/character_levels.js";
import { createFarmingPlot } from "../controllers/farming.js";
import { createFishingGame } from "../controllers/fishing.js";
import { createCombat } from "../controllers/combat.js";

type Variables = {
    user: { user: User };
}

const characters = new Hono<{ Variables: Variables }>();

// Get character
characters.get('/', async (c) => {
    try {
        const user = c.get('user').user;
        const character = await getCharacter();
        if (!character) {
            throw new HTTPException(404, { message: 'character not found' });
        }
        return c.json(character);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Get levels
characters.get('/levels', async (c) => {
    try {
        const characterLevels = await getCharacterLevels();
        return c.json(characterLevels);
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
        const character = await getCharacter();
        if (character !== "") {
            throw new HTTPException(500, { message: 'character already exists for this user' });
        }
        const newCharacter = await postCreateCharacter(user.id, name);

        // Create character levels table entry
        await postCreateCharacterLevels(newCharacter.id);
        // Create character combat stats table entry
        await postCharacterCombatStats(newCharacter.id);
        // Create combat table entry
        await createCombat(newCharacter.id);
        // Create a farm plot for the new character
        await createFarmingPlot(newCharacter.id);
        // Create a fishing game for the new character
        await createFishingGame(newCharacter.id);
        return c.json({ message: 'character created' });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default characters;