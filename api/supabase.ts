import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl ? supabaseUrl : '', supabaseKey ? supabaseKey : '')
