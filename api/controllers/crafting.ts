import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import { type RecipeData } from "../types/types.js";

export const getCraftingRecipes = async (itemId?: number) => {
    try {
        const supabaseQuery = supabase
            .from('recipes_ingredients_images_effects')
            .select()

        if (itemId) {
            supabaseQuery.eq('item ->> id', itemId);
        }

        const { data, error } = await supabaseQuery
            .overrideTypes<RecipeData[]>();

        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to retrieve crafting recipes' })
        }
        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}