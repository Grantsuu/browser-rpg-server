import { Hono } from "hono";
import { HTTPException } from 'hono/http-exception';
import { type User } from '@supabase/supabase-js';
import { addExperience, getCharacterByUserId, getCharacterIdByUserId } from "../controllers/characters.js";
import { clearFishingGame, createFishingGame, getFishingState, updateFishingGame } from "../controllers/fishing.js";

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

// Create a new fishing game
fishing.post('/', async (c) => {
    try {
        const user = c.get('user').user;
        const character = await getCharacterByUserId(user.id);
        if (character.id === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        const fishing = await getFishingState(character.id);
        if (fishing !== null) {
            throw new HTTPException(400, { message: 'fishing game already exists' });
        }
        const { area } = await c.req.json();
        if (area === undefined) {
            throw new HTTPException(400, { message: 'area is required' });
        }
        // TODO: check if area is valid and character has level to fish there
        // if (character.level < 1) {
        //     throw new HTTPException(400, { message: 'level too low' });
        // }
        const fishingGame = await createFishingGame(character.id, area);
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