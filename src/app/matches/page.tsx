import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export const revalidate = 60

export default async function MatchesPage() {
  const supabase = createClient()

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, created_at, match_type, team_a_score, team_b_score, status,
      match_teams (
        team,
        match_players (
          role,
          players ( id, display_name, avatar_url )
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-display text-4xl tracking-wider mb-8">HISTORIQUE DES MATCHS</h1>

        <div className="space-y-3">
          {(matches ?? []).map((match: any) => {
            const teamA = match.match_teams?.find((t: any) => t.team === 'A')
            const teamB = match.match_teams?.find((t: any) => t.team === 'B')
            const playersA = teamA?.match_players?.map((mp: any) => mp.players?.display_name).filter(Boolean) ?? []
            const playersB = teamB?.match_players?.map((mp: any) => mp.players?.display_name).filter(Boolean) ?? []
            const aWon = match.team_a_score > match.team_b_score

            return (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="card p-4 flex items-center gap-4 hover:border-pitch-700 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs badge ${match.match_type === '2v2' ? 'bg-blue-900/50 text-blue-300' : 'bg-pitch-900/50 text-pitch-300'}`}>
                      {match.match_type}
                    </span>
                    <span className="text-gray-600 text-xs">{formatDate(match.created_at)}</span>
                    {match.status === 'disputed' && (
                      <span className="badge bg-red-900/50 text-red-400">⚠️ Litige</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold text-sm truncate ${aWon ? 'text-white' : 'text-gray-500'}`}>
                      {playersA.join(' & ')}
                    </span>
                    <div className="font-display text-2xl shrink-0">
                      <span className={aWon ? 'text-pitch-400' : 'text-gray-500'}>{match.team_a_score}</span>
                      <span className="text-gray-700 mx-1">-</span>
                      <span className={!aWon ? 'text-pitch-400' : 'text-gray-500'}>{match.team_b_score}</span>
                    </div>
                    <span className={`font-semibold text-sm truncate ${!aWon ? 'text-white' : 'text-gray-500'}`}>
                      {playersB.join(' & ')}
                    </span>
                  </div>
                </div>
                <span className="text-gray-600 group-hover:text-pitch-400 transition-colors text-lg">›</span>
              </Link>
            )
          })}
          {(matches?.length ?? 0) === 0 && (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">⚽</div>
              <p>Aucun match enregistré.</p>
              <Link href="/matches/new" className="btn-primary inline-flex mt-4">+ Nouveau match</Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
