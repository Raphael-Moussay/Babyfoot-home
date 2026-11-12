import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NewMatchForm } from '@/components/match/NewMatchForm'
import { Navbar } from '@/components/layout/Navbar'
import type { Player } from '@/types'

/**
 * Renders the New Match creation page styled after Cricket Cut-throat Pro's setup screen.
 *
 * @returns {Promise<JSX.Element>} The rendered new match page.
 */
export default async function NewMatchPage(): Promise<JSX.Element> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: currentPlayerRecord } = await supabase
    .from('players')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  const { data: allPlayersRecords } = await supabase
    .from('players')
    .select('id, display_name, avatar_url, email')
    .order('display_name')

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto p-3 sm:p-6 space-y-5">
        <div className="panel rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
            <div>
              <div className="app-title text-2xl sm:text-3xl text-white">Nouveau Match</div>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                Enregistrement des manches & calcul ELO automatique
              </p>
            </div>
            <div className="hidden sm:block rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 text-xs font-display font-bold uppercase tracking-widest text-emerald-400">
              Officiel
            </div>
          </div>

          <NewMatchForm
            currentPlayer={(currentPlayerRecord as Player | null) ?? null}
            allPlayers={allPlayersRecords ?? []}
          />
        </div>
      </main>
    </div>
  )
}
