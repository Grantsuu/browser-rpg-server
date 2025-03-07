import { Hono } from "hono";
import { supabase } from '../lib/supabase.ts';
import { type ClientItem, type SupabaseShopItem } from "../types/types.ts";

const inventory = new Hono();

inventory.get('/', async (c) => {

    // console.log(user);
    return c.text('inventory');
});

export default inventory;

