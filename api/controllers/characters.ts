import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import { type SupabaseCharacter } from '../types/types.js';
import { experience_table } from '../../game/constants/experience_table.js';

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
    const { data, error } = await supabase
        .from('characters')
        .update({ gold: gold })
        .eq('id', characterId)
        .select('gold');

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve character' })
    }

    return data[0].gold;
}

export const addExperience = async (character: SupabaseCharacter, skillName: string, experience: number) => {
    const skillExpKey = `${skillName}_experience`;
    const skillLevelKey = `${skillName}_level`;
    const updatedExperience = Number(character[skillExpKey as keyof typeof character]) + experience;
    const updatedLevel = Number(Object.keys(experience_table).find(key => experience_table[Number(key) as keyof typeof experience_table] > updatedExperience)) - 1;

    const { data, error } = await supabase
        .from('characters')
        .update({ [skillExpKey]: updatedExperience, [skillLevelKey]: updatedLevel })
        .eq('id', character.id)
        .select();

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to add experience' })
    }

    // Return -1 if level did not change
    return Number(updatedLevel) !== character[skillLevelKey as keyof typeof character] ? updatedLevel : -1;
}