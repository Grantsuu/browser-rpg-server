import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import type { Bounty } from '../types/types.js';

export const getCharacterBounties = async () => {
    const { data, error } = await supabase
        .from('character_bounties')
        .select(`
            *,
            required_item:items!character_bounties_required_item_id_fkey(*),
            required_monster:monsters!character_bounties_required_monster_id_fkey(*),
            reward_item:items!character_bounties_reward_item_id_fkey(*)
        `)
        .overrideTypes<Bounty[]>();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve bounties' })
    }

    return data;
}

export const updateBounty = async (bountyId: number, updateJson: object) => {
    const { data, error } = await supabase
        .from('character_bounties')
        .update(updateJson)
        .eq('id', bountyId)
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to update bounty' })
    }

    return data;
}