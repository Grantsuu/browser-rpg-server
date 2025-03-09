import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type User } from '@supabase/supabase-js';
import { combineRecipeRows } from "../utilities/functions.js";
import { getCharacterIdByUserId } from "../controllers/characters.js";
import { addItemToInventory, removeItemFromInventory } from "../controllers/inventory.js";
import { getCraftingRecipes } from "../controllers/crafting.js";

type Variables = {
    user: { user: User };
}

const crafting = new Hono<{ Variables: Variables }>();

// Get Crafting Recipes
crafting.get('/', async (c) => {
    try {
        const recipeRows = await getCraftingRecipes();
        const combinedRecieps = combineRecipeRows(recipeRows);
        return c.json(combinedRecieps);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Post Craft
crafting.post('/', async (c) => {
    try {
        const user = c.get('user').user;
        const characterId = await getCharacterIdByUserId(user.id);
        console.log(characterId);
        const item = await addItemToInventory(characterId, 4, 2);
        const remove = await removeItemFromInventory(characterId, 4, 1);
        return c.json(remove)
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default crafting;