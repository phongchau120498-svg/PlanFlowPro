import { createClient } from '@supabase/supabase-js';

// Thay thế bằng thông tin Project thật của anh
const supabaseUrl = 'https://kivzurhuxsxwvdugujjg.supabase.co';
const supabaseKey = 'sb_publishable_9ttt_Pw081eSgfISoUcFYA_e1RABNWY';

export const supabase = createClient(supabaseUrl, supabaseKey);