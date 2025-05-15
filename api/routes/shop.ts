import { Hono } from "hono";
import { HTTPException } from 'hono/http-exception';
import { type User } from '@supabase/supabase-js';
import { supabaseCategoriesToArray } from "../utilities/transforms.js";
import { addItemToInventory, removeItemFromInventory } from "../controllers/inventory.js";
import { getCharacter, updateCharacterGold } from "../controllers/characters.js";
import { getItemById, getItemCategories } from "../controllers/items.js";
import { getShopItems } from "../controllers/shop.js";
import type { ItemCategoryType } from "../types/types.js";

type Variables = {
    user: { user: User };
}

const shop = new Hono<{ Variables: Variables }>();

shop.get('/', async (c) => {
    try {
        const category: ItemCategoryType = c.req.query('category') as ItemCategoryType;
        const shopItems = await getShopItems(undefined, category);
        return c.json(shopItems);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

shop.get('/categories', async (c) => {
    try {
        const itemCategories = await getItemCategories();
        return c.json(supabaseCategoriesToArray(itemCategories));
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
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

        const character = await getCharacter();
        if (character.id === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }

        const item = await getShopItems(Number(itemId));
        if (!item) {
            throw new HTTPException(404, { message: 'item not found in shop inventory' });
        }
        if (item[0].value * amount > character.gold) {
            throw new HTTPException(500, { message: 'not enough gold' });
        }

        const characterGold = await updateCharacterGold(character.id, character.gold - (item[0].value * amount));

        const newItem = await addItemToInventory(character.id, Number(itemId), amount);

        return c.json({ characterGold: characterGold, goldSpent: (item[0].value * amount), inventory: newItem });
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
        const character = await getCharacter();
        if (character.id === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        const item = await getItemById(itemId);
        const characterGold = await updateCharacterGold(character.id, character.gold + (Math.floor(item.value / 2) * amount));
        const newItem = await removeItemFromInventory(Number(itemId), amount);

        return c.json({ characterGold: characterGold, goldGained: (Math.floor(item.value / 2) * amount), 'item': newItem });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default shop;