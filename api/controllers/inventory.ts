import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import { type SupabaseInventoryItem } from "../types/types.js";

export const getInventoryByCharacterId = async (characterId: string) => {
    try {
        const { data, error } = await supabase
            .from('inventories')
            .select(`
                amount,
                item:items(
                    id,
                    name,
                    category,
                    value,
                    description,
                    image:lk_item_images(*)
                )
            `)
            .eq('character', characterId)
            .overrideTypes<SupabaseInventoryItem[]>();

        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to retrieve inventory' })
        }
        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

// Returns the inventory item data in an array if found, empty array if not found
export const findItemInInventory = async (characterId: string, itemId: number, amount?: number) => {
    try {
        const { data, error } = await supabase
            .from('inventories')
            .select()
            .eq('character', characterId)
            .eq('item', itemId);

        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to search inventory' })
        }

        // If item not found return empty array
        if (data.length < 1) {
            return data;
        }

        // If the amount we're trying to find is greater than the amount of items in inventory return empty array
        if (amount) {
            if (amount > data[0].amount) {
                return [];
            }
        }

        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

// If item is already inventory add amount to existing item, otherwise insert a new one
export const addItemToInventory = async (characterId: string, itemId: number, amount: number) => {
    try {
        let item = await findItemInInventory(characterId, itemId);
        // If item isn't already in the inventory just add a new one with the given amount
        if (item.length < 1) {
            const { error } = await supabase
                .from('inventories')
                .insert({
                    character: characterId,
                    item: itemId,
                    amount: amount
                })
                .select()
                .overrideTypes<SupabaseInventoryItem[]>();
            if (error) {
                console.log(error);
                throw new HTTPException(500, { message: 'unable to add item to inventory' })
            }
        } else {
            // Otherwise, add the amount to the existing item
            const { error } = await supabase
                .from('inventories')
                .update({ amount: amount + item[0].amount })
                .eq('character', characterId)
                .eq('item', itemId)
                .select()
                .overrideTypes<SupabaseInventoryItem[]>();
            if (error) {
                console.log(error);
                throw new HTTPException(500, { message: 'unable to update item in inventory' })
            }
        }
        return item;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

// If item is in inventory try to remove amount, if removing all remove the item entirely.
// If item is not found or removing more than in inventory return error.
export const removeItemFromInventory = async (characterId: string, itemId: number, amount?: number) => {
    try {
        const inventoryItem = await findItemInInventory(characterId, itemId, amount);

        // If the item isn't found in the inventory return an exception
        if (inventoryItem.length < 1) {
            // Maybe this should just return false instead of an error, not sure
            throw new HTTPException(500, { message: 'unable to remove item from inventory: insufficient amount found in inventory' });
        }

        // If removing less than the amount in the inventory, update the amount
        if (amount && amount < inventoryItem[0].amount) {
            const { error } = await supabase
                .from('inventories')
                .update({ amount: inventoryItem[0].amount - amount })
                .eq('character', characterId)
                .eq('item', itemId);

            if (error) {
                console.log(error);
                throw new HTTPException(500, { message: 'unable to update item in inventory' });
            }
        } else {
            // In this case, assume we're removing the exact amount in player's inventory so we just delete the item
            const { error } = await supabase
                .from('inventories')
                .delete()
                .eq('character', characterId)
                .eq('item', itemId);

            if (error) {
                console.log(error);
                throw new HTTPException(500, { message: 'unable to delete item from inventory' });
            }
        }

        return true;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}