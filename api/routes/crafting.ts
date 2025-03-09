import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type User } from '@supabase/supabase-js';
import { getCraftingRecipes } from "../controllers/crafting.ts";
import { combineRecipeRows } from "../utilities/functions.ts";

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

export default crafting;