'use client'

import { useState } from 'react'
import type { Player } from '@/types'
import { cn } from '@/lib/utils'
import { Swords } from 'lucide-react'

interface Props {
  players: Pick<Player, 'id' | 'display_name' | 'avatar_url'>[]
}

interface H2HStats {
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

export function HeadToHeadClient({ players }: Props) {
  const [playerA, setPlayerA] = useState('')
  const [playerB, setPlayerB] = useState('')
  const [stats, setStats] = useState<H2HStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchH2H() {
    if (!playerA || !playerB || playerA === playerB) {
      setError('Sélectionnez deux joueurs différents')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/head-to-head?a=${playerA}&b=${playerB}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setStats(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const nameA = players.find(p => p.id === playerA)?.display_name ?? 'Joueur A'
  const nameB = players.find(p => p.id === playerB)?.display_name ?? 'Joueur B'

  const winPctA = stats ? Math.round((stats.playerAWins / stats.total) * 100) : 0
  const winPctB = stats ? 100 - winPctA : 0

  return (
    <div className="space-y-6">
      {/* Selection */}
      <div className="card p-6">
        <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-end">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Joueur A</label>
            <select value={playerA} onChange={e => setPlayerA(e.target.value)} className="select">
              <option value="">— Sélectionner —</option>
              {players.filter(p => p.id !== playerB).map(p => (
                <option key={p.id} value={p.id}>{p.display_name}</option>
              ))}
            </select>
          </div>
          <div className="pb-2">
            <Swords className="text-gray-600" size={24} />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Joueur B</label>
            <select value={playerB} onChange={e => setPlayerB(e.target.value)} className="select">
              <option value="">— Sélectionner —</option>
              {players.filter(p => p.id !== playerA).map(p => (
                <option key={p.id} value={p.id}>{p.display_name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={fetchH2H}
          disabled={loading || !playerA || !playerB}
          className="btn-primary w-full mt-4"
        >
          {loading ? 'Chargement...' : 'Comparer'}
        </button>
        {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
      </div>

      {/* Results */}
      {stats && (
        <div className="space-y-4 animate-slide-up">
          {stats.total === 0 ? (
            <div className="card p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">🤝</div>
              Ces joueurs ne se sont jamais affrontés.
            </div>
          ) : (
            <>
              {/* Win ratio bar */}
              <div className="card p-6">
                <div className="flex justify-between text-sm font-semibold mb-3">
                  <span className="text-pitch-400">{nameA}</span>
                  <span className="text-gray-500 text-xs">{stats.total} match{stats.total > 1 ? 's' : ''}</span>
                  <span className="text-red-400">{nameB}</span>
                </div>
                <div className="flex rounded-full overflow-hidden h-8">
                  <div
                    className="bg-pitch-600 flex items-center justify-center text-white text-sm font-bold transition-all"
                    style={{ width: `${winPctA}%` }}
                  >
                    {stats.playerAWins}V
                  </div>
                  <div
                    className="bg-red-700 flex items-center justify-center text-white text-sm font-bold transition-all"
                    style={{ width: `${winPctB}%` }}
                  >
                    {stats.playerBWins}V
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{winPctA}%</span>
                  <span>{winPctB}%</span>
                </div>
              </div>

              {/* Detailed stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Manches gagnées', valueA: stats.setsWonA, valueB: stats.setsWonB },
                  { label: 'Meilleure manche (écart)', valueA: `+${stats.bestSetDiffA}`, valueB: `+${stats.bestSetDiffB}` },
                  { label: 'Fanny données', valueA: stats.fannyGivenA, valueB: stats.fannyGivenB },
                ].map(s => (
                  <div key={s.label} className="card p-4 col-span-3 flex items-center justify-between">
                    <span className={cn('font-display text-2xl', typeof s.valueA === 'number' && s.valueA > (s.valueB as number) ? 'text-pitch-400' : 'text-gray-500')}>
                      {s.valueA}
                    </span>
                    <span className="text-gray-600 text-xs text-center">{s.label}</span>
                    <span className={cn('font-display text-2xl', typeof s.valueB === 'number' && s.valueB > (s.valueA as number) ? 'text-pitch-400' : 'text-gray-500')}>
                      {s.valueB}
                    </span>
                  </div>
                ))}
              </div>

              {/* Recent matches */}
              {stats.recentMatches.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3">Matchs récents</h3>
                  <div className="space-y-2">
                    {stats.recentMatches.map((m, i) => {
                      const aWon = m.teamAScore > m.teamBScore
                      return (
                        <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-[#2a2d3a] last:border-0">
                          <span className="text-gray-600 text-xs">{new Date(m.date).toLocaleDateString('fr-FR')}</span>
                          <div className="font-display text-xl">
                            <span className={aWon ? 'text-pitch-400' : 'text-gray-500'}>{m.teamAScore}</span>
                            <span className="text-gray-700 mx-1">-</span>
                            <span className={!aWon ? 'text-pitch-400' : 'text-gray-500'}>{m.teamBScore}</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {m.sets.map((s, j) => `${s.a}-${s.b}`).join(', ')}
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
