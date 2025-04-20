export const getMonsterLoot = `
    monster_id,
    item:items!monster_loot_item_id_fkey(*),
    quantity,
    drop_probability
`;