import { createClient } from '@supabase/supabase-js'

// Thay 2 thông tin này bằng thông tin lấy từ Settings > API trên trang Supabase của anh
const supabaseUrl = 'https://kivzurhuxsxwvdugujjg.supabase.co' 
const supabaseKey = 'sb_publishable_9ttt_Pw081eSgfISoUcFYA_e1RABNWY'

export const supabase = createClient(supabaseUrl, supabaseKey)