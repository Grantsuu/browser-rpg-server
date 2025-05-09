import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import type { ItemEffectData } from '../types/types.js';

export const getItemById = async (id: string) => {
    const { data, error } = await supabase
        .from('items')
        .select()
        .eq('id', id);

    // Error from supabase
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve item' })
    }

    // Empty array means no characters found
    if (data.length < 1) {
        throw new HTTPException(404, { message: 'item not found' })
    }

    // For now only one character per user so just return the first one
    return data[0]
}

export const getItemCategories = async () => {
    const { data, error } = await supabase
        .from('vw_item_category')
        .select();

    // Error from supabase
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve item categories' })
    }

    return data;
}

export const getItemEffectsById = async (item_id: number) => {
    const { data, error } = await supabase
        .from('item_effects')
        .select()
        .eq('item_id', item_id)
        .overrideTypes<ItemEffectData[]>();

    // Error from supabase
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve item effects' })
    }

    return data;
}