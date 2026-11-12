import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, eloDeltaColor, eloDeltaLabel } from '@/lib/utils'
import { DisputeButton } from '@/components/match/DisputeButton'
import type { MatchStatus, MatchType, PlayerRole, TeamSide } from '@/types'

/** Minimum count of Fanny sets to display the Fanny highlight banner. */
const MIN_FANNY_BANNER_COUNT = 1

/**
 * Route parameters for the MatchDetailPage component.
 */
interface MatchDetailPageProps {
  params: {
    id: string
  }
}

/**
 * Participant record nested inside a match team.
 */
interface DetailedMatchPlayer {
  role: PlayerRole
  players: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

/**
 * Team record nested inside a detailed match.
 */
interface DetailedMatchTeam {
  id: string
  team: TeamSide
  match_players: DetailedMatchPlayer[]
}

/**
 * Individual set score record in a match.
 */
interface DetailedMatchSet {
  id: string
  set_index: number
  team_a_goals: number
  team_b_goals: number
  winner_team: TeamSide
  is_fanny: boolean
}

/**
 * Detailed match record returned from Supabase.
 */
interface DetailedMatchRecord {
  id: string
  created_at: string
  created_by: string
  match_type: MatchType
  team_a_score: number
  team_b_score: number
  status: MatchStatus
  created_by_player: {
    id: string
    display_name: string
  } | null
  match_teams: DetailedMatchTeam[]
  match_sets: DetailedMatchSet[]
}

/**
 * ELO history entry with joined player display name.
 */
interface MatchEloHistoryRecord {
  id: string
  player_id: string
  elo_before: number
  elo_after: number
  delta: number
  players: {
    display_name: string
  } | null
}

/**
 * Renders the list of players for a given team with role badges.
 *
 * @param {DetailedMatchTeam | undefined} teamRecord - The team record to render.
 * @returns {JSX.Element | null} Rendered list of team players.
 */
function renderTeamPlayersList(teamRecord: DetailedMatchTeam | undefined): JSX.Element | null {
  if (!teamRecord?.match_players) return null
  return (
    <div className="space-y-1.5">
      {teamRecord.match_players.map((participant: DetailedMatchPlayer) => (
        <div key={participant.players.id} className="flex items-center justify-center gap-2 min-w-0">
          <Link
            href={`/profile/${participant.players.id}`}
            className="player-initials text-sm sm:text-lg hover:text-emerald-400 transition-colors"
          >
            {participant.players.display_name}
          </Link>
          {participant.role !== 'solo' && (
            <span
              className="text-xs px-1.5 py-0.5 rounded bg-white/5 border border-white/10 shrink-0"
              title={participant.role === 'attacker' ? 'Attaquant' : 'Défenseur'}
            >
              {participant.role === 'attacker' ? '⚔️' : '🛡️'}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * Renders the detailed scoreboard, set breakdown, and ELO variations for a specific match.
 *
 * @param {MatchDetailPageProps} props - Route parameters containing the match ID.
 * @returns {Promise<JSX.Element>} The rendered match detail page.
 */
export default async function MatchDetailPage({
  params,
}: MatchDetailPageProps): Promise<JSX.Element> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: currentPlayer } = user
    ? await supabase.from('players').select('id').eq('auth_user_id', user.id).single()
    : { data: null }

  const { data: rawMatch } = await supabase
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

  if (!rawMatch) notFound()

  const matchRecord = rawMatch as unknown as DetailedMatchRecord
  const canEditMatch: boolean = currentPlayer?.id === matchRecord.created_by

  const { data: rawEloHistory } = await supabase
    .from('elo_history')
    .select('*, players(display_name)')
    .eq('match_id', params.id)

  const eloHistoryList: MatchEloHistoryRecord[] =
    (rawEloHistory ?? []) as unknown as MatchEloHistoryRecord[]

  const teamARecord: DetailedMatchTeam | undefined = matchRecord.match_teams?.find(
    (teamEntry: DetailedMatchTeam) => teamEntry.team === 'A'
  )
  const teamBRecord: DetailedMatchTeam | undefined = matchRecord.match_teams?.find(
    (teamEntry: DetailedMatchTeam) => teamEntry.team === 'B'
  )
  const sortedSets: DetailedMatchSet[] = [...(matchRecord.match_sets ?? [])].sort(
    (setA: DetailedMatchSet, setB: DetailedMatchSet) => setA.set_index - setB.set_index
  )
  const didTeamAWin: boolean = matchRecord.team_a_score > matchRecord.team_b_score
  const totalFannySets: number = sortedSets.filter((matchSet: DetailedMatchSet) => matchSet.is_fanny).length

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-5">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between gap-2">
          <Link href="/matches" className="btn-ghost inline-flex items-center gap-1.5">
            ← Retour
          </Link>
          {canEditMatch && (
            <Link href={`/matches/${matchRecord.id}/edit`} className="btn-amber">
              Modifier
            </Link>
          )}
        </div>

        {/* Main Scoreboard Panel */}
        <div className="panel rounded-3xl p-4 sm:p-8 text-center shadow-2xl">
          <div className="flex items-center gap-2 justify-center mb-4 flex-wrap">
            <span className="badge bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
              Format {matchRecord.match_type}
            </span>
            <span className="history-time">{formatDate(matchRecord.created_at)}</span>
            {matchRecord.status === 'disputed' && (
              <span className="badge bg-rose-500/10 text-rose-300 border border-rose-500/25">
                ⚠️ Litige en cours
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 items-center my-4 sm:my-6">
            <div
              className={`score-card p-3.5 sm:p-4 ${
                didTeamAWin
                  ? 'border-emerald-500/35 bg-emerald-500/[0.06]'
                  : 'opacity-75'
              }`}
            >
              <div className="text-[10px] font-display uppercase tracking-widest text-slate-400 mb-1">
                {didTeamAWin ? '🏆 Équipe A' : 'Équipe A'}
              </div>
              {renderTeamPlayersList(teamARecord)}
            </div>

            <div className="py-1 sm:py-2">
              <div className="inline-flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-[#0a0d12] border border-white/10">
                <span
                  className={`score-value text-3xl sm:text-5xl font-black ${
                    didTeamAWin ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {matchRecord.team_a_score}
                </span>
                <span className="font-display text-xl sm:text-2xl text-slate-600">:</span>
                <span
                  className={`score-value text-3xl sm:text-5xl font-black ${
                    !didTeamAWin ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  {matchRecord.team_b_score}
                </span>
              </div>
            </div>

            <div
              className={`score-card p-3.5 sm:p-4 ${
                !didTeamAWin
                  ? 'border-emerald-500/35 bg-emerald-500/[0.06]'
                  : 'opacity-75'
              }`}
            >
              <div className="text-[10px] font-display uppercase tracking-widest text-slate-400 mb-1">
                {!didTeamAWin ? '🏆 Équipe B' : 'Équipe B'}
              </div>
              {renderTeamPlayersList(teamBRecord)}
            </div>
          </div>

          {totalFannySets >= MIN_FANNY_BANNER_COUNT && (
            <div className="mt-3 sm:mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs sm:text-sm font-display font-bold uppercase tracking-wider">
              <span>🏳️</span>
              <span>
                {totalFannySets} {totalFannySets === 1 ? 'Fanny infligée' : 'Fanny infligées'} durant ce match !
              </span>
            </div>
          )}
        </div>

        {/* Sets Breakdown Panel */}
        <div className="panel rounded-3xl p-4 sm:p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="step-tag">Détail des Manches</div>
            <span className="text-xs font-display uppercase tracking-wider text-slate-400">
              {sortedSets.length} {sortedSets.length <= 1 ? 'Manche' : 'Manches'}
            </span>
          </div>

          <div className="space-y-2.5">
            {sortedSets.map((matchSet: DetailedMatchSet, setIndex: number) => (
              <div
                key={matchSet.id}
                className="history-row px-3 py-2.5 sm:px-3.5 flex items-center justify-between gap-2 sm:gap-3"
              >
                <span className="number-pill w-20 sm:w-24 shrink-0 text-[11px] sm:text-xs px-1.5">
                  Manche {setIndex + 1}
                </span>

                <div className="flex items-center gap-2 sm:gap-3">
                  <span
                    className={`score-value text-xl sm:text-2xl font-black ${
                      matchSet.winner_team === 'A' ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {matchSet.team_a_goals}
                  </span>
                  <span className="font-display text-slate-600">-</span>
                  <span
                    className={`score-value text-xl sm:text-2xl font-black ${
                      matchSet.winner_team === 'B' ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {matchSet.team_b_goals}
                  </span>
                </div>

                <div className="w-20 sm:w-24 text-right shrink-0">
                  {matchSet.is_fanny ? (
                    <span className="badge bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] sm:text-xs px-1.5 sm:px-2.5">
                      🏳️ FANNY
                    </span>
                  ) : (
                    <span className="text-[11px] sm:text-xs font-display uppercase text-slate-500">
                      Équipe {matchSet.winner_team}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ELO Variations Panel */}
        {eloHistoryList.length > 0 && (
          <div className="panel rounded-3xl p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="step-tag">Variation ELO</div>
              <span className="text-xs font-display uppercase tracking-wider text-slate-400">
                Points Classés
              </span>
            </div>

            <div className="space-y-2">
              {eloHistoryList.map((historyItem: MatchEloHistoryRecord) => (
                <div
                  key={historyItem.id}
                  className="history-row flex items-center justify-between gap-2"
                >
                  <Link
                    href={`/profile/${historyItem.player_id}`}
                    className="font-display font-bold text-xs sm:text-base text-white hover:text-emerald-400 transition-colors truncate min-w-0"
                  >
                    {historyItem.players?.display_name}
                  </Link>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-display score-value shrink-0">
                    <span className="text-slate-500">{historyItem.elo_before}</span>
                    <span className="text-slate-600">→</span>
                    <span className="font-bold text-slate-200">{historyItem.elo_after}</span>
                    <span
                      className={`font-black w-10 sm:w-12 text-right ${eloDeltaColor(historyItem.delta)}`}
                    >
                      {eloDeltaLabel(historyItem.delta)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Metadata & Dispute Trigger */}
        <div className="panel rounded-2xl px-4 py-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs text-slate-400">
          <span>
            Enregistré par :{' '}
            <strong className="font-display text-white uppercase tracking-wider">
              {matchRecord.created_by_player?.display_name ?? 'Joueur'}
            </strong>
          </span>
          <div className="flex items-center gap-3">
            <DisputeButton matchId={matchRecord.id} />
          </div>
        </div>
      </main>
    </div>
  )
}
