import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { formatDate, eloDeltaColor, eloDeltaLabel } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { Player, PlayerStats } from '@/types'

/** Default initial ELO rating when no player_stats row exists yet. */
const DEFAULT_INITIAL_ELO = 1000

/** Maximum number of recent ELO history entries fetched for the profile view. */
const RECENT_HISTORY_LIMIT = 10

/** Multiplier for converting ratios to percentages. */
const PERCENTAGE_MULTIPLIER = 100

/** Fallback zero value for uninitialized numerical statistics. */
const DEFAULT_ZERO_STAT = 0

/** Profile header avatar dimension in pixels. */
const PROFILE_AVATAR_SIZE_PX = 76

/** Icon size in pixels for streak indicator arrows. */
const STREAK_ICON_SIZE_PX = 16

/**
 * Route parameters for the PlayerProfilePage component.
 */
interface PlayerProfilePageProps {
  params: {
    id: string
  }
}

/**
 * ELO history entry joined with basic match metadata.
 */
interface ProfileEloHistoryItem {
  id: string
  created_at: string
  elo_before: number
  elo_after: number
  delta: number
  matches: {
    created_at: string
    team_a_score: number
    team_b_score: number
    match_type: string
  } | null
}

/**
 * Summary stat card item displayed on the player profile.
 */
interface ProfileStatCardItem {
  label: string
  value: number | string
  colorClass: string
}

/**
 * Renders an individual player's profile page with ELO rating, stats, Fanny counters, and history.
 *
 * @param {PlayerProfilePageProps} props - Route parameters containing the player ID.
 * @returns {Promise<JSX.Element>} The rendered player profile page.
 */
export default async function PlayerProfilePage({
  params,
}: PlayerProfilePageProps): Promise<JSX.Element> {
  const supabase = createClient()

  const { data: rawPlayer } = await supabase
    .from('players')
    .select('*')
    .eq('id', params.id)
    .single()
  if (!rawPlayer) notFound()
  const player = rawPlayer as Player

  const { data: rawStats } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', params.id)
    .single()
  const playerStats = (rawStats as PlayerStats | null) ?? null

  const { data: rawRecentHistory } = await supabase
    .from('elo_history')
    .select('*, matches(created_at, team_a_score, team_b_score, match_type)')
    .eq('player_id', params.id)
    .order('created_at', { ascending: false })
    .limit(RECENT_HISTORY_LIMIT)

  const recentHistoryList: ProfileEloHistoryItem[] =
    (rawRecentHistory ?? []) as unknown as ProfileEloHistoryItem[]

  const winRatePercent: number = playerStats?.match_count
    ? Math.round((playerStats.wins / playerStats.match_count) * PERCENTAGE_MULTIPLIER)
    : DEFAULT_ZERO_STAT

  const goalAverage: number =
    (playerStats?.goals_for ?? DEFAULT_ZERO_STAT) -
    (playerStats?.goals_against ?? DEFAULT_ZERO_STAT)

  const currentStreak: number = playerStats?.current_streak ?? DEFAULT_ZERO_STAT
  const fannyGivenCount: number = playerStats?.fanny_given ?? DEFAULT_ZERO_STAT
  const fannyTakenCount: number = playerStats?.fanny_taken ?? DEFAULT_ZERO_STAT

  const summaryStatCards: ProfileStatCardItem[] = [
    {
      label: 'Victoires',
      value: playerStats?.wins ?? DEFAULT_ZERO_STAT,
      colorClass: 'text-emerald-400',
    },
    {
      label: 'Défaites',
      value: playerStats?.losses ?? DEFAULT_ZERO_STAT,
      colorClass: 'text-rose-400',
    },
    {
      label: 'Win Rate',
      value: `${winRatePercent}%`,
      colorClass: 'text-teal-300',
    },
    {
      label: 'Goal Average',
      value: goalAverage > DEFAULT_ZERO_STAT ? `+${goalAverage}` : goalAverage,
      colorClass: goalAverage >= DEFAULT_ZERO_STAT ? 'text-emerald-400' : 'text-rose-400',
    },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto p-3 sm:p-6 space-y-5">
        {/* Profile Header Panel */}
        <div className="panel rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {player.avatar_url ? (
              <Image
                src={player.avatar_url}
                alt={player.display_name}
                width={PROFILE_AVATAR_SIZE_PX}
                height={PROFILE_AVATAR_SIZE_PX}
                className="rounded-2xl border-2 border-emerald-500/40"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/35 flex items-center justify-center font-display font-black text-4xl text-emerald-400">
                {player.display_name[0]}
              </div>
            )}

            <div>
              <div className="step-tag mb-1.5">Profil Joueur</div>
              <div className="flex items-center gap-2">
                <h1 className="app-title text-2xl sm:text-3xl text-white">
                  {player.display_name}
                </h1>
                {playerStats?.last_3_wins && (
                  <span className="text-2xl animate-flame" title="En série de victoires">
                    🔥
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="score-value font-black text-4xl sm:text-5xl text-amber-300">
                  {playerStats?.elo ?? DEFAULT_INITIAL_ELO}
                </span>
                <span className="font-display text-xs uppercase tracking-widest text-emerald-400 font-bold">
                  ELO Rating
                </span>
              </div>
            </div>
          </div>

          <div className="score-card px-5 py-3.5 text-left sm:text-right self-start sm:self-center">
            <div className="text-[11px] font-display uppercase tracking-widest text-slate-400 mb-1">
              Série Actuelle
            </div>
            {currentStreak > DEFAULT_ZERO_STAT ? (
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 px-3 py-1 rounded-xl border border-emerald-500/25 font-display font-bold">
                <TrendingUp size={STREAK_ICON_SIZE_PX} />
                <span>{currentStreak}W</span>
              </div>
            ) : currentStreak < DEFAULT_ZERO_STAT ? (
              <div className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-300 px-3 py-1 rounded-xl border border-rose-500/25 font-display font-bold">
                <TrendingDown size={STREAK_ICON_SIZE_PX} />
                <span>{Math.abs(currentStreak)}L</span>
              </div>
            ) : (
              <span className="font-display font-bold text-slate-500">—</span>
            )}
          </div>
        </div>

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryStatCards.map((statCard: ProfileStatCardItem) => (
            <div key={statCard.label} className="score-card text-center py-4 px-3">
              <div className="text-[11px] font-display uppercase tracking-widest text-slate-400">
                {statCard.label}
              </div>
              <div className={`mt-1.5 score-value text-3xl font-black ${statCard.colorClass}`}>
                {statCard.value}
              </div>
            </div>
          ))}
        </div>

        {/* Fanny Statistics Panel */}
        {(fannyGivenCount > DEFAULT_ZERO_STAT || fannyTakenCount > DEFAULT_ZERO_STAT) && (
          <div className="panel rounded-3xl p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="step-tag">Bilan des Fanny (10-0)</div>
              <span className="text-lg">🏳️</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <div className="font-display font-bold text-amber-300 text-xs uppercase tracking-wider">
                    🎯 Fanny Infligées
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Victoires 10 à 0</div>
                </div>
                <div className="score-value font-black text-3xl text-amber-300">
                  {fannyGivenCount}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between">
                <div>
                  <div className="font-display font-bold text-rose-300 text-xs uppercase tracking-wider">
                    🤡 Fanny Subies
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Défaites 0 à 10</div>
                </div>
                <div className="score-value font-black text-3xl text-rose-400">
                  {fannyTakenCount}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent ELO History Panel */}
        {recentHistoryList.length > DEFAULT_ZERO_STAT && (
          <div className="panel rounded-3xl p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="step-tag">Historique ELO Récent</div>
              <span className="text-xs font-display uppercase tracking-wider text-slate-400">
                {recentHistoryList.length} derniers matchs
              </span>
            </div>

            <div className="space-y-2">
              {recentHistoryList.map((historyEntry: ProfileEloHistoryItem) => (
                <div
                  key={historyEntry.id}
                  className="history-row flex items-center justify-between gap-2"
                >
                  <div className="history-time">
                    {formatDate(historyEntry.matches?.created_at ?? historyEntry.created_at)}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-display score-value">
                    <span className="text-slate-500">{historyEntry.elo_before}</span>
                    <span className="text-slate-600">→</span>
                    <span className="font-bold text-slate-200">{historyEntry.elo_after}</span>
                    <span
                      className={`font-black w-12 text-right ${eloDeltaColor(
                        historyEntry.delta
                      )}`}
                    >
                      {eloDeltaLabel(historyEntry.delta)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
