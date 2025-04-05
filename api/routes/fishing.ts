import { Hono } from "hono";
import { HTTPException } from 'hono/http-exception';
import { type User } from '@supabase/supabase-js';
import { addExperience, getCharacterByUserId, getCharacterIdByUserId } from "../controllers/characters.js";
import { startFishingGame, getFishingState, updateFishingGame, getFishingAreas, getFishingAreaByName, getFishByAreaName } from "../controllers/fishing.js";
import { censorFishingTiles, generateFishingTiles } from '../../game/utilities/functions.js';
import { type FishingGameState, type SupabaseFishing } from "../types/types.js";
import { addItemToInventory } from "../controllers/inventory.js";

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
        (fishing.game_state as FishingGameState).tiles = censorFishingTiles(fishing.game_state as FishingGameState);
        return c.json(fishing);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Get fishing areas
fishing.get('/areas', async (c) => {
    try {
        const crops = await getFishingAreas();
        return c.json(crops);
    }
    catch (error) {
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
        if (character.fishing_level < area.required_level) {
            throw new HTTPException(400, { message: 'level too low' });
        }
        let size, fish, bountiful = 0;
        if (area.size === 'Small') {
            size = 3;
            fish = 2;
            bountiful = 1;
        } else if (area.size === 'Medium') {
            size = 4;
            fish = 5;
            bountiful = 1;
        } else if (area.size === 'Large') {
            size = 5;
            fish = 6;
            bountiful = 2;
        } else {
            throw new HTTPException(400, { message: 'invalid area size' });
        }
        const tiles = generateFishingTiles(size, size, fish, bountiful);
        const fishingGame = await startFishingGame(character.id, area.name, {
            tiles: tiles
        } as FishingGameState);
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
        const row = c.req.query('row');
        if (row === undefined) {
            throw new HTTPException(400, { message: 'row is required' });
        }
        const col = c.req.query('col');
        if (col === undefined) {
            throw new HTTPException(400, { message: 'col is required' });
        }
        const user = c.get('user').user;
        const character = await getCharacterByUserId(user.id);
        if (character.id === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        const fishing = await getFishingState(character.id);
        if (fishing === null) {
            throw new HTTPException(404, { message: 'fishing game not found' });
        }
        const turns = fishing.turns + 1;
        (fishing.game_state as FishingGameState).tiles[Number(row)][Number(col)].isDiscovered = true;
        const fishingGame = await updateFishingGame(character.id, turns, fishing.game_state);
        // Check if the tile is a fish
        const content = (fishing.game_state as FishingGameState).tiles[Number(row)][Number(col)].content;
        let responseFish;
        let responseExperience;
        let levelChange = -1;
        let fishAmount = 0;
        if (content === 'fish' || content === 'bountiful') {
            // Add experience to character
            const possibleFish = await getFishByAreaName(fishing.area.name, character.fishing_level);
            if (possibleFish.length < 1) {
                throw new HTTPException(404, { message: 'fish not found' });
            }
            // Bountiful fish give 3 fish
            if (content === 'bountiful') {
                fishAmount = 3;
            } else {
                fishAmount = 1;
            }
            const fish = possibleFish[Math.floor(Math.random() * possibleFish.length)];
            // Add fish to inventory
            await addItemToInventory(character.id, fish.item_id, fishAmount);
            // Add experience to character
            levelChange = await addExperience(character, 'fishing', fish.experience * fishAmount);
            responseFish = fish;
            responseExperience = fish.experience * fishAmount;
        }
        const returnFishing = {
            id: fishing.id,
            area: fishing.area,
            previous_area: fishing.previous_area,
            character_id: fishing.character_id,
            game_state: {
                tiles: censorFishingTiles(fishing.game_state as FishingGameState),
            },
            turns: turns
        } as SupabaseFishing;
        return c.json({
            ...returnFishing,
            fish: responseFish ? responseFish : null,
            fish_amount: fishAmount > 0 ? fishAmount : null,
            experience: responseExperience ? responseExperience : null,
            level: levelChange > 0 ? levelChange : null
        });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});


export default fishing;