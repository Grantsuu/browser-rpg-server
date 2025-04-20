import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type User } from '@supabase/supabase-js';
import { type ClientItem } from '../types/types.js';
import { combineRecipeRows } from "../utilities/transforms.js";
import { addExperience, getCharacterByUserId } from "../controllers/characters.js";
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
// TODO: Make this generic or make this specific to crafting categories
crafting.post('/', async (c) => {
    try {
        // Find the recipe for the given item id
        const itemId = c.req.query('id');
        if (!itemId) {
            throw new HTTPException(400, { message: `missing query param 'id'` });
        }
        const amount = c.req.query('amount');
        if (!itemId) {
            throw new HTTPException(400, { message: `missing query param 'amount'` });
        }
        const recipeRows = await getCraftingRecipeByItemId(itemId);
        if (recipeRows.length < 1) {
            throw new HTTPException(404, { message: `recipe for given item id not found` });
        }
        const combinedRecipe = combineRecipeRows(recipeRows)[0];

        // Check if character has required level for recipe
        const user = c.get('user').user;
        const character = await getCharacterByUserId(user.id);
        const characterId = character?.id;
        if (characterId === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        if (character?.cooking_level < combinedRecipe.required_level) {
            throw new HTTPException(500, { message: `required level: ${combinedRecipe.required_level}` });
        }
        // Check if character has all items in inventory
        const insufficientIngredients: ClientItem[] = [];
        await Promise.all(combinedRecipe.ingredients.map(async (ingredient: ClientItem) => {
            const item = await findItemInInventory(ingredient.id, Number(ingredient.amount) * Number(amount));
            if (!item) {
                insufficientIngredients.push(ingredient);
            }
        }))
        if (insufficientIngredients.length > 0) {
            throw new HTTPException(500, { message: `insufficient ingredient(s): ${insufficientIngredients.map((ingredient) => { return ingredient.name }).join(', ')}` })
        }

        // Remove ingredients from inventory
        await Promise.all(combinedRecipe.ingredients.map(async (ingredient: ClientItem) => {
            await removeItemFromInventory(ingredient.id, Number(ingredient.amount) * Number(amount));
        }));

        // Add item to inventory if true
        await addItemToInventory(characterId, combinedRecipe.item.id, Number(amount));
        const level = await addExperience(character, 'cooking', recipeRows[0].experience * Number(amount));
        return c.json({ amount: Number(amount), experience: recipeRows[0].experience * Number(amount), level: (level > 0) ? level : null });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default crafting;