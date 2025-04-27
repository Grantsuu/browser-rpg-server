import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { getCharacterEquipment } from "../controllers/equipment.js";

const equipment = new Hono();

equipment.get('/', async (c) => {
    try {
        const equipment = await getCharacterEquipment();
        return c.json(equipment);
    }
    catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default equipment;