import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { HeadToHeadClient } from '@/components/match/HeadToHeadClient'

export default async function HeadToHeadPage() {
  const supabase = createClient()

  const { data: players } = await supabase
    .from('players')
    .select('id, display_name, avatar_url')
    .order('display_name')

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-display text-4xl tracking-wider mb-8">HEAD-TO-HEAD</h1>
        <HeadToHeadClient players={players ?? []} />
      </main>
    </div>
  )
}
