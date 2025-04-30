import { Hono } from "hono";
import { HTTPException } from 'hono/http-exception';
import { useItem } from "../../game/features/items.js";
import { findItemInInventory, removeItemFromInventory } from "../controllers/inventory.js";
import type { ItemEffectData, ItemEffectReturnData } from "../types/types.js";
import { getCombat } from "../controllers/combat.js";

const items = new Hono();

items.put('/use', async (c) => {
    try {
        // Get item id from query params
        const itemId = c.req.query('id');
        if (!itemId) {
            throw new HTTPException(400, { message: `missing query param 'id'` });
        }
        // Check if player is in combat
        const combat = await getCombat();
        if (combat?.state && !combat?.state?.outcome) {
            throw new HTTPException(400, { message: 'cannot use items from inventory screen while in combat' });
        }
        // Ensure the player has the item in their inventory
        const item = await findItemInInventory(Number(itemId));
        if (!item) {
            throw new HTTPException(404, { message: 'item not found in inventory' });
        }
        // Process the item effects
        const returnJson: ItemEffectReturnData = {
            results: [],
            character_combat: undefined,
            inventory_item: undefined
        };
        try {
            await useItem(item.item_effects as ItemEffectData[], returnJson);
        } catch (error) {
            throw error;
        }
        // Remove the item from the player's inventory
        const updatedItem = await removeItemFromInventory(Number(itemId), 1);
        returnJson.inventory_item = updatedItem;
        // Return the result of the item's removal
        return c.json(returnJson);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default items;