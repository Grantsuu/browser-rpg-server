import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import type { ItemCategoryType, Item } from "../types/types.js";

export const getShopItems = async (itemId?: number, category?: ItemCategoryType) => {
    try {
        let supabaseQuery = supabase
            .from('vw_shop_inventory_everything')
            .select(`*`);

        if (category) {
            supabaseQuery = supabaseQuery.eq('item_category', category);
        }

        if (itemId) {
            supabaseQuery = supabaseQuery.eq('id', itemId);
        }

        const { data, error } = await supabaseQuery.overrideTypes<Item[]>();

        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to retrieve shop inventory' });
        }

        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}