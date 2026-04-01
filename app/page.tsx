import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: regions, error } = await supabase.from('regions').select('*')

  return (
    <main>
      <pre>{JSON.stringify({ regions, error }, null, 2)}</pre>
    </main>
  )
}