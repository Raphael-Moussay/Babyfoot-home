import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NewMatchForm } from '@/components/match/NewMatchForm'
import { Navbar } from '@/components/layout/Navbar'

export default async function NewMatchPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: currentPlayer } = await supabase
    .from('players').select('*').eq('auth_user_id', user.id).single()

  const { data: allPlayers } = await supabase
    .from('players').select('id, display_name, avatar_url, email').order('display_name')

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="font-display text-4xl tracking-wider mb-8">NOUVEAU MATCH</h1>
        <NewMatchForm
          currentPlayer={currentPlayer}
          allPlayers={allPlayers ?? []}
        />
      </main>
    </div>
  )
}
