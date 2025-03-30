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
    ingredients: ClientItem[],
    amount: number,
    category: string,
    experience: number,
    required_level: number
}

export type SupabaseCharacter = {
    id: string,
    user: string,
    created_at: string,
    name: string,
    gold: number,
    farming_level: number,
    farming_experience: number,
    cooking_level: number,
    cooking_experience: number
}

export type SupabaseItem = {
    id: number,
    category: string,
    description: string,
    image: Image,
    name: string,
    value: number
}

export type SupabaseInventoryItem = {
    amount: number,
    item: SupabaseItem
}

export type SupabaseCategory = {
    name: string
}

export type SupabaseShopItem = {
    item: SupabaseItem;
}

export type SupabaseRecipe = {
    item: SupabaseItem,
    ingredient: SupabaseItem,
    amount: number,
    category: string,
    experience: number,
    required_level: number
}

export type SupabaseCrop = {
    id: number,
    seed_id: number,
    product: SupabaseItem,
    required_level: number,
    grow_time: number,
    experience: number,
    amount_produced: string[]
}

export type SupabaseFarmPlot = {
    id: number,
    character_id: string,
    crop: SupabaseCrop,
    start_time: string,
    end_time: string,
    previous_crop: SupabaseCrop
}