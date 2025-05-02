import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCharacterBounties } from "../controllers/bounty.js";

const bounty = new Hono();

bounty.get('/', async (c) => {
    try {
        const bounty = await getCharacterBounties();
        return c.json(bounty);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default bounty;