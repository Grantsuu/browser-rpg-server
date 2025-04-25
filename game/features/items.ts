import { assignHealing } from '../utilities/functions.js';
import type { ItemEffectData, ItemEffectReturnData } from '../../api/types/types.js';
import { getCharacterCombatStats, updateCharacterCombatStats } from '../../api/controllers/combat.js';

const processItemEffect = async (effect: ItemEffectData, returnJson: ItemEffectReturnData) => {
    switch (effect.effect) {
        case 'restore_health': {
            const characterStats = await getCharacterCombatStats();
            if (!characterStats) {
                throw new Error('Character combat stats not found');
            }
            // Cannot eat food if health is full
            if (characterStats.health >= characterStats.max_health) {
                throw new Error('Character health is already full');
            }
            const newHealth = assignHealing(characterStats.health, characterStats.max_health, effect.effect_value);
            // Update character health in the database
            const updatedStats = await updateCharacterCombatStats(
                characterStats.character_id,
                {
                    ...characterStats,
                    health: newHealth
                });
            returnJson.results = [
                ...returnJson.results,
                `restored ${newHealth - characterStats.health} health`
            ];
            returnJson.character_combat = updatedStats;
            break;
        }
        default: {
            throw new Error(`Unknown effect type: ${effect.effect}`);
        }
    }
    return returnJson;
}

export const useItem = async (effects: ItemEffectData[], returnJson: ItemEffectReturnData) => {
    // Loop through each effect and apply it to the character
    try {
        for (const effect of effects) {
            await processItemEffect(effect, returnJson);
        }
    } catch (error) {
        throw error;
    }
}
