import { Hono } from "hono";
import { HTTPException } from 'hono/http-exception';
import { type User } from '@supabase/supabase-js';
import { addFarmingExperience, getCharacterIdByUserId } from "../controllers/characters.js";
import { getFarmingPlots, getFarmingPlotById, deletePlot, plantCrop } from "../controllers/farming.js";
import { getCropBySeedId } from "../controllers/crops.js";
import { addItemToInventory, findItemInInventory, removeItemFromInventory } from "../controllers/inventory.js";
import { getRandomNumberBetween } from "../utilities/functions.js";

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

farming.delete('/', async (c) => {
    try {
        const plotId = c.req.query('id');
        if (!plotId) {
            throw new HTTPException(400, { message: `missing query param 'id'` });
        }
        const plot = await getFarmingPlotById(plotId);
        if (plot.length < 1) {
            throw new HTTPException(404, { message: `plot not found` });
        }
        const user = c.get('user').user;
        const characterId = await getCharacterIdByUserId(user.id);
        if (characterId === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        if (plot[0].character_id !== characterId) {
            throw new HTTPException(500, { message: 'plot does not belong to character' });
        }
        await deletePlot(plotId);
        return c.json({ message: 'plot deleted succesfully' });
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
        const tzOffset = c.req.query('tz_offset');
        if (!tzOffset) {
            throw new HTTPException(400, { message: `missing query param 'tz_offset'` });
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
        await plantCrop(characterId, cropRows[0].id, cropRows[0].grow_time, Number(tzOffset));
        return c.json({ message: 'crop planted succesfully' });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

farming.post('/harvest', async (c) => {
    try {
        // Find the plot
        const plotId = c.req.query('id');
        if (!plotId) {
            throw new HTTPException(400, { message: `missing query param 'id'` });
        }
        const plot = await getFarmingPlotById(plotId);
        if (plot.length < 1) {
            throw new HTTPException(404, { message: `plot not found` });
        }
        // Check if plot matches the character id
        const user = c.get('user').user;
        const characterId = await getCharacterIdByUserId(user.id);
        if (characterId === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        if (plot[0].character_id !== characterId) {
            throw new HTTPException(500, { message: 'plot does not belong to character' });
        }
        // Check if plot is ready to harvest
        const currentTime = new Date();
        if (new Date(plot[0].end_time) > currentTime) {
            throw new HTTPException(500, { message: 'plot is not ready to harvest' });
        }
        // Delete the plot
        await deletePlot(plotId);
        await addFarmingExperience(characterId, plot[0].crop.experience);
        // Add the product to the inventory
        const amount = getRandomNumberBetween(Number(plot[0].crop.amount_produced[0]), Number(plot[0].crop.amount_produced[1]));
        await addItemToInventory(characterId, plot[0].crop.product.id, amount);
        return c.json({ message: 'crop harvested succesfully', amount: amount });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default farming;