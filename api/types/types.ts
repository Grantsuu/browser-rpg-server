type Image = {
    base64: string
}

export type ClientItem = {
    id: number
    image: Image,
    name: string,
    category: string,
    value: number,
    description: string,
    amount?: number
}

export type ClientRecipe = {
    item: ClientItem
    ingredients: ClientItem[]
}

export type SupabaseItem = {
    id: number,
    category: { name: string },
    description: string,
    image: Image,
    name: string,
    value: number
}

export type SupabaseInventoryItem = {
    amount: number,
    item: SupabaseItem
}

export type SupabaseShopItem = {
    item: SupabaseItem;
}

export type SupabaseRecipe = {
    item: SupabaseItem,
    ingredient: SupabaseItem,
    amount: number,
}

export type SupabaseFarmPlot = {
    id: number,
    character_id: string,
    crop_id: number,
    start_time: string,
    end_time: string
}