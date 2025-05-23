import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import type { EquipmentCategoryType, Item } from '../types/types.js';

export const getCharacterEquipment = async (category?: EquipmentCategoryType) => {
    try {
        const supabaseQuery = supabase
            .from('vw_character_equipment_everything')
            .select();

        if (category) {
            supabaseQuery.eq('equipment_category', category);
        }

        const { data, error } = await supabaseQuery
            .overrideTypes<Item[]>();

        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to retrieve character equipment' })
        }
        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

export const addEqipment = async (characterId: number, equipmentId: number) => {
    try {
        const { data, error } = await supabase
            .from('character_equipment')
            .insert({ character_id: characterId, equipment_id: equipmentId })
            .select()
            .overrideTypes<Item[]>()
        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to add equipment' })
        }
        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

export const removeEquipmentById = async (id: number) => {
    try {
        const { data, error } = await supabase
            .from('character_equipment')
            .delete()
            .eq('equipment_id', id)
            .select(`
                ...equipment(*)   
            `)
            .overrideTypes<Item[]>()
        if (error) {
            console.log(error);
            throw new HTTPException(500, { message: 'unable to remove equipment' })
        }
        return data;
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}