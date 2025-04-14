import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type User } from '@supabase/supabase-js';
import { createCombatByCharacterId, getCombatByCharacterId, getTrainingAreas, getMonstersByArea, getMonsterById, updateCombatByCharacter } from "../controllers/combat.js";
import { getCharacterByUserId } from "../controllers/characters.js";

type Variables = {
    user: { user: User };
}

const combat = new Hono<{ Variables: Variables }>();

export type CombatActions = "start" | "attack" | "defend" | "flee" | "use_item";

// Get training areas 
combat.get('/training/areas', async (c) => {
    try {
        const trainingAreas = await getTrainingAreas();
        return c.json(trainingAreas);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Get monsters by area
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

// Get combat data by character ID
combat.get('/', async (c) => {
    const user = c.get('user').user;
    const character = await getCharacterByUserId(user.id);
    const characterId = character?.id;
    if (characterId === "") {
        throw new HTTPException(404, { message: 'character not found' });
    }
    try {
        const combatData = await getCombatByCharacterId(characterId);
        return c.json(combatData);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Create new combat data for character
combat.post('/', async (c) => {
    const user = c.get('user').user;
    const character = await getCharacterByUserId(user.id);
    const characterId = character?.id;
    if (characterId === "") {
        throw new HTTPException(404, { message: 'character not found' });
    }
    try {
        const newCombat = await createCombatByCharacterId(character.id);
        return c.json(newCombat);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Update combat encounter
combat.put('/', async (c) => {
    const action = c.req.query('action');
    if (!action) {
        return c.json({ message: 'action query parameter is required' }, 400);
    }
    const user = c.get('user').user;
    const character = await getCharacterByUserId(user.id);
    const characterId = character?.id;
    if (characterId === "") {
        throw new HTTPException(404, { message: 'character not found' });
    }

    switch (action) {
        case "start":
            // Start new combat
            const monsterId = c.req.query('monster_id');
            if (!monsterId) {
                return c.json({ message: 'monster_id query parameter is required to start combat' }, 400);
            }
            try {
                // Get player data
                // Get monster data
                const monster = await getMonsterById(monsterId);
                // if (!monster) {
                //     return c.json({ message: 'monster not found' }, 404);
                // }

                const combat = await updateCombatByCharacter(character, {}, {}, monster);
                return c.json(combat);
            } catch (error) {
                throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
            }
            break;
        case "attack":
            // Handle attack action
            break;
        case "defend":
            // Handle defend action
            break;
        case "flee":
            // Handle flee action
            break;
        case "use_item":
            // Handle use_item action
            break;
        default:
            return c.json({ message: 'invalid action' }, 400);
    }
});

export default combat;