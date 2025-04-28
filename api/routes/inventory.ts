import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { User } from '@supabase/supabase-js';
import { findEquipmentInInventoryByCategory, getInventory, removeItemFromInventory } from "../controllers/inventory.js";
import type { EquipmentCategoryType } from "../types/types.ts";

type Variables = {
    user: { user: User };
}

const inventory = new Hono<{ Variables: Variables }>();

inventory.get('/', async (c) => {
    try {
        const inventory = await getInventory();
        return c.json(inventory);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

inventory.get('/equipment', async (c) => {
    try {
        const category = c.req.query('category');
        if (!category) {
            throw new HTTPException(400, { message: `missing query param 'category'` });
        }
        const item = await findEquipmentInInventoryByCategory(category as EquipmentCategoryType);
        return c.json(item ? item : {});
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
        const item = await removeItemFromInventory(Number(itemId), amount);

        return c.json(item ? item : {});
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
})

export default inventory;

