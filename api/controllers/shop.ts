import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import { type SupabaseShopItem } from "../types/types.js";

export const getShopItems = async () => {
    try {
        const { data, error } = await supabase
            .from('shop_inventory')
            .select(`
                item:items(
                    id,
                    name,
                    category,
                    value,
                    description,
                    image:lk_item_images(*)
                )
            `)
            .overrideTypes<SupabaseShopItem[]>();

        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to retrieve shop inventory' })
        }

        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

export const getShopItemsByCategory = async (category: string) => {
    try {
        const { data, error } = await supabase
            .from('shop_inventory')
            .select(`
                item:items!inner(
                    id,
                    name,
                    category,
                    value,
                    description,
                    image:lk_item_images(*)
                )
            `)
            .eq('item.category', category)
            .overrideTypes<SupabaseShopItem[]>();

        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to retrieve shop inventory' })
        }

        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}