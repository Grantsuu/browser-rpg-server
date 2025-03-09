import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type User } from '@supabase/supabase-js';
import { getCharacterIdByUserId } from "../controllers/characters.js";
import { getInventoryByCharacterId } from "../controllers/inventory.js";
import { supabaseInventoryItemsToClientItems } from "../utilities/functions.js";

type Variables = {
    user: { user: User };
}

const inventory = new Hono<{ Variables: Variables }>();

inventory.get('/', async (c) => {
    try {
        const user = c.get('user').user;
        const characterId = await getCharacterIdByUserId(user.id);
        const inventory = await getInventoryByCharacterId(characterId);
        const normalizedInventory = supabaseInventoryItemsToClientItems(inventory);
        return c.json(normalizedInventory);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default inventory;

