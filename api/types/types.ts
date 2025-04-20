type Image = {
    base64: string,
    alt: string
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

export type SupabaseFishing = {
    id: number,
    character_id: string,
    turns: number,
    game_state: object,
    area: FishingArea,
    previous_area: FishingArea
}

export type FishingArea = {
    name: string,
    description: string,
    max_turns: number,
    size: FishingAreaSize,
    required_level: number,
    fish: number,
    bountiful_fish: number
}

export type FishingAreaSizes = 'Small' | 'Medium' | 'Large';

export type FishingAreaSize = {
    name: FishingAreaSizes,
    rows: number,
    cols: number
}

export type FishingGameState = {
    tiles: FishingGameTile[][]
}

export type FishingGameTile = {
    isDiscovered: boolean,
    content: FishingGameTileContent
}

export type Fish = {
    id: number,
    name: string,
    item: SupabaseItem,
    required_level: number,
    experience: number,
    area: FishingArea
}

export type FishingGameTileContent = 'undiscovered' | 'fish' | 'bountiful' | number;

export type CombatState = {
    outcome: {
        status: string
        rewards: {
            gold: number,
            experience: number,
            loot: ClientItem[]
        }
    },
    last_actions: {
        player: object,
        monster: object
    }
}

export type Monster = {
    id: number;
    name: string;
    description: string;
    area: string;
    level: number;
    health: number;
    power: number;
    toughness: number;
    experience: number;
    gold: number;
    image: string;
}

export type PlayerCombat = {
    health: number;
    max_health: number;
    power: number;
    toughness: number;
}

export type MonsterLoot = {
    monster_id: number;
    item: SupabaseItem;
    quantity: number;
    drop_probability: number;
}