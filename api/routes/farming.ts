import { Hono } from "hono";
import { HTTPException } from 'hono/http-exception';
import { type User } from '@supabase/supabase-js';
import { farm_plot_cost_table } from "../../game/constants/tables.js";
import { addExperience, getCharacter, updateCharacterGold } from "../controllers/characters.js";
import { getFarmingPlots, getFarmingPlotById, createFarmingPlot, clearPlot, plantCrop } from "../controllers/farming.js";
import { getCropBySeedId } from "../controllers/crops.js";
import { addItemToInventory, findItemInInventory, removeItemFromInventory } from "../controllers/inventory.js";
import { getRandomNumberBetween } from "../utilities/functions.js";

type Variables = {
    user: { user: User };
}

const farming = new Hono<{ Variables: Variables }>();

// Get farm plots for user
farming.get('/', async (c) => {
    try {
        const character = await getCharacter();
        if (!character) {
            throw new HTTPException(404, { message: 'character not found' });
        }
        const plots = await getFarmingPlots(character.id);
        return c.json(plots);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Get cost of next farm plot
farming.get('/plot-cost', async (c) => {
    try {
        const character = await getCharacter();
        if (character.id === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        const plots = await getFarmingPlots(character.id);
        if (plots.length < 1) {
            throw new HTTPException(500, { message: 'no farm plots found for character' });
        }
        let cost = -1;
        // Need to make sure the number of plots is less than the number of plots in the cost table
        if (plots.length < Object.keys(farm_plot_cost_table).length) {
            cost = farm_plot_cost_table[plots.length as keyof typeof farm_plot_cost_table];

        }
        return c.json({ cost: cost });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Buy a new farm plot
farming.post('/buy', async (c) => {
    try {
        const character = await getCharacter();
        if (character.id === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        // Get plots belonging to character
        const plots = await getFarmingPlots(character.id);
        if (plots.length < 1) {
            throw new HTTPException(500, { message: 'no farm plots found for character' });
        }
        // Need to make sure the number of plots is less than the number of plots in the cost table
        if (plots.length < Object.keys(farm_plot_cost_table).length) {
            throw new HTTPException(500, { message: 'no more plots available to buy' });
        }
        // Check if character has enough coins to buy a new plot
        const cost = farm_plot_cost_table[plots.length as keyof typeof farm_plot_cost_table];
        if (character.gold < cost) {
            throw new HTTPException(500, { message: 'not enough coins' });
        }
        // Deduct the cost from the character
        await updateCharacterGold(character.id, character.gold - cost);
        await createFarmingPlot(character.id);
        return c.json({ message: 'plot bought succesfully' });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Cancel currently growing crop from farm plot
farming.put('/', async (c) => {
    try {
        const plotId = c.req.query('id');
        if (!plotId) {
            throw new HTTPException(400, { message: `missing query param 'id'` });
        }
        const plot = await getFarmingPlotById(plotId);
        if (plot.length < 1) {
            throw new HTTPException(404, { message: `plot not found` });
        }
        const character = await getCharacter();
        if (!character) {
            throw new HTTPException(404, { message: 'character not found' });
        }
        if (plot[0].character_id !== character.id) {
            throw new HTTPException(500, { message: 'plot does not belong to character' });
        }
        await clearPlot(plotId);
        return c.json({ message: 'plot cancelled succesfully' });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Plant seed in specified plot id
farming.post('/plant', async (c) => {
    try {
        const plotId = c.req.query('plot_id');
        if (!plotId) {
            throw new HTTPException(400, { message: `missing query param 'plot_id'` });
        }
        // Find the crop for the given seed id
        const seedId = c.req.query('seed_id');
        if (!seedId) {
            throw new HTTPException(400, { message: `missing query param 'seed_id'` });
        }
        // tz offset gets used to determine the local time of the user to be used for the end time of the crop
        const tzOffset = c.req.query('tz_offset');
        if (!tzOffset) {
            throw new HTTPException(400, { message: `missing query param 'tz_offset'` });
        }
        const cropRows = await getCropBySeedId(seedId);
        if (cropRows.length < 1) {
            throw new HTTPException(404, { message: `crop for given seed not found` });
        }
        // Check if character has required level for seed
        const character = await getCharacter();
        if (character.id === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        // Check if the plot belongs to the character
        const plot = await getFarmingPlotById(plotId);
        if (plot[0].character_id !== character.id) {
            throw new HTTPException(500, { message: 'plot does not belong to character' });
        }
        // Check if character has the required level for the crop
        if (character.farming_level < cropRows[0].required_level) {
            throw new HTTPException(500, { message: `required level: ${cropRows[0].required_level}` });
        }
        // Remove seed from inventory
        await removeItemFromInventory(Number(seedId), 1);
        // Create a new farm plot for the character with the crop
        await plantCrop(plotId, cropRows[0].id, cropRows[0].grow_time, Number(tzOffset));
        return c.json({ message: 'crop planted succesfully' });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Attempt to harvest crop from specified plot id
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
        const character = await getCharacter();
        if (character.id === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        if (plot[0].character_id !== character.id) {
            throw new HTTPException(500, { message: 'plot does not belong to character' });
        }
        // Check if plot is ready to harvest
        const currentTime = new Date();
        if (new Date(plot[0].end_time) > currentTime) {
            throw new HTTPException(500, { message: 'plot is not ready to harvest' });
        }
        // Clear the plot
        await clearPlot(plotId);
        const level = await addExperience(character, 'farming', plot[0].crop.experience);
        // Add the product to the inventory
        const amount = getRandomNumberBetween(Number(plot[0].crop.amount_produced[0]), Number(plot[0].crop.amount_produced[1]));
        await addItemToInventory(character.id, plot[0].crop.product.id, amount);
        return c.json({ message: 'crop harvested succesfully', amount: amount, level: (level > 0 ? level : null) });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default farming;