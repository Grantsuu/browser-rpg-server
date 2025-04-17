import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { type User } from '@supabase/supabase-js';
import type { CombatState } from "../types/types.js";
import { clearCombatByCharacterId, createCombatByCharacterId, getCombatByCharacterId, getCharacterCombatStats, getTrainingAreas, getMonstersByArea, getMonsterById, updateCombatByCharacter, updateCharacterCombatStats } from "../controllers/combat.js";
import { getCharacterByUserId } from "../controllers/characters.js";
import { assignDamage, assignHealing, checkIsDead, rollDamage } from "../../game/utilities/functions.js";

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

combat.put('/reset', async (c) => {
    const user = c.get('user').user;
    const character = await getCharacterByUserId(user.id);
    const characterId = character?.id;
    if (characterId === "") {
        throw new HTTPException(404, { message: 'character not found' });
    }
    try {
        const combat = await getCombatByCharacterId(character.id);
        if (!combat) {
            return c.json({ message: 'combat not found' }, 404);
        }

        // Check if the combat is already cleared
        if (!combat.state && !combat.player && !combat.monster) {
            return c.json(combat);
        }

        // Check if combat is in a bad state (i.e. only one of the columns is set a combatant is missing)
        if (([combat.state, combat.player, combat.monster].filter(val => val !== undefined && val !== null).length === 1) ||
            ((combat.player || combat.monster) && !(combat.player && combat.monster))) {
            const clearedCombat = await clearCombatByCharacterId(character.id);
            return c.json(clearedCombat);
        }
        // Only let the player reset their combat if the outcome has already been decided
        if (!combat.state.outcome) {
            throw new HTTPException(500, { message: 'combat cannot be cleared until an outcome is decided' });
        }

        // Currently, in most cases we just want to clear the combat
        switch (combat.state.outcome?.status) {
            case 'player_wins': {
                break;
            }
            case 'player_loses': {
                // If the player loses, then we reset their health to half after combat
                await updateCharacterCombatStats(character.id, { health: Math.floor(combat.player.max_health / 2) });
                break;
            }
            case 'player_flees': {
                break;
            }
            default: {
                break;
            }
        }

        const clearedCombat = await clearCombatByCharacterId(character.id);
        return c.json(clearedCombat);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

// Update combat encounter
combat.put('/', async (c) => {
    // Get the player's action
    const action = c.req.query('action');
    if (!action) {
        return c.json({ message: 'action query parameter is required' }, 400);
    }

    // Get the character data
    const user = c.get('user').user;
    const character = await getCharacterByUserId(user.id);
    const characterId = character?.id;
    if (characterId === "") {
        throw new HTTPException(404, { message: 'character not found' });
    }

    // Get the combat data for the character
    const combat = await getCombatByCharacterId(character.id);

    // Check if the outcome is already set
    if (combat.state.outcome) {
        // If the outcome is already set, return the combat data
        return c.json(combat);
    }

    // Can calculate the monster damager here since it will be used in various places later
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

    // Handle player actions here
    switch (action) {
        case "start": {
            // Start a new combat
            const monsterId = c.req.query('monster_id');
            if (!monsterId) {
                return c.json({ message: 'monster_id query parameter is required to start combat' }, 400);
            }
            try {
                // Check if combat already exists
                if (combat.player && combat.monster) {
                    return c.json(combat);
                }

                // Get player combat stats
                const player = await getCharacterCombatStats(character.id);

                // Get monster data
                const monster = await getMonsterById(monsterId);
                // Remember to set the monster's max health to the current health, maybe we should just add this to the table
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
                // Roll the player's damage
                const playerDamage = rollDamage(combat.player.power, combat.monster.toughness);

                // Then calcuate how much health the monster has left
                const monsterHealth = assignDamage(combat.monster.health, playerDamage);
                combat.monster.health = monsterHealth;

                // Check if monster is dead
                if (checkIsDead(combat.monster.health)) {
                    // In this case we can set the outcome to player_wins and add rewards
                    // TODO: add rewards to the outcome
                    combat.state.outcome = {
                        status: 'player_wins',
                        // rewards: {
                        //     gold: combat.monster.gold,
                        //     experience: combat.monster.experience,
                        //     loot: []
                        // }
                    }

                    // Make sure to replace the whole last actions with just the player action since the monster is dead
                    combat.state.last_actions = {
                        player: {
                            action: 'attacks',
                            amount: playerDamage
                        }
                    }
                } else {
                    // In this case the mosnter is still alive and attacks the player back
                    const playerHealth = assignDamage(combat.player.health, monsterDamage);
                    combat.player.health = playerHealth;

                    // Make sure to just append the player's last action and leave the monster's action intact
                    combat.state.last_actions = {
                        ...combat.state.last_actions,
                        player: {
                            action: 'attacks',
                            amount: playerDamage
                        }
                    }

                    await updateCharacterCombatStats(character.id, { health: combat.player.health });
                }
                break;
            } catch (error) {
                throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
            }
        }
        case "defend": {
            try {
                // For now defend is the only way to heal
                const healthRestored = 5;

                // First check how much health the player has after healing
                let playerHealth = assignHealing(combat.player.health, combat.player.max_health, healthRestored);

                // Then check how much health the player has after the monster attacks
                playerHealth = assignDamage(playerHealth, monsterDamage);
                combat.player.health = playerHealth;

                // Update the player's health in the database
                await updateCharacterCombatStats(character.id, { health: playerHealth });

                combat.state.last_actions = {
                    ...combat.state.last_actions,
                    player: {
                        action: 'heals',
                        amount: healthRestored
                    }
                }
                // Continue to after the switch where we check if the player is dead and perform other cleanup actions
                break;
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
            // const combat = await clearCombatByCharacterId(character.id);
            // return c.json(combat);
            // Fleeing has a 90% chance of success
            const fleeChance = Math.random();
            if (fleeChance < 0.9) {
                // Flee successful
                combat.state.outcome = {
                    status: 'player_flees'
                }
                combat.state.last_actions = {
                    player: {
                        action: 'flees'
                    }
                }
            }
            else {
                // Flee failed
                const playerHealth = assignDamage(combat.player.health, monsterDamage);
                combat.player.health = playerHealth;

                // Update the player's health in the database
                await updateCharacterCombatStats(character.id, { health: playerHealth });

                // Make sure to just append the player's last action and leave the monster's action intact
                combat.state.last_actions = {
                    ...combat.state.last_actions,
                    player: {
                        action: 'flee'
                    }
                }
            }
        }
        default: {
            return c.json({ message: 'invalid action' }, 400);
        }
    }

    // Check if player is dead
    if (checkIsDead(combat.player.health)) {
        // TODO: Add dealth penalty to the player
        combat.state.outcome = {
            status: 'player_loses'
        }
    }

    return c.json(await updateCombatByCharacter(character, combat.state, combat.player, combat.monster));
});

export default combat;