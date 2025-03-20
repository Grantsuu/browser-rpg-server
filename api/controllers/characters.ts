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

    // Return empty string if no character found
    if (data.length < 1) {
        return "";
    }

    // For now only one character per user so just return the first one
    return data[0].id
}

export const getCharacterByUserId = async (userId: string) => {
    const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user', userId);

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve character' })
    }

    return data[0];
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

export const postCreateCharacter = async (userId: string, name: string) => {
    const { data, error } = await supabase
        .from('characters')
        .insert({ user: userId, name: name, gold: 100 });

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to create character' })
    }

    return data;
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

export const addFarmingExperience = async (characterId: number, experience: number) => {
    const { data: farming, error: farmingError } = await supabase
        .from('characters')
        .select('farming_experience')
        .eq('id', characterId);

    if (farmingError) {
        console.log(farmingError);
        throw new HTTPException(500, { message: 'unable to gold' })
    }

    const { data, error } = await supabase
        .from('characters')
        .update({ farming_experience: farming[0].farming_experience + experience })
        .eq('id', characterId)
        .select('farming_experience');

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to add experience' })
    }

    return data[0].farming_experience;
}