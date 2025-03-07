import { Hono } from "hono";
import { supabase } from '../supabase.ts';
import { type ClientItem, type SupabaseShopItem } from "../constants/interfaces.ts";

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
        c.status(500);
        return c.json(error);
    }

    // Normalize items from Supabase into ones the UI will consume
    const items: ClientItem[] = [];
    data.map((item) => {
        items.push({
            id: item.item.id,
            image: {
                base64: item.item.image.base64,
                type: item.item.image.type
            },
            name: item.item.name,
            category: item.item.category.name,
            value: item.item.value,
            description: item.item.description,
        });
    })

    return c.json(items);
})

export default shop;