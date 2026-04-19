import { createClient } from '@supabase/supabase-js';

// Supabase panelinden (Project Settings -> API) alacağın bilgileri buraya yapıştır
const supabaseUrl = 'https://gumvhihbqmicytnmdmcb.supabase.co';
const supabaseKey = 'sb_publishable_WRIVlocus1wRDa2U43y40w_Sdz-fj-Z';

export const supabase = createClient(supabaseUrl, supabaseKey);
