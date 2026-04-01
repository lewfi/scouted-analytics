import { createBrowserClient } from '@supabase/ssr'

// Used in Client Components ('use client')
// Uses the anon key — respects RLS policies
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}