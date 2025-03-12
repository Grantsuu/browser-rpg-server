import type { ClientItem, ClientRecipe, SupabaseInventoryItem, SupabaseRecipe, SupabaseShopItem } from "../types/types.js";

export const supabaseShopItemsToClientItems = (supabaseShopItems: SupabaseShopItem[]) => {
    const items: ClientItem[] = [];
    supabaseShopItems.map((item) => {
        items.push({
            id: item.item.id,
            image: {
                base64: item.item.image.base64
            },
            name: item.item.name,
            category: item.item.category.name,
            value: item.item.value,
            description: item.item.description,
        });
    })
    return items;
};

export const supabaseInventoryItemsToClientItems = (supabaseInventoryItems: SupabaseInventoryItem[]) => {
    const inventory: ClientItem[] = [];
    supabaseInventoryItems.map((item) => {
        inventory.push({
            id: item.item.id,
            image: {
                base64: item.item.image.base64
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

export const combineRecipeRows = (recipeRows: SupabaseRecipe[]) => {
    const recipes: ClientRecipe[] = [];
    recipeRows.map((recipe) => {
        // Look for a recipe with an item id that matches the current recipe being processed
        const recipeFound = recipes.find((r) => r.item.id === recipe.item.id);
        // If the recipe is found, then we just add the ingredients of the current recipe being processed
        if (recipeFound) {
            recipeFound.ingredients.push(
                {
                    id: recipe.ingredient.id,
                    image: {
                        base64: recipe.ingredient.image.base64
                    },
                    name: recipe.ingredient.name,
                    category: recipe.ingredient.category.name,
                    value: recipe.ingredient.value,
                    description: recipe.ingredient.description,
                    amount: recipe.amount
                }
            );
        } else {
            // Otherwise, add a new recipe to the list
            recipes.push({
                item: {
                    id: recipe.item.id,
                    image: {
                        base64: recipe.item.image.base64
                    },
                    name: recipe.item.name,
                    category: recipe.item.category.name,
                    value: recipe.item.value,
                    description: recipe.item.description
                },
                ingredients: [{
                    id: recipe.ingredient.id,
                    image: {
                        base64: recipe.ingredient.image.base64
                    },
                    name: recipe.ingredient.name,
                    category: recipe.ingredient.category.name,
                    value: recipe.ingredient.value,
                    description: recipe.ingredient.description,
                    amount: recipe.amount
                }]
            });
        }
    });
    return recipes;
}
