import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import { type SupabaseFarmPlot } from "../types/types.js";

export const getFarmingPlots = async () => {
    try {
        const { data, error } = await supabase
            .from('farm_plots')
            .select(`
                id,
                character_id,
                crop:crops!farm_plots_crop_id_fkey(
                    id,
                    seed:items!crops_seed_id_fkey(
                        id,
                        name,
                        category,
                        value,
                        description,
                        image
                    ),
                    grow_time,
                    experience,
                    product:items!crops_product_id_fkey(
                        id,
                        name,
                        category,
                        value,
                        description,
                        image
                    ),
                    required_level,
                    amount_produced
                ),
                start_time,
                end_time,
                previous_crop:crops!farm_plots_previous_crop_fkey(
                    id,
                    seed:items!crops_seed_id_fkey(
                        id,
                        name,
                        category,
                        value,
                        description,
                        image
                    ),
                    grow_time,
                    experience,
                    product:items!crops_product_id_fkey(
                        id,
                        name,
                        category,
                        value,
                        description,
                        image
                    ),
                    required_level,
                    amount_produced
                )
            `)
            .overrideTypes<SupabaseFarmPlot[]>();
        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to retrieve farm plots' })
        }
        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

export const getFarmingPlotById = async (plotId: string) => {
    try {
        const { data, error } = await supabase
            .from('farm_plots')
            .select(`
                id,
                character_id,
                crop:crops!farm_plots_crop_id_fkey(
                    id,
                    seed:items!crops_seed_id_fkey(
                        id,
                        name,
                        category,
                        value,
                        description,
                        image
                    ),
                    grow_time,
                    experience,                 
                    product:items!crops_product_id_fkey(
                        id,
                        name,
                        category,
                        value,
                        description,
                        image
                    ),
                    required_level,
                    amount_produced
                ),
                start_time,
                end_time,
                previous_crop:crops!farm_plots_previous_crop_fkey(
                    id,
                    seed:items!crops_seed_id_fkey(
                        id,
                        name,
                        category,
                        value,
                        description,
                        image
                    ),
                    grow_time,
                    experience,
                    product:items!crops_product_id_fkey(
                        id,
                        name,
                        category,
                        value,
                        description,
                        image
                    ),
                    required_level,
                    amount_produced
                )
            `)
            .eq('id', plotId)
            .overrideTypes<SupabaseFarmPlot[]>();
        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to retrieve farm plot' })
        }
        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

export const createFarmingPlot = async (characterId: string) => {
    try {
        const { data, error } = await supabase
            .from('farm_plots')
            .insert({ character_id: characterId })
        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to create farm plot' })
        }
        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

export const plantCrop = async (plotId: string, cropId: string, growTime: number, tzOffset: number) => {
    // Offset the time by the timezone in minutes
    const now = new Date();
    now.setMinutes(new Date().getMinutes() - tzOffset);
    const endTime = new Date();
    endTime.setMinutes(now.getMinutes() - tzOffset);
    endTime.setSeconds(now.getSeconds() + growTime);
    try {
        const { data, error } = await supabase
            .from('farm_plots')
            .update({
                crop_id: cropId,
                start_time: now.toISOString(),
                end_time: endTime.toISOString(),
                previous_crop: cropId
            })
            .eq('id', plotId)
        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to plant crop' })
        }
        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

export const clearPlot = async (plotId: string) => {
    try {
        const { data, error } = await supabase
            .from('farm_plots')
            .update({ crop_id: null, start_time: null, end_time: null })
            .eq('id', plotId)
        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to delete crop' })
        }
        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}