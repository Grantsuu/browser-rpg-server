import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type User } from '@supabase/supabase-js';
import { getCharacterIdByUserId } from "../controllers/characters.js";
import { getInventoryByCharacterId, removeItemFromInventory } from "../controllers/inventory.js";
import { supabaseInventoryItemsToClientItems } from "../utilities/transforms.js";

type Variables = {
    user: { user: User };
}

const inventory = new Hono<{ Variables: Variables }>();

inventory.get('/', async (c) => {
    try {
        const user = c.get('user').user;
        const characterId = await getCharacterIdByUserId(user.id);
        if (characterId === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        const inventory = await getInventoryByCharacterId(characterId);
        const normalizedInventory = supabaseInventoryItemsToClientItems(inventory);
        return c.json(normalizedInventory);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

inventory.delete('/', async (c) => {
    try {
        const itemId = c.req.query('id');
        if (!itemId) {
            throw new HTTPException(400, { message: `missing query param 'id'` });
        }
        const amount = Number(c.req.query('amount'));
        const user = c.get('user').user;
        const characterId = await getCharacterIdByUserId(user.id);
        if (characterId === "") {
            throw new HTTPException(404, { message: 'character not found' });
        }
        await removeItemFromInventory(characterId, Number(itemId), amount);
        return c.json({ message: 'removed succesfully' });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
})

export default inventory;

