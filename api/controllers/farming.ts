import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import { type SupabaseFarmPlot } from "../types/types.js";

export const getFarmingPlots = async (characterId: string) => {
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
                        category:lk_item_categories(name),
                        value,
                        description,
                        image:lk_item_images(base64)
                    ),
                    grow_time,
                    experience,
                    product:items!crops_product_id_fkey(
                        id,
                        name,
                        category:lk_item_categories(name),
                        value,
                        description,
                        image:lk_item_images(base64)
                    ),
                    required_level,
                    amount_produced
                ),
                start_time,
                end_time
            `)
            .eq('character_id', characterId)
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

export const postPlantCrop = async (characterId: string, cropId: string, growTime: number) => {
    try {
        const { data, error } = await supabase
            .from('farm_plots')
            .insert({
                character_id: characterId,
                crop_id: cropId,
                start_time: new Date().toISOString(),
                end_time: new Date(Date.now() + (growTime * 1000)).toISOString()
            })
        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to plant crop' })
        }
        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}