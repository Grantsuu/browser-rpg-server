import { Hono } from "hono";
import { HTTPException } from 'hono/http-exception';
import { type User } from '@supabase/supabase-js';
import { addExperience, getCharacterByUserId, getCharacterIdByUserId } from "../controllers/characters.js";
import { clearFishingGame, startFishingGame, getFishingState, updateFishingGame, getFishingAreaByName } from "../controllers/fishing.js";

type Variables = {
    user: { user: User };
}

const fishing = new Hono<{ Variables: Variables }>();

// Get fishing game state for user
fishing.get('/', async (c) => {
    try {
        const user = c.get('user').user;
        const characterId = await getCharacterIdByUserId(user.id);
        if (characterId === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        const fishing = await getFishingState(characterId);
        if (fishing === null) {
            throw new HTTPException(404, { message: 'fishing game not found' });
        }
        return c.json(fishing);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Start a new fishing game
fishing.put('/start', async (c) => {
    try {
        const areaName = c.req.query('area');
        if (areaName === undefined) {
            throw new HTTPException(400, { message: 'area is required' });
        }
        const area = await getFishingAreaByName(areaName);
        if (!area) {
            throw new HTTPException(404, { message: 'area not found' });
        }
        const user = c.get('user').user;
        const character = await getCharacterByUserId(user.id);
        if (character.id === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        if (character.fising_level < area.required_level) {
            throw new HTTPException(400, { message: 'level too low' });
        }
        // const fishing = await getFishingState(character.id);
        // if (fishing.game_state !== null) {
        //     throw new HTTPException(400, { message: 'fishing game already exists' });
        // }
        const fishingGame = await startFishingGame(character.id, area.name);
        if (fishingGame === null) {
            throw new HTTPException(500, { message: 'unable to create fishing game' });
        }
        return c.json(fishingGame);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Update fishing game state
fishing.put('/', async (c) => {
    try {
        const user = c.get('user').user;
        const characterId = await getCharacterIdByUserId(user.id);
        if (characterId === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        const fishing = await getFishingState(characterId);
        if (fishing === null) {
            throw new HTTPException(404, { message: 'fishing game not found' });
        }
        const turns = fishing.turns + 1;
        const gameState = fishing.game_state;
        const fishingGame = await updateFishingGame(characterId, turns, gameState);
        if (fishingGame === null) {
            throw new HTTPException(500, { message: 'unable to update fishing game' });
        }
        return c.json(fishingGame);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});


export default fishing;