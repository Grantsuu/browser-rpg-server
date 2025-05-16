import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCharacter, updateCharacter, updateCharacterGold } from "../controllers/characters.js";
import { deleteBounty, getCharacterBounties, insertBounty, updateBounty } from "../controllers/bounty.js";
import { addExperience } from "../controllers/character_levels.js";

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
        const bounty = await updateBounty(bountyId, updateJson);
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
        const bounties = await getCharacterBounties();
        if (bounties.length >= 3) {
            throw new HTTPException(500, { message: 'You can only have 3 bounties at a time' });
        }
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

bounty.post('/reroll', async (c) => {
    const bountyId = c.req.query('id');
    if (!bountyId) {
        throw new HTTPException(400, { message: 'missing query param `id`' });
    }
    const bounty = await c.req.json();
    try {
        const character = await getCharacter();
        if (!character) {
            throw new HTTPException(404, { message: 'Character not found' });
        }
        // Update character gold
        if (character.bounty_tokens && character.bounty_tokens < 1) {
            // Check if the character has enough gold to reroll the bounty
            throw new HTTPException(500, { message: 'not enough bounty tokens' });
        }

        delete bounty.id; // Remove the id from the update json
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
        const updatedBounty = await updateBounty(bountyId, bounty);
        await updateCharacter(character.id, { bounty_tokens: character.bounty_tokens - 1 });
        return c.json(updatedBounty);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

bounty.delete('/:id', async (c) => {
    const bountyId = c.req.param('id');
    if (!bountyId) {
        throw new HTTPException(400, { message: 'missing query param `id`' });
    }
    try {
        const character = await getCharacter();
        if (!character) {
            throw new HTTPException(404, { message: 'Character not found' });
        }
        // Update character gold
        if (character.gold && character.gold < 1000) {
            // Check if the character has enough gold to delete the bounty
            throw new HTTPException(500, { message: 'not enough gold' });
        }
        const updatedCharacter = await updateCharacterGold(character.id, character.gold - 1000);
        const deletedBounty = await deleteBounty(bountyId);
        return c.json(deletedBounty);
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

bounty.post('/complete', async (c) => {
    const bountyId = c.req.query('id');
    if (!bountyId) {
        throw new HTTPException(400, { message: 'missing query param `id`' });
    }
    try {
        const character = await getCharacter();
        if (!character) {
            throw new HTTPException(404, { message: 'Character not found' });
        }
        const bounties = await getCharacterBounties();
        if (!bounties) {
            throw new HTTPException(404, { message: 'Bounty not found' });
        }
        const bounty = bounties.find((bounty) => bounty.id === bountyId);
        if (!bounty) {
            throw new HTTPException(404, { message: 'Bounty not found' });
        }
        if (bounty.required_progress < bounty.required_quantity) {
            throw new HTTPException(500, { message: 'Bounty not completed' });
        }
        // Update gold and bounty tokens
        const updatedCharacter = await updateCharacter(character.id, { gold: character.gold + bounty.gold, bounty_tokens: character.bounty_tokens + bounty.bounty_tokens });
        // Update experience
        const experience = await addExperience(character, bounty.skill, bounty.experience);
        // Delete bounty
        const deletedBounty = await deleteBounty(bountyId);
        return c.json({ message: 'Bounty completed' });
    } catch (error) {
        throw new HTTPException((error as HTTPException).status, { message: (error as HTTPException).message });
    }
});

export default bounty;