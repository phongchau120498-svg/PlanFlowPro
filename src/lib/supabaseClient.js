import { createClient } from '@supabase/supabase-js';

// Vercel sẽ tự điền 2 thông tin này vào lúc chạy web
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);