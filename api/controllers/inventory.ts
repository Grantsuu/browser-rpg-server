import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.ts';
import { type SupabaseInventoryItem } from "../types/types.ts";
import { getCharacterIdByUserId } from "./characters.ts";


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