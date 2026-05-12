'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, Minus, ChevronDown } from 'lucide-react'
import type { Player, MatchType, PlayerRole, SetInput } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  currentPlayer: Player | null
  allPlayers: Pick<Player, 'id' | 'display_name' | 'avatar_url' | 'email'>[]
  mode?: 'create' | 'edit'
  matchId?: string
  initialData?: {
    match_type: MatchType
    sets: { team_a_goals: number; team_b_goals: number }[]
    team_a: TeamPlayer[]
    team_b: TeamPlayer[]
  }
}

interface TeamPlayer {
  player_id: string
  role: PlayerRole
}

export function NewMatchForm({ currentPlayer, allPlayers, mode = 'create', matchId, initialData }: Props) {
  const router = useRouter()
  const initialMatchType = initialData?.match_type ?? '1v1'
  const [matchType, setMatchType] = useState<MatchType>(initialMatchType)
  const [sets, setSets] = useState<SetInput[]>(
    initialData?.sets?.length
      ? initialData.sets
      : [{ team_a_goals: '', team_b_goals: '' }]
  )
  const [teamA, setTeamA] = useState<TeamPlayer[]>(
    initialData?.team_a?.length
      ? initialData.team_a
      : initialMatchType === '2v2'
        ? [
            { player_id: currentPlayer?.id ?? '', role: 'attacker' },
            { player_id: '', role: 'defender' },
          ]
        : [{ player_id: currentPlayer?.id ?? '', role: 'solo' }]
  )
  const [teamB, setTeamB] = useState<TeamPlayer[]>(
    initialData?.team_b?.length
      ? initialData.team_b
      : initialMatchType === '2v2'
        ? [
            { player_id: '', role: 'attacker' },
            { player_id: '', role: 'defender' },
          ]
        : [{ player_id: '', role: 'solo' }]
  )
  const [loading, setLoading] = useState(false)

  // Switch match type
  function switchMatchType(type: MatchType) {
    setMatchType(type)
    if (type === '1v1') {
      setTeamA([{ player_id: mode === 'create' ? currentPlayer?.id ?? '' : '', role: 'solo' }])
      setTeamB([{ player_id: '', role: 'solo' }])
    } else {
      setTeamA([
        { player_id: mode === 'create' ? currentPlayer?.id ?? '' : '', role: 'attacker' },
        { player_id: '', role: 'defender' },
      ])
      setTeamB([
        { player_id: '', role: 'attacker' },
        { player_id: '', role: 'defender' },
      ])
    }
  }

  function addSet() {
    setSets(s => [...s, { team_a_goals: '', team_b_goals: '' }])
  }

  function removeSet(i: number) {
    if (sets.length === 1) return
    setSets(s => s.filter((_, idx) => idx !== i))
  }

  function updateSet(i: number, field: 'team_a_goals' | 'team_b_goals', value: string) {
    const num = value === '' ? '' : Math.min(10, Math.max(0, parseInt(value) || 0))
    setSets(s => s.map((set, idx) => idx === i ? { ...set, [field]: num } : set))
  }

  function updateTeamPlayer(team: 'A' | 'B', index: number, field: keyof TeamPlayer, value: string) {
    if (team === 'A') {
      setTeamA(t => t.map((p, i) => i === index ? { ...p, [field]: value } : p))
    } else {
      setTeamB(t => t.map((p, i) => i === index ? { ...p, [field]: value } : p))
    }
  }

  // Compute score preview
  const scorePreview = sets.reduce(
    (acc, s) => {
      if (s.team_a_goals === '' || s.team_b_goals === '') return acc
      if (s.team_a_goals > s.team_b_goals) acc.a++
      else if (s.team_b_goals > s.team_a_goals) acc.b++
      return acc
    },
    { a: 0, b: 0 }
  )

  function validate(): string | null {
    // Check players selected
    const allSelected = [...teamA, ...teamB].every(p => p.player_id)
    if (!allSelected) return 'Veuillez sélectionner tous les joueurs'

    // Check no duplicate players
    const ids = [...teamA, ...teamB].map(p => p.player_id)
    if (new Set(ids).size !== ids.length) return 'Un joueur ne peut pas être dans les deux équipes'

    // Check sets
    for (const set of sets) {
      if (set.team_a_goals === '' || set.team_b_goals === '') return 'Remplissez tous les scores de manches'
      if (set.team_a_goals === set.team_b_goals) return 'Un match nul par manche n\'est pas possible'
      if (set.team_a_goals !== 10 && set.team_b_goals !== 10) return 'Au moins une équipe doit marquer 10 buts par manche'
    }

    return null
  }

  async function handleSubmit() {
    const err = validate()
    if (err) { toast.error(err); return }

    setLoading(true)
    try {
      const payload = {
        match_type: matchType,
        sets: sets as { team_a_goals: number; team_b_goals: number }[],
        team_a: teamA,
        team_b: teamB,
      }

      const endpoint = mode === 'edit' && matchId
        ? `/api/matches/${matchId}`
        : '/api/matches'

      const res = await fetch(endpoint, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur serveur')

      toast.success(mode === 'edit' ? 'Match mis à jour ! ✅' : 'Match enregistré ! 🏆')
      const targetId = mode === 'edit' && matchId ? matchId : json.matchId
      router.push(`/matches/${targetId}`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const otherPlayers = allPlayers.filter(p => p.id !== currentPlayer?.id)

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Match type */}
      <div className="card p-6">
        <h2 className="font-semibold mb-4 text-gray-300">Type de match</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(['1v1', '2v2'] as MatchType[]).map(type => (
            <button
              key={type}
              onClick={() => switchMatchType(type)}
              className={cn(
                'py-3 rounded-xl font-display text-2xl tracking-wider transition-all border',
                matchType === type
                  ? 'bg-pitch-700/30 border-pitch-600 text-pitch-400 glow-green'
                  : 'border-[#2a2d3a] text-gray-500 hover:border-[#3a3d4a]'
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(['A', 'B'] as const).map(team => {
          const players = team === 'A' ? teamA : teamB
          return (
            <div key={team} className={cn(
              'card p-5',
              team === 'A' ? 'border-pitch-800/50' : 'border-red-900/30'
            )}>
              <h3 className="font-display text-xl mb-4" style={{ color: team === 'A' ? '#4ade80' : '#f87171' }}>
                ÉQUIPE {team}
              </h3>
              <div className="space-y-3">
                {players.map((p, i) => (
                  <div key={i} className="space-y-2">
                    <select
                      value={p.player_id}
                      onChange={e => updateTeamPlayer(team, i, 'player_id', e.target.value)}
                      className="select text-sm"
                      disabled={mode === 'create' && team === 'A' && i === 0 && !!currentPlayer}
                    >
                      <option value="">— Joueur —</option>
                      {/* Current player always first in team A slot 0 */}
                      {team === 'A' && i === 0 && currentPlayer && (
                        <option value={currentPlayer.id}>{currentPlayer.display_name} (vous)</option>
                      )}
                      {(() => {
                        const selectedIds = [...teamA, ...teamB]
                          .map(tp => tp.player_id)
                          .filter(Boolean)
                        const usedIds = selectedIds.filter(id => id !== p.player_id)
                        return allPlayers
                          .filter(ap => {
                            if (team === 'A' && i === 0 && currentPlayer) return false
                            return !usedIds.includes(ap.id)
                          })
                          .map(ap => (
                            <option key={ap.id} value={ap.id}>{ap.display_name}</option>
                          ))
                      })()}
                    </select>
                    {matchType === '2v2' && (
                      <select
                        value={p.role}
                        onChange={e => updateTeamPlayer(team, i, 'role', e.target.value)}
                        className="select text-xs"
                      >
                        <option value="attacker">⚔️ Attaquant</option>
                        <option value="defender">🛡️ Défenseur</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Sets */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-300">Manches <span className="text-gray-600 text-xs sm:text-sm font-normal">(max 10 buts)</span></h2>
          <button onClick={addSet} className="btn-ghost flex items-center gap-1 text-sm text-pitch-400">
            <Plus size={16} /> Ajouter
          </button>
        </div>

        <div className="space-y-3">
          {sets.map((set, i) => {
            const aGoals = set.team_a_goals === '' ? null : Number(set.team_a_goals)
            const bGoals = set.team_b_goals === '' ? null : Number(set.team_b_goals)
            const aWins = aGoals !== null && bGoals !== null && aGoals > bGoals
            const bWins = aGoals !== null && bGoals !== null && bGoals > aGoals
            const isFanny = (aGoals === 10 && bGoals === 0) || (aGoals === 0 && bGoals === 10)

            return (
              <div key={i} className="flex flex-wrap items-center gap-3">
                <span className="text-gray-600 text-xs sm:text-sm w-16 sm:w-20 shrink-0">Manche {i + 1}</span>
                <input
                  type="number" min="0" max="10"
                  value={set.team_a_goals}
                  onChange={e => updateSet(i, 'team_a_goals', e.target.value)}
                  className={cn('input text-center w-14 sm:w-16', aWins && 'border-pitch-600 text-pitch-400')}
                  placeholder="0"
                />
                <span className="text-gray-600 font-display text-xl">-</span>
                <input
                  type="number" min="0" max="10"
                  value={set.team_b_goals}
                  onChange={e => updateSet(i, 'team_b_goals', e.target.value)}
                  className={cn('input text-center w-14 sm:w-16', bWins && 'border-red-600 text-red-400')}
                  placeholder="0"
                />
                {isFanny && <span title="FANNY!" className="text-xl">🏳️</span>}
                {sets.length > 1 && (
                  <button onClick={() => removeSet(i)} className="btn-ghost p-1 text-gray-600 hover:text-red-400">
                    <Minus size={16} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Score preview */}
        {(scorePreview.a > 0 || scorePreview.b > 0) && (
          <div className="mt-4 pt-4 border-t border-[#2a2d3a] text-center">
            <span className="text-gray-500 text-sm">Score final : </span>
            <span className="font-display text-2xl sm:text-3xl">
              <span className="text-pitch-400">{scorePreview.a}</span>
              <span className="text-gray-600 mx-2">-</span>
              <span className="text-red-400">{scorePreview.b}</span>
            </span>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="btn-primary w-full py-4 text-base sm:text-lg font-display tracking-wider"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Enregistrement...
          </span>
        ) : '⚽ ENREGISTRER LE MATCH'}
      </button>
    </div>
  )
}
