import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { MatchStatus, MatchType, TeamSide } from '@/types'

/** Next.js ISR revalidation interval in seconds. */
export const revalidate = 60

/** Maximum number of recent matches fetched for the history list. */
const MAX_MATCHES_FETCH_LIMIT = 50

/**
 * Nested player relation returned by Supabase for a match participant.
 */
interface MatchParticipantRecord {
  role: string
  players: {
    id: string
    display_name: string
    avatar_url: string | null
  } | null
}

/**
 * Nested team relation returned by Supabase for a match.
 */
interface MatchTeamRecord {
  team: TeamSide
  match_players: MatchParticipantRecord[]
}

/**
 * Match row structure returned by the matches history query.
 */
interface MatchHistoryRecord {
  id: string
  created_at: string
  match_type: MatchType
  team_a_score: number
  team_b_score: number
  status: MatchStatus
  match_teams: MatchTeamRecord[]
}

/**
 * Renders the chronological match history page styled after Cricket Cut-throat Pro's action log.
 *
 * @returns {Promise<JSX.Element>} The rendered match history page.
 */
export default async function MatchesPage(): Promise<JSX.Element> {
  const supabase = createClient()

  const { data: matchRecords } = await supabase
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
    .limit(MAX_MATCHES_FETCH_LIMIT)

  const matchesList: MatchHistoryRecord[] = (matchRecords ?? []) as unknown as MatchHistoryRecord[]

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto p-3 sm:p-6 space-y-6">
        {/* Header Panel */}
        <div className="panel rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="step-tag">Journal des Rencontres</div>
            <h1 className="app-title text-2xl sm:text-3xl text-white mt-1.5">
              Historique des Matchs
            </h1>
          </div>
          <Link href="/matches/new" className="btn-primary text-xs sm:text-sm py-2.5 px-4 self-start sm:self-auto">
            + Nouveau Match
          </Link>
        </div>

        {/* Matches List Panel */}
        <div className="panel rounded-3xl p-4 sm:p-6 shadow-2xl space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-display uppercase tracking-widest text-slate-400">
              Derniers Matchs Enregistrés
            </span>
            <span className="text-xs font-display text-slate-500 uppercase tracking-wider">
              {matchesList.length} affichés
            </span>
          </div>

          {matchesList.map((matchItem: MatchHistoryRecord) => {
            const teamARecord: MatchTeamRecord | undefined = matchItem.match_teams?.find(
              (teamEntry: MatchTeamRecord) => teamEntry.team === 'A'
            )
            const teamBRecord: MatchTeamRecord | undefined = matchItem.match_teams?.find(
              (teamEntry: MatchTeamRecord) => teamEntry.team === 'B'
            )
            const teamAPlayerNames: string[] =
              teamARecord?.match_players
                ?.map((participant: MatchParticipantRecord) => participant.players?.display_name)
                .filter((name): name is string => Boolean(name)) ?? []
            const teamBPlayerNames: string[] =
              teamBRecord?.match_players
                ?.map((participant: MatchParticipantRecord) => participant.players?.display_name)
                .filter((name): name is string => Boolean(name)) ?? []
            const didTeamAWin: boolean = matchItem.team_a_score > matchItem.team_b_score

            return (
              <Link
                key={matchItem.id}
                href={`/matches/${matchItem.id}`}
                className="ranking-row flex items-center justify-between gap-4 group block"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`badge ${
                        matchItem.match_type === '2v2'
                          ? 'bg-teal-500/10 text-teal-300 border border-teal-500/25'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
                      }`}
                    >
                      {matchItem.match_type}
                    </span>
                    <span className="history-time">{formatDate(matchItem.created_at)}</span>
                    {matchItem.status === 'disputed' && (
                      <span className="badge bg-rose-500/10 text-rose-300 border border-rose-500/25">
                        ⚠️ Litige
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3">
                    <span
                      className={`font-display font-bold text-sm sm:text-base truncate text-right ${
                        didTeamAWin ? 'text-white' : 'text-slate-500'
                      }`}
                    >
                      {teamAPlayerNames.join(' & ')}
                    </span>

                    <div className="number-pill px-3 py-1 flex items-center gap-2 shrink-0">
                      <span
                        className={`score-value text-lg sm:text-xl font-black ${
                          didTeamAWin ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {matchItem.team_a_score}
                      </span>
                      <span className="text-slate-600">:</span>
                      <span
                        className={`score-value text-lg sm:text-xl font-black ${
                          !didTeamAWin ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {matchItem.team_b_score}
                      </span>
                    </div>

                    <span
                      className={`font-display font-bold text-sm sm:text-base truncate text-left ${
                        !didTeamAWin ? 'text-white' : 'text-slate-500'
                      }`}
                    >
                      {teamBPlayerNames.join(' & ')}
                    </span>
                  </div>
                </div>

                <span className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all font-display text-lg">
                  ›
                </span>
              </Link>
            )
          })}

          {matchesList.length === 0 && (
            <div className="text-center py-14 text-slate-400">
              <div className="text-4xl mb-3">⚽</div>
              <p className="font-display uppercase tracking-wider text-sm">
                Aucun match enregistré pour le moment.
              </p>
              <Link href="/matches/new" className="btn-primary inline-flex mt-5 text-sm">
                + Enregistrer un Match
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
