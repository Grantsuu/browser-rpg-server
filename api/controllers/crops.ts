import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';

export const getCrops = async () => {
    try {
        const { data, error } = await supabase
            .from('crops')
            .select(`
                id,
                seed:items!crops_seed_id_fkey(
                        id,
                        name,
                        category,
                        value,
                        description,
                        image:lk_item_images(*)
                    ),
                product_id,
                grow_time,
                experience,
                required_level,
                amount_produced
            `);
        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to retrieve crops' })
        }
        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

export const getCropBySeedId = async (seedId: string) => {
    try {
        const { data, error } = await supabase
            .from('crops')
            .select(`
                id,
                seed_id,
                product_id,
                grow_time,
                experience,
                required_level,
                amount_produced
            `)
            .eq('seed_id', seedId);
        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to retrieve crop' })
        }
        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}