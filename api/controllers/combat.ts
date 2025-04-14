import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import { type SupabaseCharacter } from '../types/types.js';

export const getTrainingAreas = async () => {
    const { data, error } = await supabase
        .from('training_areas')
        .select('*');

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve training areas' })
    }

    return data;
}

export const getMonstersByArea = async (areaName: string) => {
    const { data, error } = await supabase
        .from('monsters')
        .select('*')
        .eq('area', areaName);

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve monsters' })
    }

    return data;
}

export const getMonsterById = async (monsterId: string) => {
    const { data, error } = await supabase
        .from('monsters')
        .select('*')
        .eq('id', monsterId)
        .single();

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve monster' })
    }

    return data;
}

export const getCombatByCharacterId = async (characterId: string) => {
    const { data, error } = await supabase
        .from('combat')
        .select('*')
        .eq('character_id', characterId)
        .single()

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve combat data' })
    }

    return data;
}

export const createCombatByCharacterId = async (character_id: string) => {
    const { data, error } = await supabase
        .from('combat')
        .insert({ character_id: character_id });

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to start combat' })
    }

    return data;
}

export const updateCombatByCharacter = async (character: SupabaseCharacter, state?: object, player?: object, monster?: object) => {
    const { data, error } = await supabase
        .from('combat')
        .update({
            state: state,
            player: player,
            monster: monster
        })
        .eq('character_id', character.id)
        .select('*')
        .single();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to update combat' })
    }
    return data;
}

export const clearCombatByCharacterId = async (character_id: string) => {
    const { data, error } = await supabase
        .from('combat')
        .update({
            state: null,
            player: null,
            monster: null
        })
        .eq('character_id', character_id);

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to clear combat' })
    }

    return data;
}