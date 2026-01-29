import { createClient } from '@supabase/supabase-js';

// Access environment variables using process.env to resolve TypeScript errors related to ImportMeta.
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://plvoogvaddxdwqyeqydt.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_OG1foQAiLcKMjRFmdF7iew_423mA8oV';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
