import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type User } from '@supabase/supabase-js';
import { type ClientItem } from '../types/types.js';
import { combineRecipeRows } from "../utilities/functions.js";
import { getCharacterIdByUserId } from "../controllers/characters.js";
import { addItemToInventory, findItemInInventory, removeItemFromInventory } from "../controllers/inventory.js";
import { getCraftingRecipeByItemId, getCraftingRecipes } from "../controllers/crafting.js";

type Variables = {
    user: { user: User };
}

const crafting = new Hono<{ Variables: Variables }>();

// Get Crafting Recipes
crafting.get('/', async (c) => {
    try {
        const recipeRows = await getCraftingRecipes();
        const combinedRecipes = combineRecipeRows(recipeRows);
        return c.json(combinedRecipes);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Post Craft Recipe
crafting.post('/', async (c) => {
    try {
        // Find the recipe for the given item id
        const itemId = c.req.query('id');
        if (!itemId) {
            throw new HTTPException(400, { message: `missing query param 'id'` });
        }
        const recipeRows = await getCraftingRecipeByItemId(itemId);
        if (recipeRows.length < 1) {
            throw new HTTPException(404, { message: `recipe for given item id not found` });
        }
        const combinedRecipe = combineRecipeRows(recipeRows)[0];

        // Check if character has all items in inventory
        const user = c.get('user').user;
        const characterId = await getCharacterIdByUserId(user.id);
        const insufficientIngredients: ClientItem[] = [];
        await Promise.all(combinedRecipe.ingredients.map(async (ingredient: ClientItem) => {
            const item = await findItemInInventory(characterId, ingredient.id, ingredient.amount);
            if (item.length < 1) {
                insufficientIngredients.push(ingredient);
            }
        }))
        if (insufficientIngredients.length > 0) {
            throw new HTTPException(500, { message: `insufficient ingredient(s): ${insufficientIngredients.map((ingredient) => { return ingredient.name }).join(', ')}` })
        }

        // Add item to inventory if true
        // TODO: Right now all recipes only craft 1 of an item but may update this later
        addItemToInventory(characterId, combinedRecipe.item.id, 1);

        // Remove ingredients from inventory
        await Promise.all(combinedRecipe.ingredients.map(async (ingredient: ClientItem) => {
            await removeItemFromInventory(characterId, ingredient.id, ingredient.amount ? ingredient.amount : 1);
        }));

        c.status(200);
        return c.json({ message: 'craft successful' });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default crafting;