import { createClient } from '@/lib/supabase/server'
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { LeaderboardEntry } from '@/types'
import { Navbar } from '@/components/layout/Navbar'

/** Next.js ISR revalidation interval in seconds. */
export const revalidate = 60

/** Minimum number of players required to display the top-3 podium. */
const MIN_PODIUM_PLAYERS = 3

/** Index of the first-place player in the sorted leaderboard array. */
const FIRST_PLACE_INDEX = 0

/** Index of the second-place player in the sorted leaderboard array. */
const SECOND_PLACE_INDEX = 1

/** Index of the third-place player in the sorted leaderboard array. */
const THIRD_PLACE_INDEX = 2

/** Avatar size in pixels for podium cards. */
const PODIUM_AVATAR_SIZE_PX = 40

/** Avatar size in pixels for leaderboard table rows. */
const TABLE_AVATAR_SIZE_PX = 30

/** Icon size in pixels for streak arrows. */
const STREAK_ICON_SIZE_PX = 14

/** Neutral threshold for goal average and streak comparisons. */
const ZERO_THRESHOLD = 0

/** Table column headers for the leaderboard. */
const LEADERBOARD_TABLE_HEADERS: readonly string[] = [
  '#',
  'Joueur',
  'ELO',
  'Bilan V/D',
  'Win%',
  'Goal Avg',
  'Fanny (🎯 / 🤡)',
  'Série',
]

/**
 * Configuration for each podium slot (2nd, 1st, 3rd).
 */
interface PodiumSlotConfig {
  player: LeaderboardEntry
  medal: string
  heightClass: string
  cardStyleClass: string
  scoreColorClass: string
}

/**
 * Renders the ELO Leaderboard page with responsive podium and scrollable ranking table.
 *
 * @returns {Promise<JSX.Element>} The rendered leaderboard page.
 */
export default async function LeaderboardPage(): Promise<JSX.Element> {
  const supabase = createClient()

  const { data: leaderboardRecords } = await supabase
    .from('leaderboard')
    .select('*')
    .order('elo', { ascending: false })

  const rankedPlayers: LeaderboardEntry[] = (leaderboardRecords ?? []) as LeaderboardEntry[]

  const podiumSlots: PodiumSlotConfig[] =
    rankedPlayers.length >= MIN_PODIUM_PLAYERS
      ? [
          {
            player: rankedPlayers[SECOND_PLACE_INDEX],
            medal: '🥈',
            heightClass: 'min-h-[135px] sm:min-h-[155px]',
            cardStyleClass: 'bg-white/[0.04] border-white/15',
            scoreColorClass: 'text-slate-200',
          },
          {
            player: rankedPlayers[FIRST_PLACE_INDEX],
            medal: '🥇',
            heightClass: 'min-h-[155px] sm:min-h-[185px]',
            cardStyleClass: 'bg-amber-500/10 border-amber-500/35 shadow-lg shadow-amber-500/10',
            scoreColorClass: 'text-amber-300',
          },
          {
            player: rankedPlayers[THIRD_PLACE_INDEX],
            medal: '🥉',
            heightClass: 'min-h-[125px] sm:min-h-[145px]',
            cardStyleClass: 'bg-amber-700/10 border-amber-700/30',
            scoreColorClass: 'text-amber-400',
          },
        ]
      : []

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header Panel */}
        <div className="panel rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-300 shrink-0">
              <Trophy size={22} />
            </div>
            <div className="min-w-0">
              <div className="step-tag">Classement Officiel</div>
              <h1 className="app-title text-xl sm:text-3xl text-white mt-1 truncate">
                Classement ELO
              </h1>
            </div>
          </div>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 text-xs font-display font-bold uppercase tracking-widest text-emerald-400 self-start sm:self-auto shrink-0">
            {rankedPlayers.length} {rankedPlayers.length <= 1 ? 'Joueur Actif' : 'Joueurs Actifs'}
          </div>
        </div>

        {/* Podium Top 3 */}
        {podiumSlots.length === MIN_PODIUM_PLAYERS && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end">
            {podiumSlots.map((slot: PodiumSlotConfig) => (
              <Link
                key={slot.player.id}
                href={`/profile/${slot.player.id}`}
                className={`panel rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 text-center flex flex-col items-center justify-between min-w-0 border transition-all hover:scale-[1.01] hover:border-emerald-500/40 ${slot.heightClass} ${slot.cardStyleClass}`}
              >
                <div className="text-xl sm:text-3xl leading-none">{slot.medal}</div>
                <div className="my-1.5 sm:my-2 flex flex-col items-center w-full min-w-0">
                  {slot.player.avatar_url ? (
                    <Image
                      src={slot.player.avatar_url}
                      alt={slot.player.display_name}
                      width={PODIUM_AVATAR_SIZE_PX}
                      height={PODIUM_AVATAR_SIZE_PX}
                      className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border border-white/15 mb-1.5"
                    />
                  ) : (
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center font-display font-bold text-sm sm:text-lg text-white mb-1.5">
                      {slot.player.display_name[0]}
                    </div>
                  )}
                  <div className="player-initials text-[11px] sm:text-sm w-full truncate px-0.5">
                    {slot.player.display_name}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1 flex-wrap">
                  <span className={`font-display font-black text-base sm:text-2xl score-value ${slot.scoreColorClass}`}>
                    {slot.player.elo}
                  </span>
                  <span className="hidden sm:inline text-[10px] font-display uppercase text-slate-400">
                    pts
                  </span>
                  {slot.player.last_3_wins && <span className="text-xs sm:text-base animate-flame">🔥</span>}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Full Leaderboard Table Panel */}
        <div className="panel rounded-3xl p-3.5 sm:p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="text-xs font-display uppercase tracking-widest text-slate-400">
              Classement Général
            </div>
            <div className="text-xs font-display text-emerald-400 uppercase tracking-wider">
              Temps Réel
            </div>
          </div>

          <div className="board-scroll-container">
            <table className="w-full min-w-[600px] border-separate border-spacing-y-2">
              <thead>
                <tr>
                  {LEADERBOARD_TABLE_HEADERS.map((headerLabel: string) => (
                    <th
                      key={headerLabel}
                      className="px-3 py-2 text-left text-[11px] font-display text-slate-400 uppercase tracking-widest font-bold whitespace-nowrap"
                    >
                      {headerLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rankedPlayers.map((playerEntry: LeaderboardEntry, rowIndex: number) => {
                  const rankMedal: string =
                    rowIndex === FIRST_PLACE_INDEX
                      ? '🥇'
                      : rowIndex === SECOND_PLACE_INDEX
                        ? '🥈'
                        : rowIndex === THIRD_PLACE_INDEX
                          ? '🥉'
                          : `${rowIndex + 1}.`

                  return (
                    <tr
                      key={playerEntry.id}
                      className="bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                    >
                      <td className="px-3 py-3 rounded-l-2xl border-y border-l border-white/[0.07] font-display font-bold text-amber-400 text-sm whitespace-nowrap">
                        {rankMedal}
                      </td>
                      <td className="px-3 py-3 border-y border-white/[0.07] whitespace-nowrap">
                        <Link
                          href={`/profile/${playerEntry.id}`}
                          className="flex items-center gap-2.5 hover:text-emerald-400 transition-colors"
                        >
                          {playerEntry.avatar_url ? (
                            <Image
                              src={playerEntry.avatar_url}
                              alt={playerEntry.display_name}
                              width={TABLE_AVATAR_SIZE_PX}
                              height={TABLE_AVATAR_SIZE_PX}
                              className="rounded-xl border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center font-display text-xs font-bold text-white shrink-0">
                              {playerEntry.display_name[0]}
                            </div>
                          )}
                          <span className="font-display font-bold text-white tracking-wide text-sm sm:text-base">
                            {playerEntry.display_name}
                          </span>
                          {playerEntry.last_3_wins && (
                            <span className="animate-flame text-base" title="3 victoires consécutives">
                              🔥
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="px-3 py-3 border-y border-white/[0.07] whitespace-nowrap">
                        <span className="font-display font-black text-emerald-400 text-lg score-value">
                          {playerEntry.elo}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-y border-white/[0.07] whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 font-display text-xs font-bold">
                          <span className="bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {playerEntry.wins}V
                          </span>
                          <span className="bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded-md border border-rose-500/20">
                            {playerEntry.losses}D
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 border-y border-white/[0.07] font-display font-bold text-sm text-slate-300 score-value whitespace-nowrap">
                        {playerEntry.win_rate}%
                      </td>
                      <td className="px-3 py-3 border-y border-white/[0.07] font-display font-bold text-sm score-value whitespace-nowrap">
                        <span
                          className={
                            playerEntry.goal_average >= ZERO_THRESHOLD
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }
                        >
                          {playerEntry.goal_average > ZERO_THRESHOLD ? '+' : ''}
                          {playerEntry.goal_average}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-y border-white/[0.07] whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 font-display text-xs">
                          <span
                            className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/20"
                            title="Fanny données"
                          >
                            🎯 {playerEntry.fanny_given}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded-md border border-rose-500/20"
                            title="Fanny subies"
                          >
                            🤡 {playerEntry.fanny_taken}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 rounded-r-2xl border-y border-r border-white/[0.07] font-display text-xs font-bold whitespace-nowrap">
                        {playerEntry.current_streak > ZERO_THRESHOLD ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            <TrendingUp size={STREAK_ICON_SIZE_PX} />
                            {playerEntry.current_streak}
                          </span>
                        ) : playerEntry.current_streak < ZERO_THRESHOLD ? (
                          <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded-md border border-rose-500/20">
                            <TrendingDown size={STREAK_ICON_SIZE_PX} />
                            {Math.abs(playerEntry.current_streak)}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {rankedPlayers.length === 0 && (
            <div className="text-center py-14 text-slate-400">
              <div className="text-4xl mb-3">🏆</div>
              <p className="font-display uppercase tracking-wider text-sm">
                Aucun joueur classé pour le moment.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
