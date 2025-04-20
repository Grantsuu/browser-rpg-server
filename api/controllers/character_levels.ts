import { HTTPException } from 'hono/http-exception';
import { supabase } from '../lib/supabase.js';
import { type SupabaseCharacter } from '../types/types.js';
import { experience_table } from '../../game/constants/tables.js';

export const getCharacterLevels = async () => {
    const { data, error } = await supabase
        .from('character_levels')
        .select('*')
        .single();

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to retrieve character levels' })
    }

    return data;
}

export const postCreateCharacterLevels = async (characterId: string) => {
    const { data, error } = await supabase
        .from('character_levels')
        .insert({
            character_id: characterId
        })
        .select('*')
        .single();
    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to create character levels' })
    }
    return data;
}

export const addExperience = async (character: SupabaseCharacter, skillName: string, experience: number) => {
    const { data: characterLevels, error: characterError } = await supabase
        .from('character_levels')
        .select('*')
        .eq('character_id', character.id)
        .single();
    if (characterError) {
        console.log(characterError);
        throw new HTTPException(500, { message: 'unable to retrieve character levels' })
    }

    // console.log(`characterLevels: ${JSON.stringify(characterLevels)}`);

    const skillExpKey = `${skillName}_experience`;
    const skillLevelKey = `${skillName}_level`;

    const updatedExperience = Number(characterLevels[skillExpKey as keyof typeof characterLevels]) + experience;
    const updatedLevel = Number(Object.keys(experience_table).find(key => experience_table[Number(key) as keyof typeof experience_table] > updatedExperience)) - 1;

    // console.log(`updatedExperience: ${updatedExperience}, updatedLevel: ${updatedLevel}`);

    const { data, error } = await supabase
        .from('character_levels')
        .update({ [skillExpKey]: updatedExperience, [skillLevelKey]: updatedLevel })
        .eq('character_id', character.id)
        .select();

    if (error) {
        console.log(error);
        throw new HTTPException(500, { message: 'unable to add combat experience' })
    }

    // Return -1 if level did not change
    return Number(updatedLevel) !== characterLevels[skillLevelKey as keyof typeof character] ? updatedLevel : -1;
}