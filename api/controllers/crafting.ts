import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import { type SupabaseRecipe } from "../types/types.js";
import { getCharacterIdByUserId } from "./characters.js";

export const getCraftingRecipes = async () => {
    try {
        const { data, error } = await supabase
            .from('recipes')
            .select(`
                item:items!recipes_item_fkey(
                    id,
                    name,
                    category:lk_item_categories(name),
                    value,
                    description,
                    image:lk_item_images(base64,type)
                ),
                ingredient:items!recipes_ingredient_fkey(
                    id,
                    name,
                    category:lk_item_categories(name),
                    value,
                    description,
                    image:lk_item_images(base64,type)
                ),
                amount
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
