import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateEloDeltas, matchScoreFromSets, isFanny, setWinner } from '@/lib/elo'
import type { PlayerRole } from '@/types'

interface SetInput {
  team_a_goals: number
  team_b_goals: number
}

interface TeamPlayerInput {
  player_id: string
  role: PlayerRole
}

interface CreateMatchPayload {
  match_type: '1v1' | '2v2'
  sets: SetInput[]
  team_a: TeamPlayerInput[]
  team_b: TeamPlayerInput[]
}

export async function POST(request: Request) {
  const supabase = createClient()
  const admin = createAdminClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Get current player
  const { data: currentPlayer } = await supabase
    .from('players').select('id').eq('auth_user_id', user.id).single()
  if (!currentPlayer) return NextResponse.json({ error: 'Joueur introuvable' }, { status: 404 })

  const body: CreateMatchPayload = await request.json()
  const { match_type, sets, team_a, team_b } = body

  // Compute match score
  const { team_a_score, team_b_score } = matchScoreFromSets(sets)
  const teamAWon = team_a_score > team_b_score

  // ─── 1. Create match ───────────────────────────────────────────────
  const { data: match, error: matchErr } = await admin
    .from('matches')
    .insert({
      created_by: currentPlayer.id,
      match_type,
      team_a_score,
      team_b_score,
      status: 'valid',
    })
    .select()
    .single()

  if (matchErr || !match) {
    return NextResponse.json({ error: matchErr?.message ?? 'Erreur création match' }, { status: 500 })
  }

  // ─── 2. Create teams ───────────────────────────────────────────────
  const { data: teamARow } = await admin.from('match_teams')
    .insert({ match_id: match.id, team: 'A' }).select().single()
  const { data: teamBRow } = await admin.from('match_teams')
    .insert({ match_id: match.id, team: 'B' }).select().single()

  if (!teamARow || !teamBRow) {
    return NextResponse.json({ error: 'Erreur création équipes' }, { status: 500 })
  }

  // ─── 3. Create match_players ──────────────────────────────────────
  const mpInserts = [
    ...team_a.map(p => ({ match_team_id: teamARow.id, player_id: p.player_id, role: p.role })),
    ...team_b.map(p => ({ match_team_id: teamBRow.id, player_id: p.player_id, role: p.role })),
  ]
  await admin.from('match_players').insert(mpInserts)

  // ─── 4. Create match_sets ─────────────────────────────────────────
  const setsInsert = sets.map((s, i) => ({
    match_id: match.id,
    set_index: i,
    team_a_goals: s.team_a_goals,
    team_b_goals: s.team_b_goals,
    winner_team: setWinner(s.team_a_goals, s.team_b_goals),
    is_fanny: isFanny(s.team_a_goals, s.team_b_goals),
  }))
  await admin.from('match_sets').insert(setsInsert)

  // ─── 5. Load current ELO for all players ─────────────────────────
  const allPlayerIds = [...team_a, ...team_b].map(p => p.player_id)
  const { data: statsRows } = await admin
    .from('player_stats')
    .select('*')
    .in('player_id', allPlayerIds)

  const statsMap = new Map(statsRows?.map(s => [s.player_id, s]) ?? [])

  const teamAWithElo = team_a.map(p => ({
    id: p.player_id,
    elo: statsMap.get(p.player_id)?.elo ?? 1000,
  }))
  const teamBWithElo = team_b.map(p => ({
    id: p.player_id,
    elo: statsMap.get(p.player_id)?.elo ?? 1000,
  }))

  // ─── 6. Calculate ELO deltas ──────────────────────────────────────
  const eloDeltas = calculateEloDeltas(teamAWithElo, teamBWithElo, teamAWon)

  // ─── 7. Insert elo_history rows ───────────────────────────────────
  const eloHistoryInserts = Array.from(eloDeltas.entries()).map(([pid, d]) => ({
    match_id: match.id,
    player_id: pid,
    elo_before: d.before,
    elo_after: d.after,
    delta: d.delta,
  }))
  await admin.from('elo_history').insert(eloHistoryInserts)

  // ─── 8. Update player_stats ───────────────────────────────────────
  const totalGoalsA = sets.reduce((s, m) => s + m.team_a_goals, 0)
  const totalGoalsB = sets.reduce((s, m) => s + m.team_b_goals, 0)
  const fannyCount = setsInsert.filter(s => s.is_fanny)
  
  for (const pid of allPlayerIds) {
    const isTeamA = team_a.some(p => p.player_id === pid)
    const won = isTeamA ? teamAWon : !teamAWon
    const stats = statsMap.get(pid)
    const eloDelta = eloDeltas.get(pid)!
    
    const goalsFor = isTeamA ? totalGoalsA : totalGoalsB
    const goalsAgainst = isTeamA ? totalGoalsB : totalGoalsA
    
    // Fanny given/taken
    let fannyGiven = 0
    let fannyTaken = 0
    for (const s of fannyCount) {
      const aScored10 = s.team_a_goals === 10
      if (isTeamA) {
        if (aScored10) fannyGiven++
        else fannyTaken++
      } else {
        if (!aScored10) fannyGiven++
        else fannyTaken++
      }
    }

    // Streak calculation
    const currentStreak = stats?.current_streak ?? 0
    let newStreak: number
    if (won) {
      newStreak = currentStreak >= 0 ? currentStreak + 1 : 1
    } else {
      newStreak = currentStreak <= 0 ? currentStreak - 1 : -1
    }

    const newWins = (stats?.wins ?? 0) + (won ? 1 : 0)
    const newLosses = (stats?.losses ?? 0) + (won ? 0 : 1)
    const newMatchCount = (stats?.match_count ?? 0) + 1

    await admin.from('player_stats').upsert({
      player_id: pid,
      elo: eloDelta.after,
      wins: newWins,
      losses: newLosses,
      match_count: newMatchCount,
      goals_for: (stats?.goals_for ?? 0) + goalsFor,
      goals_against: (stats?.goals_against ?? 0) + goalsAgainst,
      fanny_given: (stats?.fanny_given ?? 0) + fannyGiven,
      fanny_taken: (stats?.fanny_taken ?? 0) + fannyTaken,
      current_streak: newStreak,
      last_3_wins: newStreak >= 3,
      last_match_at: new Date().toISOString(),
    }, { onConflict: 'player_id' })
  }

  return NextResponse.json({ matchId: match.id }, { status: 201 })
}
