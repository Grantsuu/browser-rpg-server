import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import { type SupabaseFishing } from "../types/types.js";

export const getFishingState = async (characterId: string) => {
    const { data, error } = await supabase
        .from('fishing')
        .select(`
            id,
            character_id,
            turns,
            game_state,
            area:lk_fish_areas!fishing_area_fkey(
                name,
                required_level
            ),
            previous_area:lk_fish_areas!fishing_previous_area_fkey(
                name,
                required_level
            )  
        `)
        .eq('character_id', characterId)
        .overrideTypes<SupabaseFishing[]>();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve fishing state' })
    }
    console.log(data);
    return data[0];
}

export const createFishingGame = async (characterId: string, area: number) => {
    const { data, error } = await supabase
        .from('fishing')
        .insert({
            character_id: characterId,
            turns: 0,
            game_state: {},
            area_id: area,
            previous_area_id: area
        })
        .select()
        .overrideTypes<SupabaseFishing[]>();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to create fishing game' })
    }
    return data[0];
}

export const updateFishingGame = async (characterId: string, turns: number, gameState: object) => {
    const { data, error } = await supabase
        .from('fishing')
        .update({
            turns: turns,
            game_state: gameState
        })
        .eq('character_id', characterId)
        .select()
        .overrideTypes<SupabaseFishing[]>();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to update fishing game' })
    }
    return data[0];
}

export const clearFishingGame = async (characterId: string) => {
    const { data, error } = await supabase
        .from('fishing')
        .update({
            turns: null,
            game_state: null,
            area_id: null
        })
        .eq('character_id', characterId)
        .select()
        .overrideTypes<SupabaseFishing[]>();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to clear fishing game' })
    }
    return data[0];
}