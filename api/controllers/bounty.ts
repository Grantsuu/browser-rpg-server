import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import type { Bounty } from '../types/types.js';

export const getCharacterBounties = async () => {
    const { data, error } = await supabase
        .from('character_bounties')
        .select()
        .overrideTypes<Bounty[]>();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve bounties' })
    }

    return data;
}