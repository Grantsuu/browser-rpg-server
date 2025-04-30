import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCharacter } from '../controllers/characters.js'
import { getCharacterLevels } from '../controllers/character_levels.js';
import { addEqipment, getCharacterEquipment, removeEquipmentById } from "../controllers/equipment.js";
import { addItemToInventory, findEquipmentInInventoryById, removeItemFromInventory } from "../controllers/inventory.js";
import { getCharacterCombatStats, updateCharacterCombatStats } from "../controllers/combat.js";
import type { EquipmentCategoryType } from "../types/types.js";

const equipment = new Hono();

equipment.get('/', async (c) => {
    try {
        const equipment = await getCharacterEquipment();
        return c.json(equipment);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

equipment.post('/', async (c) => {
    try {
        const id = c.req.query('id');
        if (!id) {
            throw new HTTPException(400, { message: `missing query param 'id'` });
        }
        // Check if equipment is in inventory
        const inventoryEquipment = await findEquipmentInInventoryById(parseInt(id));
        if (!inventoryEquipment) {
            throw new HTTPException(404, { message: 'equipment not found in inventory' });
        }
        const character = await getCharacterLevels();
        if (!character) {
            throw new HTTPException(404, { message: 'character not found' });
        }
        if (character.combat_level < (inventoryEquipment[0].required_level as number)) {
            throw new HTTPException(500, { message: `character level ${character.combat_level} is not high enough to equip this item` });
        }
        // Check if character is already wearing equipment of this category
        const equipped = await getCharacterEquipment(inventoryEquipment[0].equipment_category as EquipmentCategoryType);
        if (equipped && equipped.length > 0) {
            // If they are then remove it
            await removeEquipment(character.character_id, parseInt(id));
        }
        // Remove equipment from inventory
        await removeItemFromInventory(parseInt(inventoryEquipment[0].item_id), 1);
        // Add stats to character combat stats
        const equipment = await addEqipment(character.character_id, parseInt(id));
        if (!equipment) {
            throw new HTTPException(500, { message: 'unable to add equipment' });
        }
        const stats = await getCharacterCombatStats();
        if (!stats) {
            throw new HTTPException(404, { message: 'character combat stats not found' });
        }
        const updatedStats = {
            ...stats,
            max_health: stats.max_health + inventoryEquipment[0].health,
            power: stats.power + inventoryEquipment[0].power,
            toughness: stats.toughness + inventoryEquipment[0].toughness
        }
        const updatedCombatStats = await updateCharacterCombatStats(character.character_id, updatedStats);
        return c.json({ inventoryEquipment: inventoryEquipment[0], updatedCombatStats });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

equipment.delete('/', async (c) => {
    try {
        const id = c.req.query('id');
        if (!id) {
            throw new HTTPException(400, { message: `missing query param 'id'` });
        }
        // Add it back to inventory
        const character = await getCharacter();
        if (!character) {
            throw new HTTPException(404, { message: 'character not found' });
        }
        const updatedEquipmentAndStats = await removeEquipment(character.id, parseInt(id));
        return c.json(updatedEquipmentAndStats);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    };
});

const removeEquipment = async (characterId: string, equipmentId: number) => {
    try {
        const equipment = await removeEquipmentById(equipmentId);
        if (equipment.length < 1) {
            throw new HTTPException(404, { message: 'equipment not found' });
        }
        await addItemToInventory(characterId, parseInt(equipment[0].item_id), 1);
        // remove stats from character combat stats
        const stats = await getCharacterCombatStats();
        if (!stats) {
            throw new HTTPException(404, { message: 'character combat stats not found' });
        }
        const newMaxHealth = stats.max_health - (equipment[0].health as number);
        const updatedStats = {
            ...stats,
            max_health: newMaxHealth,
            health: newMaxHealth < stats.health ? newMaxHealth : stats.health,
            power: stats.power - (equipment[0].power as number),
            toughness: stats.toughness - (equipment[0].toughness as number)
        }
        const updatedCombatStats = await updateCharacterCombatStats(characterId, updatedStats);
        return { equipment, updatedCombatStats };
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

export default equipment;