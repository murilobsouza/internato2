
import { createClient } from '@supabase/supabase-js';

// Substitua estas chaves pelas suas chaves do painel do Supabase (Project Settings > API)
// Ao fazer o deploy na Vercel, você deve configurar estas variáveis de ambiente lá.
// Use process.env to avoid TypeScript errors on ImportMeta and follow standard environment access patterns.
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://plvoogvaddxdwqyeqydt.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_OG1foQAiLcKMjRFmdF7iew_423mA8oV';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
