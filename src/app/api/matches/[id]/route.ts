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

interface UpdateMatchPayload {
  match_type: '1v1' | '2v2'
  sets: SetInput[]
  team_a: TeamPlayerInput[]
  team_b: TeamPlayerInput[]
}

interface PlayerStatsRow {
  player_id: string
  elo: number
  wins: number
  losses: number
  match_count: number
  goals_for: number
  goals_against: number
  fanny_given: number
  fanny_taken: number
  current_streak: number
  last_3_wins: boolean
  last_match_at: string | null
}

function createBaseStats(player_id: string): PlayerStatsRow {
  return {
    player_id,
    elo: 1000,
    wins: 0,
    losses: 0,
    match_count: 0,
    goals_for: 0,
    goals_against: 0,
    fanny_given: 0,
    fanny_taken: 0,
    current_streak: 0,
    last_3_wins: false,
    last_match_at: null,
  }
}

async function recalculateAllStats(admin: ReturnType<typeof createAdminClient>) {
  const { data: players } = await admin.from('players').select('id')
  const playerIds = (players ?? []).map(p => p.id)

  const statsMap = new Map<string, PlayerStatsRow>()
  for (const pid of playerIds) {
    statsMap.set(pid, createBaseStats(pid))
  }

  await admin.from('elo_history').delete().neq('match_id', '')

  const { data: matches } = await admin
    .from('matches')
    .select(`
      id, created_at, match_type, team_a_score, team_b_score, status,
      match_sets ( set_index, team_a_goals, team_b_goals, is_fanny ),
      match_teams ( team, match_players ( player_id ) )
    `)
    .eq('status', 'valid')
    .order('created_at', { ascending: true })

  if (!matches) return

  const eloHistoryInserts: any[] = []

  for (const match of matches) {
    const sets = ((match as any).match_sets ?? [])
      .sort((a: any, b: any) => a.set_index - b.set_index)

    const { team_a_score, team_b_score } = matchScoreFromSets(
      sets.map((s: any) => ({
        team_a_goals: s.team_a_goals,
        team_b_goals: s.team_b_goals,
      }))
    )

    if (team_a_score !== match.team_a_score || team_b_score !== match.team_b_score) {
      await admin
        .from('matches')
        .update({ team_a_score, team_b_score })
        .eq('id', match.id)
    }

    const teams = (match as any).match_teams as any[]
    const teamA = teams.find(t => t.team === 'A')
    const teamB = teams.find(t => t.team === 'B')

    const teamAPlayers = (teamA?.match_players ?? []).map((p: any) => p.player_id) as string[]
    const teamBPlayers = (teamB?.match_players ?? []).map((p: any) => p.player_id) as string[]

    const teamAWon = team_a_score > team_b_score
    const teamAWithElo = teamAPlayers.map((pid: string) => ({ id: pid, elo: statsMap.get(pid)?.elo ?? 1000 }))
    const teamBWithElo = teamBPlayers.map((pid: string) => ({ id: pid, elo: statsMap.get(pid)?.elo ?? 1000 }))

    const eloDeltas = calculateEloDeltas(teamAWithElo, teamBWithElo, teamAWon)

    for (const [pid, d] of eloDeltas.entries()) {
      eloHistoryInserts.push({
        match_id: match.id,
        player_id: pid,
        elo_before: d.before,
        elo_after: d.after,
        delta: d.delta,
      })
    }

    const totalGoalsA = sets.reduce((s: number, m: any) => s + m.team_a_goals, 0)
    const totalGoalsB = sets.reduce((s: number, m: any) => s + m.team_b_goals, 0)
    const fannySets = sets.filter((s: any) => s.is_fanny)

    const allPlayerIds = [...teamAPlayers, ...teamBPlayers] as string[]

    for (const pid of allPlayerIds) {
      const isTeamA = teamAPlayers.includes(pid)
      const won = isTeamA ? teamAWon : !teamAWon
      const stats = statsMap.get(pid) ?? createBaseStats(pid)
      const eloDelta = eloDeltas.get(pid)!

      const goalsFor = isTeamA ? totalGoalsA : totalGoalsB
      const goalsAgainst = isTeamA ? totalGoalsB : totalGoalsA

      let fannyGiven = 0
      let fannyTaken = 0
      for (const s of fannySets) {
        const aScored10 = s.team_a_goals === 10
        if (isTeamA) {
          if (aScored10) fannyGiven++
          else fannyTaken++
        } else {
          if (!aScored10) fannyGiven++
          else fannyTaken++
        }
      }

      let newStreak: number
      if (won) {
        newStreak = stats.current_streak >= 0 ? stats.current_streak + 1 : 1
      } else {
        newStreak = stats.current_streak <= 0 ? stats.current_streak - 1 : -1
      }

      const updated: PlayerStatsRow = {
        player_id: pid,
        elo: eloDelta.after,
        wins: stats.wins + (won ? 1 : 0),
        losses: stats.losses + (won ? 0 : 1),
        match_count: stats.match_count + 1,
        goals_for: stats.goals_for + goalsFor,
        goals_against: stats.goals_against + goalsAgainst,
        fanny_given: stats.fanny_given + fannyGiven,
        fanny_taken: stats.fanny_taken + fannyTaken,
        current_streak: newStreak,
        last_3_wins: newStreak >= 3,
        last_match_at: match.created_at,
      }

      statsMap.set(pid, updated)
    }
  }

  if (eloHistoryInserts.length > 0) {
    await admin.from('elo_history').insert(eloHistoryInserts)
  }

  const upserts = playerIds.map(pid => statsMap.get(pid) ?? createBaseStats(pid))
  if (upserts.length > 0) {
    await admin.from('player_stats').upsert(upserts, { onConflict: 'player_id' })
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  const supabase = createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: currentPlayer } = await supabase
    .from('players')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!currentPlayer) return NextResponse.json({ error: 'Joueur introuvable' }, { status: 404 })

  const { data: match } = await admin
    .from('matches')
    .select('id, created_by')
    .eq('id', context.params.id)
    .single()

  if (!match) return NextResponse.json({ error: 'Match introuvable' }, { status: 404 })
  if (match.created_by !== currentPlayer.id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const body: UpdateMatchPayload = await request.json()
  const { match_type, sets, team_a, team_b } = body

  const { team_a_score, team_b_score } = matchScoreFromSets(sets)

  await admin
    .from('matches')
    .update({ match_type, team_a_score, team_b_score, status: 'valid' })
    .eq('id', match.id)

  await admin.from('match_disputes').delete().eq('match_id', match.id)

  const { data: existingTeams } = await admin
    .from('match_teams')
    .select('id')
    .eq('match_id', match.id)

  const teamIds = (existingTeams ?? []).map(t => t.id)
  if (teamIds.length > 0) {
    await admin.from('match_players').delete().in('match_team_id', teamIds)
  }

  await admin.from('match_teams').delete().eq('match_id', match.id)
  await admin.from('match_sets').delete().eq('match_id', match.id)
  await admin.from('elo_history').delete().eq('match_id', match.id)

  const { data: teamARow } = await admin.from('match_teams')
    .insert({ match_id: match.id, team: 'A' }).select().single()
  const { data: teamBRow } = await admin.from('match_teams')
    .insert({ match_id: match.id, team: 'B' }).select().single()

  if (!teamARow || !teamBRow) {
    return NextResponse.json({ error: 'Erreur création équipes' }, { status: 500 })
  }

  const mpInserts = [
    ...team_a.map(p => ({ match_team_id: teamARow.id, player_id: p.player_id, role: p.role })),
    ...team_b.map(p => ({ match_team_id: teamBRow.id, player_id: p.player_id, role: p.role })),
  ]
  await admin.from('match_players').insert(mpInserts)

  const setsInsert = sets.map((s, i) => ({
    match_id: match.id,
    set_index: i,
    team_a_goals: s.team_a_goals,
    team_b_goals: s.team_b_goals,
    winner_team: setWinner(s.team_a_goals, s.team_b_goals),
    is_fanny: isFanny(s.team_a_goals, s.team_b_goals),
  }))
  await admin.from('match_sets').insert(setsInsert)

  await recalculateAllStats(admin)

  return NextResponse.json({ matchId: match.id }, { status: 200 })
}
