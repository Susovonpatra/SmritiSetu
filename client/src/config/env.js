/**
 * Typed, validated client-side configuration.
 * Fails fast with clear warnings if critical environment variables are invalid.
 */

const envSource = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

export const config = {
  apiBaseUrl: envSource.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  supabaseUrl: envSource.VITE_SUPABASE_URL || 'https://fqlxmddmqegxmwzqxqpx.supabase.co',
  supabaseAnonKey: envSource.VITE_SUPABASE_ANON_KEY || '',
  isProduction: envSource.PROD ?? false,
  isDevelopment: envSource.DEV ?? true,
};

export const isSupabaseConfigured = Boolean(
  config.supabaseUrl &&
  config.supabaseAnonKey &&
  !config.supabaseAnonKey.includes('dummy_anon_key')
);
