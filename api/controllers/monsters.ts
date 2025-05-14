import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import type { MonsterLoot } from '../types/types.js';
import { getMonsterLoot } from './queryStrings.js';

export const getMonsters = async (area?: string) => {
    const supabaseQuery = supabase
        .from('monsters')
        .select();

    if (area) {
        supabaseQuery.eq('area', area);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve monsters' })
    }

    return data;
}

export const getMonsterById = async (monsterId: string) => {
    const { data, error } = await supabase
        .from('monsters')
        .select()
        .eq('id', monsterId)
        .single();

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve monster' })
    }

    return data;
}

export const getMonsterLootById = async (monsterId: string) => {
    const { data, error } = await supabase
        .from('monster_loot')
        .select(getMonsterLoot)
        .eq('monster_id', monsterId)
        .overrideTypes<MonsterLoot[]>();

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve monster loot' })
    }

    return data;
}