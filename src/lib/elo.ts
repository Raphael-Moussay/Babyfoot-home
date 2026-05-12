/**
 * ELO Rating System
 * K-factor: 32 (standard for club-level play)
 * Expected score formula: E = 1 / (1 + 10^((Rb - Ra) / 400))
 */

export const ELO_K_FACTOR = 32
export const ELO_DEFAULT = 1000

/**
 * Calculate expected score for player A against player B
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

/**
 * Calculate new ELO rating
 * @param currentRating Current ELO
 * @param opponentRating Opponent's ELO
 * @param score 1 = win, 0 = loss, 0.5 = draw
 */
export function newElo(currentRating: number, opponentRating: number, score: 0 | 0.5 | 1): number {
  const expected = expectedScore(currentRating, opponentRating)
  return Math.round(currentRating + ELO_K_FACTOR * (score - expected))
}

/**
 * Calculate ELO deltas for a match
 * For 2v2, we use the average ELO of each team
 */
export function calculateEloDeltas(
  teamAPlayers: { id: string; elo: number }[],
  teamBPlayers: { id: string; elo: number }[],
  teamAWon: boolean
): Map<string, { before: number; after: number; delta: number }> {
  const avgEloA = teamAPlayers.reduce((s, p) => s + p.elo, 0) / teamAPlayers.length
  const avgEloB = teamBPlayers.reduce((s, p) => s + p.elo, 0) / teamBPlayers.length

  const results = new Map<string, { before: number; after: number; delta: number }>()

  for (const player of teamAPlayers) {
    const score = teamAWon ? 1 : 0
    const after = newElo(player.elo, avgEloB, score as 0 | 1)
    results.set(player.id, { before: player.elo, after, delta: after - player.elo })
  }

  for (const player of teamBPlayers) {
    const score = teamAWon ? 0 : 1
    const after = newElo(player.elo, avgEloA, score as 0 | 1)
    results.set(player.id, { before: player.elo, after, delta: after - player.elo })
  }

  return results
}

/**
 * Detect if a set is a "Fanny" (10-0)
 */
export function isFanny(goalsA: number, goalsB: number): boolean {
  return (goalsA === 10 && goalsB === 0) || (goalsA === 0 && goalsB === 10)
}

/**
 * Determine set winner
 */
export function setWinner(goalsA: number, goalsB: number): 'A' | 'B' {
  return goalsA > goalsB ? 'A' : 'B'
}

/**
 * Calculate match score from sets
 */
export function matchScoreFromSets(sets: { team_a_goals: number; team_b_goals: number }[]): {
  team_a_score: number
  team_b_score: number
} {
  let a = 0, b = 0
  for (const set of sets) {
    if (set.team_a_goals > set.team_b_goals) a++
    else b++
  }
  return { team_a_score: a, team_b_score: b }
}

/**
 * Check if player has last-3-wins streak
 */
export function hasStreak(streak: number): boolean {
  return streak >= 3
}
