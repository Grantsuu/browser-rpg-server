import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import { type SupabaseInventoryItem } from "../types/types.js";
import { getCharacterIdByUserId } from "./characters.js";

export const getInventoryByUserId = async (userId: string) => {
    try {
        const characterId = await getCharacterIdByUserId(userId);
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

export const addItemToInventory = async (userId: string, itemId: number, amount: number) => {
    try {
        const characterId = await getCharacterIdByUserId(userId);
        const item = await findItemInInventory(characterId, itemId);
        if (item) {
            const { error } = await supabase
                .from('inventories')
                .update({ amount: amount + item[0].amount })
                .eq('character', characterId)
                .eq('item', itemId)
            if (error) {
                console.log(error);
                throw new HTTPException(500, { message: 'unable to update item in inventory' })
            }
        } else {
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
        }
        return true;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

export const deleteItemFromInventory = async (characterId: string, itemId: number) => {
    try {
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