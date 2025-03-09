import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import { type SupabaseInventoryItem } from "../types/types.js";
import { getCharacterIdByUserId } from "./characters.js";

export const getInventoryByCharacterId = async (characterId: string) => {
    try {
        const { data, error } = await supabase
            .from('inventories')
            .select(`
                amount,
                item:items(
                    id,
                    name,
                    category:lk_item_categories(name),
                    value,
                    description,
                    image:lk_item_images(base64,type)
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

// Returns the item data if found, undefined if not found
export const findItemInInventory = async (characterId: string, itemId: number) => {
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

        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

// If item is already inventory add amount to existing item, otherwise insert a new one
export const addItemToInventory = async (characterId: string, itemId: number, amount: number) => {
    try {
        const item = await findItemInInventory(characterId, itemId);
        if (item.length < 1) {
            const { error } = await supabase
                .from('inventories')
                .insert({
                    character: characterId,
                    item: itemId,
                    amount: amount
                })
            if (error) {
                console.log(error);
                throw new HTTPException(500, { message: 'unable to add item to inventory' })
            }
        } else {
            const { error } = await supabase
                .from('inventories')
                .update({ amount: amount + item[0].amount })
                .eq('character', characterId)
                .eq('item', itemId)
            if (error) {
                console.log(error);
                throw new HTTPException(500, { message: 'unable to update item in inventory' })
            }
        }
        return true;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

// If item is in inventory try to remove amount, if removing all remove the item entirely.
// If item is not found or removing more than in inventory return error.
export const removeItemFromInventory = async (characterId: string, itemId: number, amount: number) => {
    try {
        const item = await findItemInInventory(characterId, itemId);
        console.log(item);
        const { error } = await supabase
            .from('inventories')
            .delete()
            .eq('character', characterId)
            .eq('item', itemId)

        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to delete item from inventory' })
        }

        return true;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}