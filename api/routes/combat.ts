import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type User } from '@supabase/supabase-js';
import type { CombatState } from "../types/types.js";
import { clearCombatByCharacterId, createCombatByCharacterId, getCombatByCharacterId, getCharacterCombatStats, getTrainingAreas, getMonstersByArea, getMonsterById, updateCombatByCharacter, updateCharacterCombatStats } from "../controllers/combat.js";
import { getCharacterByUserId } from "../controllers/characters.js";
import { rollDamage } from "../../game/utilities/functions.js";

type Variables = {
    user: { user: User };
}

const combat = new Hono<{ Variables: Variables }>();

export type CombatActions = "start" | "attack" | "defend" | "flee" | "use_item";

// Get training areas 
combat.get('/training/areas', async (c) => {
    try {
        const trainingAreas = await getTrainingAreas();
        return c.json(trainingAreas);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Get monsters by area
combat.get('/monsters', async (c) => {
    const areaName = c.req.query('area');
    if (!areaName) {
        return c.json({ message: 'area query parameter is required' }, 400);
    }
    try {
        const monsters = await getMonstersByArea(areaName);
        return c.json(monsters);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Get combat data by character ID
combat.get('/', async (c) => {
    const user = c.get('user').user;
    const character = await getCharacterByUserId(user.id);
    const characterId = character?.id;
    if (characterId === "") {
        throw new HTTPException(404, { message: 'character not found' });
    }
    try {
        const combatData = await getCombatByCharacterId(characterId);
        return c.json(combatData);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Create new combat data for character
combat.post('/', async (c) => {
    const user = c.get('user').user;
    const character = await getCharacterByUserId(user.id);
    const characterId = character?.id;
    if (characterId === "") {
        throw new HTTPException(404, { message: 'character not found' });
    }
    try {
        const newCombat = await createCombatByCharacterId(character.id);
        return c.json(newCombat);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Update combat encounter
combat.put('/', async (c) => {
    const action = c.req.query('action');
    if (!action) {
        return c.json({ message: 'action query parameter is required' }, 400);
    }
    const user = c.get('user').user;
    const character = await getCharacterByUserId(user.id);
    const characterId = character?.id;
    if (characterId === "") {
        throw new HTTPException(404, { message: 'character not found' });
    }

    const combat = await getCombatByCharacterId(character.id);
    // console.log(combat);
    // TODO: Calcuate damage monster does to player since they will always just attack for now
    let monsterDamage = 0;
    if (combat.monster) {
        monsterDamage = rollDamage(combat.monster.power, combat.player.toughness);
        combat.state.last_actions = {
            monster: {
                action: 'attacks',
                amount: monsterDamage
            }
        }
    }

    switch (action) {
        case "start": {
            // Start new combat
            const monsterId = c.req.query('monster_id');
            if (!monsterId) {
                return c.json({ message: 'monster_id query parameter is required to start combat' }, 400);
            }
            try {
                // TODO: Check if combat already exists

                // Get player data
                const player = await getCharacterCombatStats(character.id);

                // Get monster data
                const monster = await getMonsterById(monsterId);
                monster.max_health = monster.health;

                // TODO: check if .single returns an exception for us
                // if (!monster) {
                //     return c.json({ message: 'monster not found' }, 404);
                // }

                const updatedCombat = await updateCombatByCharacter(character, {} as CombatState, player, monster);
                return c.json(updatedCombat);
            } catch (error) {
                throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
            }
        }
        case "attack": {
            // Handle attack action
            try {
                const playerDamage = rollDamage(combat.player.power, combat.monster.toughness);

                combat.monster.health -= playerDamage;

                // TODO: Add in checks for killing monster or player
                // if (combat.monster.health <= 0) {
                //     // Monster defeated
                //     combat.player.experience += combat.monster.experience;
                //     combat.player.gold += combat.monster.gold;
                //     combat.monster = null; // Clear monster data
                // }

                combat.player.health -= monsterDamage;

                combat.state.last_actions = {
                    ...combat.state.last_actions,
                    player: {
                        action: 'attacks',
                        amount: playerDamage
                    }
                }

                await updateCharacterCombatStats(character.id, { health: combat.player.health });

                // if (combat.player.health <= 0) {
                //     // Player defeated
                //     combat.player = null; // Clear player data
                // }

                const updatedCombat = await updateCombatByCharacter(character, combat.state, combat.player, combat.monster);
                return c.json(updatedCombat);
            } catch (error) {
                throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
            }
        }
        case "defend": {
            try {
                const healthRestored = 5;
                await updateCharacterCombatStats(character.id, { health: combat.player.health += healthRestored });

                combat.state.last_actions = {
                    ...combat.state.last_actions,
                    player: {
                        action: 'heals',
                        amount: healthRestored
                    }
                }

                const updatedCombat = await updateCombatByCharacter(character, combat.state, combat.player, combat.monster);
                return c.json(updatedCombat);
            } catch (error) {
                throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
            }
        }
        case "use_item": {
            // Handle use_item action
            break;
        }
        case "flee": {
            // Handle flee action
            const combat = await clearCombatByCharacterId(character.id);
            return c.json(combat);
        }
        default: {
            return c.json({ message: 'invalid action' }, 400);
        }
    }
});

export default combat;