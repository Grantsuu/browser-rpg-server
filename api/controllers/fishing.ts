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
            area:fishing_areas!fishing_area_fkey(
                name,
                description,
                size:lk_fishing_area_sizes!fishing_areas_size_fkey(
                    name,
                    rows,
                    cols
                ),
                max_turns,
                required_level,
                fish,
                bountiful_fish
            ),
            previous_area:fishing_areas!fishing_previous_area_fkey(
                name,
                description,
                size:lk_fishing_area_sizes!fishing_areas_size_fkey(
                    name,
                    rows,
                    cols
                ),
                max_turns,
                required_level,
                fish,
                bountiful_fish
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

export const createFishingGame = async (characterId: string) => {
    const { data, error } = await supabase
        .from('fishing')
        .insert({
            character_id: characterId,
            turns: 0,
            game_state: null,
            area: null,
            previous_area: null
        })
        .select()
        .overrideTypes<SupabaseFishing[]>();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to create fishing game' })
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
        .select(`
            id,
            character_id,
            turns,
            game_state,
            area:fishing_areas!fishing_area_fkey(
                name,
                description,
                size:lk_fishing_area_sizes!fishing_areas_size_fkey(
                    name,
                    rows,
                    cols
                ),
                max_turns,
                required_level,
                fish,
                bountiful_fish
            ),
            previous_area:fishing_areas!fishing_previous_area_fkey(
                name,
                description,
                size:lk_fishing_area_sizes!fishing_areas_size_fkey(
                    name,
                    rows,
                    cols
                ),
                max_turns,
                required_level,
                fish,
                bountiful_fish
            )  
        `)
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

//TODO: Maybe remove this function
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
        .from('fishing_areas')
        .select(`
                name,
                description,
                size:lk_fishing_area_sizes!fishing_areas_size_fkey(
                    name,
                    rows,
                    cols
                ),
                max_turns,
                required_level,
                fish,
                bountiful_fish
        `)
        .overrideTypes<FishingArea[]>();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve fishing areas' })
    }
    return data;
}

export const getFishingAreaByName = async (name: string) => {
    const { data, error } = await supabase
        .from('fishing_areas')
        .select(`
                name,
                description,
                size:lk_fishing_area_sizes!fishing_areas_size_fkey(
                    name,
                    rows,
                    cols
                ),
                max_turns,
                required_level,
                fish,
                bountiful_fish
            `)
        .eq('name', name)
        .overrideTypes<FishingArea[]>();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve fishing area' })
    }
    return data[0];
}

export const getFishByAreaName = async (areaName: string, level: number) => {
    const { data, error } = await supabase
        .from('fish')
        .select(`
            id,
            name,
            item:items!fish_item_id_fkey(
                id,
                name,
                category,
                value,
                description,
                image:lk_item_images(*)
            ),
            required_level,
            experience,
            area:fishing_areas!fish_area_fkey(
                name,
                description,
                size:lk_fishing_area_sizes!fishing_areas_size_fkey(
                    name,
                    rows,
                    cols
                ),
                max_turns,
                required_level,
                fish,
                bountiful_fish
            )
        `)
        .eq('area', areaName)
        .lte('required_level', level)
        .overrideTypes<Fish[]>();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve fishing area' })
    }
    return data;
}