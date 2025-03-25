import { Hono } from "hono";
import { HTTPException } from 'hono/http-exception';
import { type User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase.js';
import { type SupabaseShopItem } from "../types/types.js";
import { supabaseShopItemsToClientItems } from "../utilities/functions.js";
import { addItemToInventory, removeItemFromInventory } from "../controllers/inventory.js";
import { getCharacterByUserId, updateCharacterGold } from "../controllers/characters.js";
import { getItemById } from "../controllers/items.js";

type Variables = {
    user: { user: User };
}

const shop = new Hono<{ Variables: Variables }>();

shop.get('/', async (c) => {
    const { data, error } = await supabase
        .from('shop_inventory')
        .select(`
            item:items(
                id,
                name,
                category,
                value,
                description,
                image:lk_item_images(base64)
            )
        `)
        .overrideTypes<SupabaseShopItem[]>();

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve shop inventory' })
    }

    return c.json(supabaseShopItemsToClientItems(data));
});

shop.post('/buy', async (c) => {
    try {
        const itemId = c.req.query('id');
        if (!itemId) {
            throw new HTTPException(400, { message: `missing query param 'id'` });
        }

        const amount = Number(c.req.query('amount'));
        if (!amount) {
            throw new HTTPException(400, { message: `missing query param 'amount'` });
        }

        const user = c.get('user').user;
        const character = await getCharacterByUserId(user.id);
        if (character.id === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        const item = await getItemById(itemId);
        if (item.value * amount > character.gold) {
            throw new HTTPException(400, { message: 'not enough gold' });
        }
        await updateCharacterGold(character.id, character.gold - (item.value * amount));
        await addItemToInventory(character.id, Number(itemId), amount);

        return c.json({ message: 'item(s) bought successfully' });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

shop.post('/sell', async (c) => {
    try {
        const itemId = c.req.query('id');
        if (!itemId) {
            throw new HTTPException(400, { message: `missing query param 'id'` });
        }

        const amount = Number(c.req.query('amount'));
        if (!amount) {
            throw new HTTPException(400, { message: `missing query param 'amount'` });
        }

        const user = c.get('user').user;
        const character = await getCharacterByUserId(user.id);
        if (character.id === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        const item = await getItemById(itemId);
        await updateCharacterGold(character.id, character.gold + (item.value / 2) * amount);
        await removeItemFromInventory(character.id, Number(itemId), amount);

        return c.json({ message: 'item(s) sold successfully' });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default shop;