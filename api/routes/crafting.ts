import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type User } from '@supabase/supabase-js';
import { combineRecipeRows } from "../utilities/functions.js";
import { addItemToInventory } from "../controllers/inventory.js";
import { getCraftingRecipes } from "../controllers/crafting.js";
import { userInfo } from "os";

type Variables = {
    user: { user: User };
}

const crafting = new Hono<{ Variables: Variables }>();

crafting.get('/', async (c) => {
    try {
        const recipeRows = await getCraftingRecipes();
        const combinedRecieps = combineRecipeRows(recipeRows);
        return c.json(combinedRecieps);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

crafting.post('/', async (c) => {
    try {
        const user = c.get('user').user;
        const item = await addItemToInventory(user.id, 4, 2);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default crafting;