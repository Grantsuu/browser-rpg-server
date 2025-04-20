import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import { type SupabaseInventoryItem } from "../types/types.js";

export const getInventory = async () => {
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
export const findItemInInventory = async (itemId: number, amount?: number) => {
    try {
        const { data, error } = await supabase
            .from('inventories')
            .select()
            .eq('item', itemId)
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
            .overrideTypes<SupabaseInventoryItem[]>();

        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to search inventory' })
        }

        // If item not found return empty object
        if (data.length < 1) {
            return undefined;
        }

        // If the amount we're trying to find is greater than the amount of items in inventory return empty array
        if (amount) {
            if (amount > data[0].amount) {
                return undefined;
            }
        }

        return data[0];
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

// If item is already inventory add amount to existing item, otherwise insert a new one
export const addItemToInventory = async (characterId: string, itemId: number, amount: number) => {
    try {
        let item = await findItemInInventory(itemId);
        // If item is already in inventory, update the amount
        if (item) {
            const { error } = await supabase
                .from('inventories')
                .update({ amount: amount + item.amount })
                .eq('item', itemId)
                .select()
                .overrideTypes<SupabaseInventoryItem[]>();
            if (error) {
                console.log(error);
                throw new HTTPException(500, { message: 'unable to update item in inventory' })
            }
        } else {
            // If item isn't already in the inventory just add a new one with the given amount
            const { error } = await supabase
                .from('inventories')
                .insert({
                    character_id: characterId,
                    item: itemId,
                    amount: amount
                })
                .select()
                .overrideTypes<SupabaseInventoryItem[]>();
            if (error) {
                console.log(error);
                throw new HTTPException(500, { message: 'unable to add item to inventory' })
            }
        }
        return item;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

// If item is in inventory try to remove amount, if removing all remove the item entirely.
// If item is not found or removing more than in inventory return error.
export const removeItemFromInventory = async (itemId: number, amount?: number) => {
    try {
        const item = await findItemInInventory(itemId, amount);
        // If the item isn't found in the inventory return an exception
        if (!item) {
            // Maybe this should just return false instead of an error, not sure
            throw new HTTPException(500, { message: 'unable to remove item from inventory: insufficient amount found in inventory' });
        }

        // If removing less than the amount in the inventory, update the amount
        if (amount && amount < item.amount) {
            const { error } = await supabase
                .from('inventories')
                .update({ amount: item.amount - amount })
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
                .eq('item', itemId);

            if (error) {
                console.log(error);
                throw new HTTPException(500, { message: 'unable to delete item from inventory' });
            }
        }

        return item;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}