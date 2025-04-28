import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCharacter } from '../controllers/characters.js'
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
        const character = await getCharacter();
        if (!character) {
            throw new HTTPException(404, { message: 'character not found' });
        }
        // Check if character is already wearing equipment of this category
        const equipped = await getCharacterEquipment(inventoryEquipment.category as EquipmentCategoryType);
        if (equipped && equipped.length > 0) {
            // If they are then remove it
            await removeEquipment(character.id, parseInt(id));
        }
        // Remove equipment from inventory
        await removeItemFromInventory(parseInt(inventoryEquipment.item_id), 1);
        // Add stats to character combat stats
        const equipment = await addEqipment(character.id, parseInt(id));
        if (!equipment) {
            throw new HTTPException(500, { message: 'unable to add equipment' });
        }
        const stats = await getCharacterCombatStats();
        if (!stats) {
            throw new HTTPException(404, { message: 'character combat stats not found' });
        }
        const updatedStats = {
            ...stats,
            max_health: stats.max_health + inventoryEquipment.health,
            power: stats.power + inventoryEquipment.power,
            toughness: stats.toughness + inventoryEquipment.toughness
        }
        const updatedCombatStats = await updateCharacterCombatStats(character.id, updatedStats);
        return c.json({ equipment, updatedCombatStats });
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
        const newMaxHealth = stats.max_health - equipment[0].health;
        const updatedStats = {
            ...stats,
            max_health: newMaxHealth,
            health: newMaxHealth < stats.health ? newMaxHealth : stats.health,
            power: stats.power - equipment[0].power,
            toughness: stats.toughness - equipment[0].toughness
        }
        const updatedCombatStats = await updateCharacterCombatStats(characterId, updatedStats);
        return { equipment, updatedCombatStats };
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
}

export default equipment;