import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, eloDeltaColor, eloDeltaLabel } from '@/lib/utils'
import { DisputeButton } from '@/components/match/DisputeButton'

export default async function MatchDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentPlayer } = user
    ? await supabase.from('players').select('id').eq('auth_user_id', user.id).single()
    : { data: null }

  const { data: match } = await supabase
    .from('matches')
    .select(`
      *,
      created_by_player:players!matches_created_by_fkey(id, display_name),
      match_teams (
        id, team,
        match_players (
          role,
          players ( id, display_name, avatar_url )
        )
      ),
      match_sets ( id, set_index, team_a_goals, team_b_goals, winner_team, is_fanny )
    `)
    .eq('id', params.id)
    .single()

  if (!match) notFound()
  const canEdit = currentPlayer?.id === (match as any).created_by

  const { data: eloHistory } = await supabase
    .from('elo_history')
    .select('*, players(display_name)')
    .eq('match_id', params.id)

  const teamA = (match as any).match_teams?.find((t: any) => t.team === 'A')
  const teamB = (match as any).match_teams?.find((t: any) => t.team === 'B')
  const sets = (match as any).match_sets?.sort((a: any, b: any) => a.set_index - b.set_index) ?? []
  const aWon = match.team_a_score > match.team_b_score
  const fannyCount = sets.filter((s: any) => s.is_fanny).length

  function renderTeamPlayers(team: any) {
    if (!team?.match_players) return null
    return team.match_players.map((mp: any) => (
      <div key={mp.players.id} className="flex items-center gap-2">
        <Link href={`/profile/${mp.players.id}`} className="font-semibold hover:text-pitch-400 transition-colors">
          {mp.players.display_name}
        </Link>
        {mp.role !== 'solo' && (
          <span className="text-xs text-gray-600">
            {mp.role === 'attacker' ? '⚔️' : '🛡️'}
          </span>
        )}
      </div>
    ))
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Back */}
        <Link href="/matches" className="text-gray-500 hover:text-white text-sm mb-6 flex items-center gap-1 transition-colors">
          ← Historique
        </Link>

        {/* Match header */}
        <div className="card p-6 sm:p-8 text-center mb-6">
          <div className="flex items-center gap-2 justify-center mb-2">
            <span className="badge bg-pitch-900/50 text-pitch-300 text-xs">{match.match_type}</span>
            <span className="text-gray-600 text-xs">{formatDate(match.created_at)}</span>
            {match.status === 'disputed' && <span className="badge bg-red-900/50 text-red-400">⚠️ Litige</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center my-6">
            <div className={`text-center md:text-right ${aWon ? 'text-white' : 'text-gray-500'}`}>
              {renderTeamPlayers(teamA)}
            </div>
            <div className="font-display text-4xl sm:text-5xl">
              <span className={aWon ? 'text-pitch-400' : 'text-gray-500'}>{match.team_a_score}</span>
              <span className="text-gray-700 mx-2">-</span>
              <span className={!aWon ? 'text-pitch-400' : 'text-gray-500'}>{match.team_b_score}</span>
            </div>
            <div className={`text-center md:text-left ${!aWon ? 'text-white' : 'text-gray-500'}`}>
              {renderTeamPlayers(teamB)}
            </div>
          </div>

          {fannyCount > 0 && (
            <div className="text-amber-400 text-sm font-semibold">
              🏳️ {fannyCount} Fanny dans ce match !
            </div>
          )}
        </div>

        {/* Sets detail */}
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-400 mb-4 text-sm uppercase tracking-wider">Détail des manches</h2>
          <div className="space-y-2">
            {sets.map((s: any, i: number) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3">
                <span className="text-gray-600 text-xs sm:text-sm w-20 shrink-0">Manche {i + 1}</span>
                <div className="flex items-center gap-3 flex-1">
                  <span className={`font-display text-2xl ${s.winner_team === 'A' ? 'text-pitch-400' : 'text-gray-500'}`}>
                    {s.team_a_goals}
                  </span>
                  <span className="text-gray-700">-</span>
                  <span className={`font-display text-2xl ${s.winner_team === 'B' ? 'text-pitch-400' : 'text-gray-500'}`}>
                    {s.team_b_goals}
                  </span>
                  {s.is_fanny && (
                    <span className="badge bg-amber-900/50 text-amber-400 ml-2">🏳️ FANNY</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ELO changes */}
        {eloHistory && eloHistory.length > 0 && (
          <div className="card p-6 mb-6">
            <h2 className="font-semibold text-gray-400 mb-4 text-sm uppercase tracking-wider">Variation ELO</h2>
            <div className="space-y-2">
              {eloHistory.map((h: any) => (
                <div key={h.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <Link href={`/profile/${h.player_id}`} className="font-semibold hover:text-pitch-400 transition-colors text-sm">
                    {h.players?.display_name}
                  </Link>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500">{h.elo_before}</span>
                    <span className="text-gray-700">→</span>
                    <span className="font-semibold">{h.elo_after}</span>
                    <span className={`font-bold w-12 text-right ${eloDeltaColor(h.delta)}`}>
                      {eloDeltaLabel(h.delta)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saisi par + litige */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-600">
          <span>Saisi par : <span className="text-gray-400">{(match as any).created_by_player?.display_name}</span></span>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link href={`/matches/${match.id}/edit`} className="btn-ghost text-xs">
                Modifier
              </Link>
            )}
            <DisputeButton matchId={match.id} />
          </div>
        </div>
      </main>
    </div>
  )
}
