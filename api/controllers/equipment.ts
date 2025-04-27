import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import type { EquipmentData } from '../types/types.js';

export const getCharacterEquipment = async () => {
    try {
        const { data, error } = await supabase
            .from('character_equipment')
            .select(`
                ...vw_equipment_effects(
                *,
                item: items(*)
                )
            `)
            .overrideTypes<EquipmentData[]>()
        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to retrieve character equipment' })
        }
        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}