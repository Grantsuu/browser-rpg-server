import type { ClientItem, SupabaseInventoryItem, SupabaseShopItem } from "../types/types.ts";

export const supabaseInventoryItemsToClientItems = (supabaseInventoryItems: SupabaseInventoryItem[]) => {
    const inventory: ClientItem[] = [];
    supabaseInventoryItems.map((item) => {
        inventory.push({
            id: item.item.id,
            image: {
                base64: item.item.image.base64,
                type: item.item.image.type
            },
            name: item.item.name,
            category: item.item.category.name,
            value: item.item.value,
            description: item.item.description,
            amount: item.amount,
        });
    })
    return inventory;
};

export const supabaseShopItemsToClientItems = (supabaseShopItems: SupabaseShopItem[]) => {
    const items: ClientItem[] = [];
    supabaseShopItems.map((item) => {
        items.push({
            id: item.item.id,
            image: {
                base64: item.item.image.base64,
                type: item.item.image.type
            },
            name: item.item.name,
            category: item.item.category.name,
            value: item.item.value,
            description: item.item.description,
        });
    })
    return items;
};