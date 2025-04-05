import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import { type SupabaseRecipe } from "../types/types.js";

export const getCraftingRecipes = async () => {
    try {
        const { data, error } = await supabase
            .from('recipes')
            .select(`
                item:items!recipes_item_fkey(
                    id,
                    name,
                    category,
                    value,
                    description,
                    image:lk_item_images(*)
                ),
                ingredient:items!recipes_ingredient_fkey(
                    id,
                    name,
                    category,
                    value,
                    description,
                    image:lk_item_images(*)
                ),
                amount,
                category,
                experience,
                required_level
            `)
            .overrideTypes<SupabaseRecipe[]>();
        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to retrieve crafting recipes' })
        }
        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

export const getCraftingRecipeByItemId = async (itemId: string) => {
    try {
        const { data, error } = await supabase
            .from('recipes')
            .select(`
            item:items!recipes_item_fkey!inner(
                id,
                name,
                category,
                value,
                description,
                image:lk_item_images(*)
            ),
            ingredient:items!recipes_ingredient_fkey(
                id,
                name,
                category,
                value,
                description,
                image:lk_item_images(*)
            ),
            amount,
            category,
            experience,
            required_level
        `)
            .eq('item.id', itemId)
            .overrideTypes<SupabaseRecipe[]>();
        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to retrieve crafting recipes' })
        }
        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}