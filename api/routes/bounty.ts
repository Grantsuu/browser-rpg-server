import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { deleteBounty, getCharacterBounties, insertBounty, updateBounty } from "../controllers/bounty.js";
import { error } from "console";

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
    if (!bounty) {
        throw new HTTPException(400, { message: 'Bounty not found' });
    }
    try {
        // Add required item id
        if (bounty.required_item) {
            bounty.required_item_id = bounty.required_item.id;
            bounty.required_item = undefined; // Remove the item object from the bounty
        }
        if (bounty.required_monster) {
            bounty.required_monster_id = bounty.required_monster.id;
            bounty.required_monster = undefined; // Remove the monster object from the bounty
        }
        if (bounty.reward_item) {
            bounty.reward_item_id = bounty.reward_item.id;
            bounty.reward_item = undefined; // Remove the item object from the bounty
        }
        const newBounty = await insertBounty(bounty);
        return c.json(newBounty);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

bounty.delete('/:id', async (c) => {
    const bountyId = c.req.param('id');
    try {
        const deletedBounty = await deleteBounty(bountyId);
        return c.json(deletedBounty);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default bounty;