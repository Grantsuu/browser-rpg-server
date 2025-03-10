import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';

export const getCharacterIdByUserId = async (userId: string) => {
    const { data, error } = await supabase
        .from('characters')
        .select('id')
        .eq('user', userId);

    // Error from supabase
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve character' })
    }

    // Empty array means no characters found
    if (data.length < 1) {
        throw new HTTPException(404, { message: 'character not found' })
    }

    // For now only one character per user so just return the first one
    return data[0].id
}

export const getCharacterGold = async (characterId: number) => {
    const { data, error } = await supabase
        .from('characters')
        .select('gold')
        .eq('id', characterId);

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to gold' })
    }

    return data[0].gold;
}

// Negative gold for removing it
export const updateCharacterGold = async (characterId: number, gold: number) => {
    const currentGold = await getCharacterGold(characterId);

    if (currentGold + gold < 0) {
        throw new HTTPException(500, { message: 'insufficient gold' })
    }

    const { data, error } = await supabase
        .from('characters')
        .update({ gold: currentGold + gold })
        .eq('id', characterId)
        .select('gold');

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve character' })
    }

    return data[0].gold;
}