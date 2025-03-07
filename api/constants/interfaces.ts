export interface ClientItem {
    id: number
    image: {
        base64: string,
        type: string
    },
    name: string,
    category: string,
    value: number,
    description: string,
    amount?: number
}

export interface SupabaseItem {
    id: number,
    category: { name: string },
    description: string,
    image: { base64: string, type: string },
    name: string,
    value: number
}

export interface SupabaseShopItem {
    item: SupabaseItem;
}