import { Hono } from "hono";
import { HTTPException } from 'hono/http-exception';
import { type User } from '@supabase/supabase-js';
import { getCharacterIdByUserId } from "../controllers/characters.js";
import { getFarmingPlots, postPlantCrop } from "../controllers/farming.js";
import { getCropBySeedId } from "../controllers/crops.js";
import { findItemInInventory, removeItemFromInventory } from "../controllers/inventory.js";

type Variables = {
    user: { user: User };
}

const farming = new Hono<{ Variables: Variables }>();

farming.get('/', async (c) => {
    try {
        const user = c.get('user').user;
        const characterId = await getCharacterIdByUserId(user.id);
        if (characterId === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        const plots = await getFarmingPlots(characterId);
        return c.json(plots);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

farming.post('/plant', async (c) => {
    try {
        // Find the crop for the given seed id
        const seedId = c.req.query('id');
        if (!seedId) {
            throw new HTTPException(400, { message: `missing query param 'id'` });
        }
        const cropRows = await getCropBySeedId(seedId);
        if (cropRows.length < 1) {
            throw new HTTPException(404, { message: `crop for given seed not found` });
        }
        // Check if character has the seed in their inventory and has a farm plot available
        const user = c.get('user').user;
        const characterId = await getCharacterIdByUserId(user.id);
        if (characterId === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        const item = await findItemInInventory(characterId, Number(seedId), 1);
        const plots = await getFarmingPlots(characterId);
        // TODO: Change the hard coded 3 to a variable somewhere
        if (plots.length >= 3) {
            throw new HTTPException(500, { message: 'no available farm plots' });
        }
        // Remove seed from inventory
        await removeItemFromInventory(characterId, Number(seedId), 1);
        // Create a new farm plot for the character with the crop
        await postPlantCrop(characterId, cropRows[0].id, cropRows[0].grow_time);
        return c.json({ message: 'crop planted succesfully' });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default farming;