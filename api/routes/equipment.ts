import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCharacter } from '../controllers/characters.js'
import { addEqipment, getCharacterEquipment, removeEquipmentById } from "../controllers/equipment.js";
import { addItemToInventory, findEquipmentInInventoryById, removeItemFromInventory } from "../controllers/inventory.js";
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
            const remove = await removeEquipmentById(parseInt(id));
            if (!remove) {
                throw new HTTPException(500, { message: 'unable to remove existing equipment' });
            }
            // Add it back to inventory
            await addItemToInventory(character.id, parseInt(remove[0].item_id), 1);
        }
        // Remove equipment from inventory
        await removeItemFromInventory(parseInt(inventoryEquipment.item_id), 1);
        // Add stats to character combat stats
        const equipment = await addEqipment(character.id, parseInt(id));
        if (!equipment) {
            throw new HTTPException(500, { message: 'unable to add equipment' });
        }
        return c.json(equipment);
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
        // Remove equipment
        const equipment = await removeEquipmentById(parseInt(id));
        // Add it back to inventory
        const character = await getCharacter();
        if (!character) {
            throw new HTTPException(404, { message: 'character not found' });
        }
        await addItemToInventory(character.id, parseInt(equipment[0].item_id), 1);
        // TODO: Remove stats from character combat stats
        return c.json(equipment);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    };
});

export default equipment;