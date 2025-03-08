import { Hono } from "hono";
import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.ts';
import { type SupabaseShopItem } from "../types/types.ts";
import { supabaseShopItemsToClientItems } from "../utilities/normalize.ts";

const shop = new Hono();

shop.get('/', async (c) => {
    const { data, error } = await supabase
        .from('shop_inventory')
        .select(`
            item:items(
                ids,
                name,
                category:lk_item_categories(name),
                value,
                description,
                image:lk_item_images(base64,type)
            )
        `)
        .overrideTypes<SupabaseShopItem[]>();

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve shop inventory' })
    }

    return c.json(supabaseShopItemsToClientItems(data));
})

export default shop;