import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

const safeUrl = SUPABASE_URL.startsWith('http') ? SUPABASE_URL : 'https://placeholder.supabase.co'
const safeKey = SUPABASE_ANON_KEY.length > 10 ? SUPABASE_ANON_KEY : 'placeholder-anon-key-for-build'

export function createClient() {
  return createBrowserClient<Database>(safeUrl, safeKey)
}
