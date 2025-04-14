import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';

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