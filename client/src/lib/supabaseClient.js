import { createClient } from '@supabase/supabase-js';
import { config, isSupabaseConfigured } from '@/config/env';

export { isSupabaseConfigured };

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey || 'dummy_anon_key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
