import { Hono } from "hono";
import { HTTPException } from 'hono/http-exception';
import { type User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase.js';
import { type SupabaseFarmPlot, type SupabaseShopItem } from "../types/types.js";
import { getCharacterIdByUserId } from "../controllers/characters.js";

type Variables = {
    user: { user: User };
}

const farming = new Hono<{ Variables: Variables }>();

farming.get('/', async (c) => {
    const user = c.get('user').user;
    const characterId = await getCharacterIdByUserId(user.id);
    if (characterId === "") {
        throw new HTTPException(404, { message: 'character not found' });
    }

    const { data, error } = await supabase
        .from('farm_plots')
        .select(`
            id,
            character_id,
            crop:crops!farm_plots_crop_id_fkey(
                id,
                seed:items!crops_seed_id_fkey(*),
                grow_time,
                experience,
                product:items!crops_product_id_fkey(*),
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

    return c.json(data);
});

export default farming;