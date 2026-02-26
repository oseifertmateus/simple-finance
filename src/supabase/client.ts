import { createClient } from "@supabase/supabase-js";

const supabaseUrl = `https://raoqnkzfiryivpffurbp.supabase.co`;
const supabaseKey = "sb_publishable_E0Raz_pMpACG-PfqjIrVFw_2CMjJYYL";

export const supabase = createClient(supabaseUrl, supabaseKey);
