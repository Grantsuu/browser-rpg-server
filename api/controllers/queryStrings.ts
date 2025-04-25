export const getItem = `
    id,
    name,
    category,
    value,
    description,
    image
`;

export const getMonsterLoot = `
    monster_id,
    item:items!monster_loot_item_id_fkey(
        ${getItem}
    ),
    quantity,
    drop_probability
`;