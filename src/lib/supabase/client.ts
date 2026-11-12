import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  let supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fxkidmxnjwzqolenswdk.supabase.co').trim();
  if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    supabaseUrl = `https://${supabaseUrl}`;
  }
  const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_RDKWGjTMxv9e_pHzrWsCfg_lX4Jk_R9').trim();

  return createBrowserClient(supabaseUrl, supabaseKey);
}
