import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fxkidmxnjwzqolenswdk.supabase.co').trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_RDKWGjTMxv9e_pHzrWsCfg_lX4Jk_R9').trim();

  return createServerClient(url, key, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored in Server Components if middleware refreshes cookies
          }
        },
      },
    }
  );
}
