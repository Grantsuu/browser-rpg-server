import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import type { Fish, FishingArea, FishingGameState, SupabaseFishing } from "../types/types.js";

export const getFishingState = async (characterId: string) => {
    const { data, error } = await supabase
        .from('fishing')
        .select(`
            id,
            character_id,
            turns,
            game_state,
            area:lk_fishing_areas!fishing_area_fkey(
                name,
                description,
                size,
                max_turns,
                required_level
            ),
            previous_area:lk_fishing_areas!fishing_previous_area_fkey(
                name,
                description,
                size,
                max_turns,
                required_level
            )  
        `)
        .eq('character_id', characterId)
        .overrideTypes<SupabaseFishing[]>();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve fishing state' })
    }
    return data[0];
}

export const startFishingGame = async (characterId: string, area: string, gameState: FishingGameState) => {
    const { data, error } = await supabase
        .from('fishing')
        .update({
            character_id: characterId,
            turns: 0,
            game_state: gameState,
            area: area,
            previous_area: area
        })
        .eq('character_id', characterId)
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
            area: null
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

export const getFishingAreas = async () => {
    const { data, error } = await supabase
        .from('lk_fishing_areas')
        .select()
        .overrideTypes<FishingArea[]>();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve fishing areas' })
    }
    return data;
}

export const getFishingAreaByName = async (name: string) => {
    const { data, error } = await supabase
        .from('lk_fishing_areas')
        .select('*')
        .eq('name', name)
        .overrideTypes<FishingArea[]>();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve fishing area' })
    }
    return data[0];
}

export const getFishByAreaName = async (areaName: string) => {
    const { data, error } = await supabase
        .from('fish')
        .select(`*`)
        .eq('area', areaName)
        .overrideTypes<Fish[]>();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve fishing area' })
    }
    return data;
}