export type SupabaseCharacter = {
    id: string,
    user: string,
    created_at: string,
    name: string,
    gold: number
}

type ItemImageData = {
    base64: string,
    alt: string
}

export type ItemEffectType = "restore_health";

export type ItemEffectUnit = "integer" | "second";

export type ItemEffectReturnData = {
    character_combat: PlayerCombat | undefined,
    inventory_item: ItemData | undefined
}

export type ItemEffectData = {
    id: number,
    item_id: number,
    effect: ItemEffectType,
    effect_value: number,
    effect_unit: ItemEffectUnit
}

export type ItemCategoryType = "material" | "consumable" | "weapon" | "armor" | "accessory";

export type ItemSubcategoryType = "food" | "seed" | "ingredient" | "fish";

export type ItemData = ItemImageData & {
    id: number,
    amount?: number,
    name: string,
    category: ItemCategoryType,
    subcategory?: ItemSubcategoryType,
    value: number,
    description: string,
    effects?: ItemEffectData[],
}

export type SupabaseCategory = {
    type_category: string
}

export type RecipeData = {
    id: number,
    item: ItemData,
    ingredients: ItemData[],
    category: string,
    experience: number,
    required_level: number
}

export type SupabaseCrop = {
    id: number,
    seed_id: number,
    product: ItemData,
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
    item: ItemData,
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
            loot: ItemEffectData[]
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
    item: ItemData;
    quantity: number;
    drop_probability: number;
}