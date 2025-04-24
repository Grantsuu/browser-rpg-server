import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import type { ItemCategoryType, ItemData } from "../types/types.js";

export const getShopItems = async (item_id?: number, category?: ItemCategoryType) => {
    try {
        let supabaseQuery = supabase
            .from('shop_inventory_images_effects')
            .select(`*`);

        if (category) {
            supabaseQuery = supabaseQuery.eq('category', category)
        }

        if (item_id) {
            supabaseQuery = supabaseQuery.eq('id', item_id)
        }

        const { data, error } = await supabaseQuery.overrideTypes<ItemData[]>();

        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to retrieve shop inventory' })
        }

        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}