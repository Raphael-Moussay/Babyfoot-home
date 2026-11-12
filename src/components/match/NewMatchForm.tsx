'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import type { Player, MatchType, PlayerRole, SetInput } from '@/types'
import { cn } from '@/lib/utils'

/** Maximum number of goals allowed in a single set. */
const MAX_GOALS_PER_SET = 10

/** Minimum number of goals allowed in a single set. */
const MIN_GOALS_PER_SET = 0

/** Minimum number of sets required in a match. */
const MIN_SETS_COUNT = 1

/** Index of the primary player slot in Team A. */
const PRIMARY_SLOT_INDEX = 0

/**Supported match types in the selector. */
const AVAILABLE_MATCH_TYPES: readonly MatchType[] = ['1v1', '2v2']

/** Supported team identifiers. */
const TEAM_IDENTIFIERS = ['A', 'B'] as const

/** Icon size in pixels for the add set button. */
const ADD_ICON_SIZE_PX = 15

/**
 * Represents a player slot within a team in the match form.
 */
interface TeamPlayerSlot {
  player_id: string
  role: PlayerRole
}

/**
 * Props for the NewMatchForm component.
 */
interface NewMatchFormProps {
  currentPlayer: Player | null
  allPlayers: Pick<Player, 'id' | 'display_name' | 'avatar_url' | 'email'>[]
  mode?: 'create' | 'edit'
  matchId?: string
  initialData?: {
    match_type: MatchType
    sets: { team_a_goals: number; team_b_goals: number }[]
    team_a: TeamPlayerSlot[]
    team_b: TeamPlayerSlot[]
  }
}

/**
 * Score preview accumulator tracking sets won by Team A and Team B.
 */
interface MatchScorePreview {
  teamAWins: number
  teamBWins: number
}

/**
 * Renders the interactive form for creating or editing a match, styled after Cricket Cut-throat Pro.
 *
 * @param {NewMatchFormProps} props - Component properties including player lists and optional edit state.
 * @returns {JSX.Element} The rendered match creation/edition form.
 */
export function NewMatchForm({
  currentPlayer,
  allPlayers,
  mode = 'create',
  matchId,
  initialData,
}: NewMatchFormProps): JSX.Element {
  const router = useRouter()
  const initialMatchType: MatchType = initialData?.match_type ?? '1v1'
  const [matchType, setMatchType] = useState<MatchType>(initialMatchType)
  const [sets, setSets] = useState<SetInput[]>(
    initialData?.sets?.length
      ? initialData.sets
      : [{ team_a_goals: '', team_b_goals: '' }]
  )
  const [teamAPlayers, setTeamAPlayers] = useState<TeamPlayerSlot[]>(
    initialData?.team_a?.length
      ? initialData.team_a
      : initialMatchType === '2v2'
        ? [
            { player_id: currentPlayer?.id ?? '', role: 'attacker' },
            { player_id: '', role: 'defender' },
          ]
        : [{ player_id: currentPlayer?.id ?? '', role: 'solo' }]
  )
  const [teamBPlayers, setTeamBPlayers] = useState<TeamPlayerSlot[]>(
    initialData?.team_b?.length
      ? initialData.team_b
      : initialMatchType === '2v2'
        ? [
            { player_id: '', role: 'attacker' },
            { player_id: '', role: 'defender' },
          ]
        : [{ player_id: '', role: 'solo' }]
  )
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  /**
   * Switches between 1v1 and 2v2 match formats and resets team slots accordingly.
   *
   * @param {MatchType} nextMatchType - The selected match format.
   * @returns {void}
   */
  function switchMatchType(nextMatchType: MatchType): void {
    setMatchType(nextMatchType)
    const defaultFirstPlayerId: string = mode === 'create' ? currentPlayer?.id ?? '' : ''
    if (nextMatchType === '1v1') {
      setTeamAPlayers([{ player_id: defaultFirstPlayerId, role: 'solo' }])
      setTeamBPlayers([{ player_id: '', role: 'solo' }])
    } else {
      setTeamAPlayers([
        { player_id: defaultFirstPlayerId, role: 'attacker' },
        { player_id: '', role: 'defender' },
      ])
      setTeamBPlayers([
        { player_id: '', role: 'attacker' },
        { player_id: '', role: 'defender' },
      ])
    }
  }

  /**
   * Appends a new empty set row to the match form.
   *
   * @returns {void}
   */
  function addSetRow(): void {
    setSets((previousSets: SetInput[]) => [
      ...previousSets,
      { team_a_goals: '', team_b_goals: '' },
    ])
  }

  /**
   * Removes a set row by index when more than one set exists.
   *
   * @param {number} targetSetIndex - Index of the set row to remove.
   * @returns {void}
   */
  function removeSetRow(targetSetIndex: number): void {
    if (sets.length <= MIN_SETS_COUNT) return
    setSets((previousSets: SetInput[]) =>
      previousSets.filter((_: SetInput, setIndex: number) => setIndex !== targetSetIndex)
    )
  }

  /**
   * Updates the goal count for a given set and team, clamping between 0 and 10.
   *
   * @param {number} targetSetIndex - Index of the set being updated.
   * @param {'team_a_goals' | 'team_b_goals'} goalField - Target team goal field.
   * @param {string} rawInputValue - Raw input value from the number field.
   * @returns {void}
   */
  function updateSetScore(
    targetSetIndex: number,
    goalField: 'team_a_goals' | 'team_b_goals',
    rawInputValue: string
  ): void {
    const parsedGoals: number | '' =
      rawInputValue === ''
        ? ''
        : Math.min(
            MAX_GOALS_PER_SET,
            Math.max(MIN_GOALS_PER_SET, parseInt(rawInputValue, 10) || MIN_GOALS_PER_SET)
          )
    setSets((previousSets: SetInput[]) =>
      previousSets.map((matchSet: SetInput, setIndex: number) =>
        setIndex === targetSetIndex ? { ...matchSet, [goalField]: parsedGoals } : matchSet
      )
    )
  }

  /**
   * Updates a player's ID or role within Team A or Team B.
   *
   * @param {'A' | 'B'} teamIdentifier - Team identifier ('A' or 'B').
   * @param {number} slotIndex - Slot index within the team.
   * @param {keyof TeamPlayerSlot} fieldName - Property to update ('player_id' or 'role').
   * @param {string} fieldValue - New value to assign.
   * @returns {void}
   */
  function updateTeamPlayerSlot(
    teamIdentifier: 'A' | 'B',
    slotIndex: number,
    fieldName: keyof TeamPlayerSlot,
    fieldValue: string
  ): void {
    if (teamIdentifier === 'A') {
      setTeamAPlayers((previousTeam: TeamPlayerSlot[]) =>
        previousTeam.map((slot: TeamPlayerSlot, index: number) =>
          index === slotIndex ? { ...slot, [fieldName]: fieldValue } : slot
        )
      )
    } else {
      setTeamBPlayers((previousTeam: TeamPlayerSlot[]) =>
        previousTeam.map((slot: TeamPlayerSlot, index: number) =>
          index === slotIndex ? { ...slot, [fieldName]: fieldValue } : slot
        )
      )
    }
  }

  const scorePreview: MatchScorePreview = sets.reduce<MatchScorePreview>(
    (accumulator: MatchScorePreview, currentSet: SetInput) => {
      if (currentSet.team_a_goals === '' || currentSet.team_b_goals === '') return accumulator
      if (currentSet.team_a_goals > currentSet.team_b_goals) accumulator.teamAWins += 1
      else if (currentSet.team_b_goals > currentSet.team_a_goals) accumulator.teamBWins += 1
      return accumulator
    },
    { teamAWins: 0, teamBWins: 0 }
  )

  /**
   * Validates the match form before submission.
   *
   * @returns {string | null} Error message in French if invalid, or null if valid.
   */
  function validateMatchForm(): string | null {
    const combinedSlots: TeamPlayerSlot[] = [...teamAPlayers, ...teamBPlayers]
    const areAllPlayersSelected: boolean = combinedSlots.every((slot: TeamPlayerSlot) =>
      Boolean(slot.player_id)
    )
    if (!areAllPlayersSelected) return 'Veuillez sélectionner tous les joueurs'

    const selectedPlayerIds: string[] = combinedSlots.map(
      (slot: TeamPlayerSlot) => slot.player_id
    )
    if (new Set(selectedPlayerIds).size !== selectedPlayerIds.length) {
      return 'Un joueur ne peut pas être dans les deux équipes'
    }

    for (const matchSet of sets) {
      if (matchSet.team_a_goals === '' || matchSet.team_b_goals === '') {
        return 'Remplissez tous les scores de manches'
      }
      if (matchSet.team_a_goals === matchSet.team_b_goals) {
        return "Un match nul par manche n'est pas possible"
      }
      if (
        matchSet.team_a_goals !== MAX_GOALS_PER_SET &&
        matchSet.team_b_goals !== MAX_GOALS_PER_SET
      ) {
        return 'Au moins une équipe doit marquer 10 buts par manche'
      }
    }

    return null
  }

  /**
   * Submits the validated match data to the API endpoint.
   *
   * @returns {Promise<void>}
   */
  async function handleSubmitMatch(): Promise<void> {
    const validationError: string | null = validateMatchForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setIsSubmitting(true)
    try {
      const requestPayload = {
        match_type: matchType,
        sets: sets as { team_a_goals: number; team_b_goals: number }[],
        team_a: teamAPlayers,
        team_b: teamBPlayers,
      }

      const apiEndpoint: string =
        mode === 'edit' && matchId ? `/api/matches/${matchId}` : '/api/matches'

      const response: Response = await fetch(apiEndpoint, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      })

      const responseData = await response.json()
      if (!response.ok) throw new Error(responseData.error ?? 'Erreur serveur')

      toast.success(mode === 'edit' ? 'Match mis à jour ! ✅' : 'Match enregistré ! 🏆')
      const destinationMatchId: string =
        mode === 'edit' && matchId ? matchId : responseData.matchId
      router.push(`/matches/${destinationMatchId}`)
    } catch (submissionError: unknown) {
      const errorMessage: string =
        submissionError instanceof Error ? submissionError.message : 'Erreur inattendue'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Match Format Selector */}
      <div>
        <div className="step-tag">Format</div>
        <label className="mt-2 block text-xs uppercase tracking-wider font-semibold text-slate-400">
          Mode de la Rencontre
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {AVAILABLE_MATCH_TYPES.map((typeOption: MatchType) => (
            <button
              key={typeOption}
              type="button"
              onClick={() => switchMatchType(typeOption)}
              className={cn(
                'py-3.5 rounded-2xl font-display font-bold text-xl tracking-widest uppercase transition-all border',
                matchType === typeOption
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10'
                  : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-white'
              )}
            >
              {typeOption}
            </button>
          ))}
        </div>
      </div>

      {/* Teams Configuration */}
      <div>
        <div className="step-tag">Joueurs</div>
        <label className="mt-2 block text-xs uppercase tracking-wider font-semibold text-slate-400">
          Composition des Équipes
        </label>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEAM_IDENTIFIERS.map((teamSide: 'A' | 'B') => {
            const teamSlots: TeamPlayerSlot[] =
              teamSide === 'A' ? teamAPlayers : teamBPlayers
            const isTeamA: boolean = teamSide === 'A'

            return (
              <div
                key={teamSide}
                className={cn(
                  'p-4 rounded-2xl border space-y-3',
                  isTeamA
                    ? 'bg-emerald-500/[0.04] border-emerald-500/20'
                    : 'bg-rose-500/[0.04] border-rose-500/20'
                )}
              >
                <div
                  className={cn(
                    'flex items-center gap-2 font-display font-bold text-sm uppercase tracking-wider',
                    isTeamA ? 'text-emerald-400' : 'text-rose-400'
                  )}
                >
                  <span>{isTeamA ? '🟢' : '🔴'}</span>
                  <span>Équipe {teamSide}</span>
                </div>

                <div className="space-y-3">
                  {teamSlots.map((slotItem: TeamPlayerSlot, slotIndex: number) => (
                    <div key={slotIndex} className="space-y-2">
                      <select
                        value={slotItem.player_id}
                        onChange={(event) =>
                          updateTeamPlayerSlot(
                            teamSide,
                            slotIndex,
                            'player_id',
                            event.target.value
                          )
                        }
                        className="select text-sm"
                        disabled={
                          mode === 'create' &&
                          isTeamA &&
                          slotIndex === PRIMARY_SLOT_INDEX &&
                          Boolean(currentPlayer)
                        }
                      >
                        <option value="">— Choisir un joueur —</option>
                        {isTeamA && slotIndex === PRIMARY_SLOT_INDEX && currentPlayer && (
                          <option value={currentPlayer.id}>
                            {currentPlayer.display_name} (vous)
                          </option>
                        )}
                        {(() => {
                          const allSelectedIds: string[] = [...teamAPlayers, ...teamBPlayers]
                            .map((teamPlayer: TeamPlayerSlot) => teamPlayer.player_id)
                            .filter(Boolean)
                          const otherUsedIds: string[] = allSelectedIds.filter(
                            (id: string) => id !== slotItem.player_id
                          )
                          return allPlayers
                            .filter((candidatePlayer) => {
                              if (isTeamA && slotIndex === PRIMARY_SLOT_INDEX && currentPlayer) {
                                return false
                              }
                              return !otherUsedIds.includes(candidatePlayer.id)
                            })
                            .map((candidatePlayer) => (
                              <option key={candidatePlayer.id} value={candidatePlayer.id}>
                                {candidatePlayer.display_name}
                              </option>
                            ))
                        })()}
                      </select>

                      {matchType === '2v2' && (
                        <select
                          value={slotItem.role}
                          onChange={(event) =>
                            updateTeamPlayerSlot(
                              teamSide,
                              slotIndex,
                              'role',
                              event.target.value
                            )
                          }
                          className="select text-xs py-2"
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
      </div>

      {/* Sets Score Input */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="step-tag">Manches</div>
            <label className="mt-2 block text-xs uppercase tracking-wider font-semibold text-slate-400">
              Scores par Manche (max 10 buts)
            </label>
          </div>
          <button
            type="button"
            onClick={addSetRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-display font-bold uppercase tracking-wider text-emerald-400 border border-white/10 transition-all active:scale-95"
          >
            <Plus size={ADD_ICON_SIZE_PX} /> Ajouter Manche
          </button>
        </div>

        <div className="mt-3 space-y-2.5">
          {sets.map((matchSet: SetInput, setIndex: number) => {
            const teamAGoals: number | null =
              matchSet.team_a_goals === '' ? null : Number(matchSet.team_a_goals)
            const teamBGoals: number | null =
              matchSet.team_b_goals === '' ? null : Number(matchSet.team_b_goals)
            const didTeamAWinSet: boolean =
              teamAGoals !== null && teamBGoals !== null && teamAGoals > teamBGoals
            const didTeamBWinSet: boolean =
              teamAGoals !== null && teamBGoals !== null && teamBGoals > teamAGoals
            const isFannySet: boolean =
              (teamAGoals === MAX_GOALS_PER_SET && teamBGoals === MIN_GOALS_PER_SET) ||
              (teamAGoals === MIN_GOALS_PER_SET && teamBGoals === MAX_GOALS_PER_SET)

            return (
              <div
                key={setIndex}
                className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between gap-2 sm:gap-3"
              >
                <div className="number-pill w-14 sm:w-20 shrink-0 text-xs">
                  M{setIndex + 1}
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center">
                  <input
                    type="number"
                    min={MIN_GOALS_PER_SET}
                    max={MAX_GOALS_PER_SET}
                    value={matchSet.team_a_goals}
                    onChange={(event) =>
                      updateSetScore(setIndex, 'team_a_goals', event.target.value)
                    }
                    className={cn(
                      'input text-center w-16 sm:w-20 text-lg font-bold score-value py-2.5',
                      didTeamAWinSet && 'border-emerald-500/60 text-emerald-400 bg-emerald-500/10'
                    )}
                    placeholder="0"
                  />
                  <span className="font-display font-bold text-slate-500 text-lg">:</span>
                  <input
                    type="number"
                    min={MIN_GOALS_PER_SET}
                    max={MAX_GOALS_PER_SET}
                    value={matchSet.team_b_goals}
                    onChange={(event) =>
                      updateSetScore(setIndex, 'team_b_goals', event.target.value)
                    }
                    className={cn(
                      'input text-center w-16 sm:w-20 text-lg font-bold score-value py-2.5',
                      didTeamBWinSet && 'border-rose-500/60 text-rose-400 bg-rose-500/10'
                    )}
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {isFannySet && (
                    <span
                      title="Fanny 10-0 !"
                      className="badge bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    >
                      🏳️
                    </span>
                  )}
                  {sets.length > MIN_SETS_COUNT && (
                    <button
                      type="button"
                      onClick={() => removeSetRow(setIndex)}
                      className="player-remove-btn"
                      title="Supprimer cette manche"
                      aria-label="Supprimer la manche"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Live Match Score Preview */}
        {(scorePreview.teamAWins > 0 || scorePreview.teamBWins > 0) && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
            <span className="font-display font-bold text-xs uppercase tracking-wider text-amber-300">
              ⚡ Score Final Prévisionnel
            </span>
            <div className="font-display text-2xl font-black score-value">
              <span className="text-emerald-400">{scorePreview.teamAWins}</span>
              <span className="text-slate-500 mx-2">-</span>
              <span className="text-rose-400">{scorePreview.teamBWins}</span>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmitMatch}
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-4 text-base sm:text-lg font-display font-bold uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
      >
        {isSubmitting ? 'Enregistrement en cours...' : 'Enregistrer le Match'}
      </button>
    </div>
  )
}
