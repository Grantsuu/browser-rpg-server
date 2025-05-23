import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';

export const getCharacter = async () => {
    const { data, error } = await supabase
        .from('characters')
        .select();

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve character' })
    }

    return data[0];
}

export const getCharacterCombatStats = async () => {
    const { data, error } = await supabase
        .from('character_combat_stats')
        .select()
        .single();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve character combat stats' })
    }
    return data;
}

export const postCreateCharacter = async (userId: string, name: string) => {
    const { data, error } = await supabase
        .from('characters')
        .insert({ user_id: userId, name: name, gold: 10 })
        .select()
        .single();

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to create character' })
    }

    return data;
}

export const postCharacterCombatStats = async (characterId: string) => {
    const { data, error } = await supabase
        .from('character_combat_stats')
        .insert({
            character_id: characterId
        })
        .select()
        .single();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to create character combat stats' })
    }
    return data;
}

export const updateCharacter = async (characterId: number, characterData: object) => {
    const { data, error } = await supabase
        .from('characters')
        .update(characterData)
        .eq('id', characterId)
        .select()
        .single();

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to update character' })
    }

    return data;
}

export const updateCharacterGold = async (characterId: number, gold: number) => {
    const { data, error } = await supabase
        .from('characters')
        .update({ gold: gold })
        .eq('id', characterId)
        .select('gold');

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to update character gold' })
    }

    return data[0].gold;
}