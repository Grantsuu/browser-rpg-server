import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCharacterBounties, insertBounty, updateBounty } from "../controllers/bounty.js";

const bounty = new Hono();

bounty.get('/', async (c) => {
    try {
        const bounty = await getCharacterBounties();
        return c.json(bounty);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

bounty.patch('/:id', async (c) => {
    const bountyId = c.req.param('id');
    const updateJson = await c.req.json();
    try {
        const bounty = await updateBounty(parseInt(bountyId), updateJson);
        return c.json(bounty);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

bounty.post('/', async (c) => {
    const bounty = await c.req.json();
    try {
        const newBounty = await insertBounty(bounty);
        return c.json(newBounty);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

bounty.delete('/:id', async (c) => {
    const bountyId = c.req.param('id');
    try {
        const deletedBounty = await updateBounty(parseInt(bountyId), { active: false });
        return c.json(deletedBounty);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default bounty;