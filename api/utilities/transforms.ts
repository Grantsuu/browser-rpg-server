import type { SupabaseCategory } from "../types/types.js";

export const supabaseCategoriesToArray = (categories: SupabaseCategory[]) => {
    const categoryArray: string[] = [];
    categories.map((category) => {
        categoryArray.push(category.type_category);
    });
    return categoryArray;
}