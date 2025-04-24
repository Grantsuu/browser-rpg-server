import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';

export const getTrainingAreas = async () => {
    const { data, error } = await supabase
        .from('training_areas')
        .select();

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve training areas' })
    }

    return data;
}

export const getCombat = async () => {
    const { data, error } = await supabase
        .from('combat')
        .select()
        .single()

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve combat data' })
    }

    return data;
}

// Combat Stats

export const getCharacterCombatStats = async () => {
    const { data, error } = await supabase
        .from('character_combat_stats')
        .select()
        .single();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve character combat stats' })
    }
    return data;
}

export const updateCharacterCombatStats = async (characterId: string, stats: object) => {
    const { data, error } = await supabase
        .from('character_combat_stats')
        .update(stats)
        .eq('character_id', characterId)
        .select()
        .single();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to update character combat stats' })
    }
    return data;
}

export const createCombat = async (character_id: string) => {
    const { data, error } = await supabase
        .from('combat')
        .insert({ character_id: character_id });

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to start combat' })
    }

    return data;
}

export const updateCombatByCharacterId = async (character_id: string, state?: object, player?: object, monster?: object) => {
    const { data, error } = await supabase
        .from('combat')
        .update({
            state: state,
            player: player,
            monster: monster
        })
        .eq('character_id', character_id)
        .select()
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
        .eq('character_id', character_id)
        .select()
        .single();

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to clear combat' })
    }

    return data;
}