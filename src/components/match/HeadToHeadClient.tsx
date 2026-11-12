'use client'

import { useState } from 'react'
import type { Player } from '@/types'
import { cn } from '@/lib/utils'
import { Swords } from 'lucide-react'

/** Multiplier used to compute win percentages. */
const PERCENTAGE_MULTIPLIER = 100

/** Default fallback percentage when no matches have been played. */
const DEFAULT_ZERO_PERCENT = 0

/** Icon size in pixels for the central swords icon. */
const SWORDS_ICON_SIZE_PX = 22

/** Locale string for French date formatting. */
const FRENCH_DATE_LOCALE = 'fr-FR'

/**
 * Props for the HeadToHeadClient component.
 */
interface HeadToHeadClientProps {
  players: Pick<Player, 'id' | 'display_name' | 'avatar_url'>[]
}

/**
 * Statistical comparison payload returned by the Head-to-Head API endpoint.
 */
interface HeadToHeadStatsPayload {
  playerAWins: number
  playerBWins: number
  total: number
  setsWonA: number
  setsWonB: number
  bestSetDiffA: number
  bestSetDiffB: number
  fannyGivenA: number
  fannyGivenB: number
  recentMatches: {
    date: string
    teamAScore: number
    teamBScore: number
    sets: { a: number; b: number }[]
  }[]
}

/**
 * Descriptor for a head-to-head comparison row.
 */
interface ComparisonStatRow {
  label: string
  valueA: number | string
  valueB: number | string
  numericA: number
  numericB: number
}

/**
 * Renders the interactive Head-to-Head player selector and comparison results.
 *
 * @param {HeadToHeadClientProps} props - Component properties containing the list of players.
 * @returns {JSX.Element} The rendered Head-to-Head client interface.
 */
export function HeadToHeadClient({ players }: HeadToHeadClientProps): JSX.Element {
  const [selectedPlayerAId, setSelectedPlayerAId] = useState<string>('')
  const [selectedPlayerBId, setSelectedPlayerBId] = useState<string>('')
  const [comparisonStats, setComparisonStats] = useState<HeadToHeadStatsPayload | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  /**
   * Fetches Head-to-Head statistics between the two selected players.
   *
   * @returns {Promise<void>}
   */
  async function fetchHeadToHeadStats(): Promise<void> {
    if (!selectedPlayerAId || !selectedPlayerBId || selectedPlayerAId === selectedPlayerBId) {
      setErrorMessage('Sélectionnez deux joueurs différents')
      return
    }
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const response: Response = await fetch(
        `/api/head-to-head?a=${selectedPlayerAId}&b=${selectedPlayerBId}`
      )
      const responsePayload = await response.json()
      if (!response.ok) throw new Error(responsePayload.error ?? 'Erreur lors du chargement')
      setComparisonStats(responsePayload as HeadToHeadStatsPayload)
    } catch (fetchError: unknown) {
      const message: string =
        fetchError instanceof Error ? fetchError.message : 'Erreur inattendue'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  const playerAName: string =
    players.find((playerItem) => playerItem.id === selectedPlayerAId)?.display_name ?? 'Joueur A'
  const playerBName: string =
    players.find((playerItem) => playerItem.id === selectedPlayerBId)?.display_name ?? 'Joueur B'

  const winPercentageA: number =
    comparisonStats && comparisonStats.total > 0
      ? Math.round((comparisonStats.playerAWins / comparisonStats.total) * PERCENTAGE_MULTIPLIER)
      : DEFAULT_ZERO_PERCENT
  const winPercentageB: number =
    comparisonStats && comparisonStats.total > 0
      ? PERCENTAGE_MULTIPLIER - winPercentageA
      : DEFAULT_ZERO_PERCENT

  const comparisonStatRows: ComparisonStatRow[] = comparisonStats
    ? [
        {
          label: 'Manches Gagnées',
          valueA: comparisonStats.setsWonA,
          valueB: comparisonStats.setsWonB,
          numericA: comparisonStats.setsWonA,
          numericB: comparisonStats.setsWonB,
        },
        {
          label: 'Meilleur Écart de Manche',
          valueA: `+${comparisonStats.bestSetDiffA}`,
          valueB: `+${comparisonStats.bestSetDiffB}`,
          numericA: comparisonStats.bestSetDiffA,
          numericB: comparisonStats.bestSetDiffB,
        },
        {
          label: 'Fanny Infligées 🏳️',
          valueA: comparisonStats.fannyGivenA,
          valueB: comparisonStats.fannyGivenB,
          numericA: comparisonStats.fannyGivenA,
          numericB: comparisonStats.fannyGivenB,
        },
      ]
    : []

  return (
    <div className="space-y-5">
      {/* Player Selection Panel */}
      <div className="panel rounded-3xl p-5 sm:p-6 shadow-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-4 items-end">
          <div>
            <label className="text-xs font-display font-bold text-emerald-400 uppercase tracking-wider mb-2 block">
              🟢 Joueur A
            </label>
            <select
              value={selectedPlayerAId}
              onChange={(event) => setSelectedPlayerAId(event.target.value)}
              className="select"
            >
              <option value="">— Sélectionner —</option>
              {players
                .filter((playerItem) => playerItem.id !== selectedPlayerBId)
                .map((playerItem) => (
                  <option key={playerItem.id} value={playerItem.id}>
                    {playerItem.display_name}
                  </option>
                ))}
            </select>
          </div>

          <div className="hidden sm:flex pb-3 items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
              <Swords size={SWORDS_ICON_SIZE_PX} />
            </div>
          </div>

          <div>
            <label className="text-xs font-display font-bold text-rose-400 uppercase tracking-wider mb-2 block">
              🔴 Joueur B
            </label>
            <select
              value={selectedPlayerBId}
              onChange={(event) => setSelectedPlayerBId(event.target.value)}
              className="select"
            >
              <option value="">— Sélectionner —</option>
              {players
                .filter((playerItem) => playerItem.id !== selectedPlayerAId)
                .map((playerItem) => (
                  <option key={playerItem.id} value={playerItem.id}>
                    {playerItem.display_name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchHeadToHeadStats}
          disabled={isLoading || !selectedPlayerAId || !selectedPlayerBId}
          className="btn-primary w-full mt-5"
        >
          {isLoading ? 'Analyse en cours...' : 'Comparer les Joueurs'}
        </button>

        {errorMessage && (
          <p className="text-rose-400 font-display text-xs uppercase tracking-wider mt-3 text-center">
            {errorMessage}
          </p>
        )}
      </div>

      {/* Comparison Results */}
      {comparisonStats && (
        <div className="space-y-5 animate-slide-up">
          {comparisonStats.total === 0 ? (
            <div className="panel rounded-3xl p-8 text-center text-slate-400 shadow-2xl">
              <div className="text-4xl mb-2">🤝</div>
              <p className="font-display uppercase tracking-wider text-sm">
                Ces joueurs ne se sont jamais affrontés en duel.
              </p>
            </div>
          ) : (
            <>
              {/* Win Ratio Progress Panel */}
              <div className="panel rounded-3xl p-6 shadow-2xl">
                <div className="flex justify-between items-center font-display font-bold text-sm sm:text-base uppercase tracking-wider mb-3">
                  <span className="text-emerald-400">{playerAName}</span>
                  <span className="step-tag">
                    {comparisonStats.total} {comparisonStats.total > 1 ? 'Matchs' : 'Match'}
                  </span>
                  <span className="text-rose-400">{playerBName}</span>
                </div>

                <div className="flex rounded-2xl overflow-hidden h-10 bg-[#0a0d12] border border-white/10 p-1 gap-1">
                  {winPercentageA > 0 && (
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-slate-950 font-display text-sm font-black transition-all"
                      style={{ width: `${winPercentageA}%` }}
                    >
                      {comparisonStats.playerAWins}V
                    </div>
                  )}
                  {winPercentageB > 0 && (
                    <div
                      className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-display text-sm font-black transition-all"
                      style={{ width: `${winPercentageB}%` }}
                    >
                      {comparisonStats.playerBWins}V
                    </div>
                  )}
                </div>

                <div className="flex justify-between font-display text-xs font-bold text-slate-400 mt-2 score-value">
                  <span>{winPercentageA}%</span>
                  <span>{winPercentageB}%</span>
                </div>
              </div>

              {/* Detailed Comparison Cards */}
              <div className="panel rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3">
                <div className="step-tag mb-1">Statistiques Comparées</div>
                {comparisonStatRows.map((statRow: ComparisonStatRow) => (
                  <div
                    key={statRow.label}
                    className="score-card px-4 py-3 flex items-center justify-between"
                  >
                    <span
                      className={cn(
                        'score-value text-2xl font-black w-16 text-left',
                        statRow.numericA > statRow.numericB ? 'text-emerald-400' : 'text-slate-400'
                      )}
                    >
                      {statRow.valueA}
                    </span>
                    <span className="font-display text-xs uppercase tracking-wider text-slate-300 text-center">
                      {statRow.label}
                    </span>
                    <span
                      className={cn(
                        'score-value text-2xl font-black w-16 text-right',
                        statRow.numericB > statRow.numericA ? 'text-rose-400' : 'text-slate-400'
                      )}
                    >
                      {statRow.valueB}
                    </span>
                  </div>
                ))}
              </div>

              {/* Recent Direct Matches */}
              {comparisonStats.recentMatches.length > 0 && (
                <div className="panel rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3">
                  <div className="step-tag">Confrontations Récentes</div>
                  <div className="space-y-2">
                    {comparisonStats.recentMatches.map((recentMatch, matchIndex: number) => {
                      const didPlayerAWin: boolean =
                        recentMatch.teamAScore > recentMatch.teamBScore
                      return (
                        <div
                          key={matchIndex}
                          className="history-row flex items-center justify-between gap-2"
                        >
                          <span className="history-time">
                            {new Date(recentMatch.date).toLocaleDateString(FRENCH_DATE_LOCALE)}
                          </span>
                          <div className="score-value font-black text-lg">
                            <span
                              className={didPlayerAWin ? 'text-emerald-400' : 'text-slate-500'}
                            >
                              {recentMatch.teamAScore}
                            </span>
                            <span className="text-slate-600 mx-1.5">:</span>
                            <span
                              className={!didPlayerAWin ? 'text-rose-400' : 'text-slate-500'}
                            >
                              {recentMatch.teamBScore}
                            </span>
                          </div>
                          <div className="font-display text-xs text-slate-400 score-value">
                            {recentMatch.sets
                              .map((setItem) => `${setItem.a}-${setItem.b}`)
                              .join(', ')}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
