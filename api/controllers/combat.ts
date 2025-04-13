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
