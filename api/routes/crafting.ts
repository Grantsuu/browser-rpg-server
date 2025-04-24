import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type User } from '@supabase/supabase-js';
import type { ItemData } from '../types/types.js';
import { getCharacter } from "../controllers/characters.js";
import { addExperience, getCharacterLevels } from "../controllers/character_levels.js";
import { addItemToInventory, findItemInInventory, removeItemFromInventory } from "../controllers/inventory.js";
import { getCraftingRecipes } from "../controllers/crafting.js";

type Variables = {
    user: { user: User };
}

const crafting = new Hono<{ Variables: Variables }>();

// Get Crafting Recipes
crafting.get('/', async (c) => {
    try {
        const recipes = await getCraftingRecipes();
        return c.json(recipes);
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
        const recipe = await getCraftingRecipes(Number(itemId));
        if (recipe.length < 1) {
            throw new HTTPException(404, { message: `recipe for given item id not found` });
        }

        // Check if character has required level for recipe
        const character = await getCharacter();
        if (!character) {
            throw new HTTPException(404, { message: 'character not found' });
        }
        const characterLevels = await getCharacterLevels();
        if (characterLevels?.cooking_level < recipe[0].required_level) {
            throw new HTTPException(500, { message: `required level: ${recipe[0].required_level}` });
        }
        // Check if character has all items in inventory
        const insufficientIngredients: ItemData[] = [];
        await Promise.all(recipe[0].ingredients.map(async (ingredient: ItemData) => {
            const item = await findItemInInventory(ingredient.id, Number(ingredient.amount) * Number(amount));
            if (!item) {
                insufficientIngredients.push(ingredient);
            }
        }))
        if (insufficientIngredients.length > 0) {
            throw new HTTPException(500, { message: `insufficient ingredient(s): ${insufficientIngredients.map((ingredient) => { return ingredient.name }).join(', ')}` })
        }

        // Remove ingredients from inventory
        await Promise.all(recipe[0].ingredients.map(async (ingredient: ItemData) => {
            await removeItemFromInventory(ingredient.id, Number(ingredient.amount) * Number(amount));
        }));

        // Add item to inventory if true
        await addItemToInventory(character.id, recipe[0].item.id, Number(amount));
        const level = await addExperience(character, 'cooking', recipe[0].experience * Number(amount));
        return c.json({ amount: Number(amount), experience: recipe[0].experience * Number(amount), level: (level > 0) ? level : null });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default crafting;