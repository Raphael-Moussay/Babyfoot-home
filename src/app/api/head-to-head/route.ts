import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playerA = searchParams.get('a')
  const playerB = searchParams.get('b')

  if (!playerA || !playerB) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const supabase = createClient()

  // Find all matches where both players appear
  // We do this by finding matches containing player A, then filtering for those also containing player B
  const { data: matchesWithA } = await supabase
    .from('match_players')
    .select('match_team_id, match_teams!inner(match_id, team)')
    .eq('player_id', playerA)

  if (!matchesWithA || matchesWithA.length === 0) {
    return NextResponse.json({
      playerAWins: 0, playerBWins: 0, total: 0,
      setsWonA: 0, setsWonB: 0, bestSetDiffA: 0, bestSetDiffB: 0,
      fannyGivenA: 0, fannyGivenB: 0,
      recentMatches: []
    })
  }

  const matchIdsWithA = Array.from(
    new Set(matchesWithA.map((m: any) => m.match_teams.match_id))
  )

  const { data: matchesWithB } = await supabase
    .from('match_players')
    .select('match_team_id, match_teams!inner(match_id, team)')
    .eq('player_id', playerB)
    .in('match_teams.match_id' as any, matchIdsWithA)

  if (!matchesWithB || matchesWithB.length === 0) {
    return NextResponse.json({
      playerAWins: 0, playerBWins: 0, total: 0,
      setsWonA: 0, setsWonB: 0, bestSetDiffA: 0, bestSetDiffB: 0,
      fannyGivenA: 0, fannyGivenB: 0,
      recentMatches: []
    })
  }

  const sharedMatchIds = Array.from(
    new Set(matchesWithB.map((m: any) => m.match_teams.match_id))
  )

  // Get full match data
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, created_at, team_a_score, team_b_score,
      match_sets(set_index, team_a_goals, team_b_goals, winner_team, is_fanny),
      match_teams(id, team, match_players(player_id))
    `)
    .in('id', sharedMatchIds)
    .order('created_at', { ascending: false })

  if (!matches) {
    return NextResponse.json({ error: 'Erreur requête' }, { status: 500 })
  }

  let playerAWins = 0
  let playerBWins = 0
  let setsWonA = 0
  let setsWonB = 0
  let bestSetDiffA = 0
  let bestSetDiffB = 0
  let fannyGivenA = 0
  let fannyGivenB = 0
  const recentMatches: any[] = []

  for (const match of matches) {
    const teams = (match as any).match_teams as any[]
    const teamA = teams.find((t: any) => t.team === 'A')
    const teamB = teams.find((t: any) => t.team === 'B')

    const aPlayerIds = teamA?.match_players?.map((mp: any) => mp.player_id) ?? []
    const bPlayerIds = teamB?.match_players?.map((mp: any) => mp.player_id) ?? []

    // Determine which team each player is on
    const pATeam = aPlayerIds.includes(playerA) ? 'A' : 'B'
    const pBTeam = aPlayerIds.includes(playerB) ? 'A' : 'B'

    // Skip if they're on the same team
    if (pATeam === pBTeam) continue

    const pAWonMatch = (pATeam === 'A' && match.team_a_score > match.team_b_score) ||
                       (pATeam === 'B' && match.team_b_score > match.team_a_score)

    if (pAWonMatch) playerAWins++
    else playerBWins++

    // Sets
    const sets = ((match as any).match_sets as any[]) ?? []
    for (const s of sets) {
      const aGoals = pATeam === 'A' ? s.team_a_goals : s.team_b_goals
      const bGoals = pATeam === 'A' ? s.team_b_goals : s.team_a_goals
      const diff = Math.abs(aGoals - bGoals)

      if (s.is_fanny) {
        if (aGoals === 10) fannyGivenA++
        if (bGoals === 10) fannyGivenB++
      }

      if (aGoals > bGoals) {
        setsWonA++
        if (diff > bestSetDiffA) bestSetDiffA = diff
      } else {
        setsWonB++
        if (diff > bestSetDiffB) bestSetDiffB = diff
      }
    }

    // Recent matches (last 5)
    if (recentMatches.length < 5) {
      const teamAScore = pATeam === 'A' ? match.team_a_score : match.team_b_score
      const teamBScore = pATeam === 'A' ? match.team_b_score : match.team_a_score
      recentMatches.push({
        date: match.created_at,
        teamAScore,
        teamBScore,
        sets: sets
          .sort((a: any, b: any) => a.set_index - b.set_index)
          .map((s: any) => ({
            a: pATeam === 'A' ? s.team_a_goals : s.team_b_goals,
            b: pATeam === 'A' ? s.team_b_goals : s.team_a_goals,
          })),
      })
    }
  }

  return NextResponse.json({
    playerAWins,
    playerBWins,
    total: playerAWins + playerBWins,
    setsWonA,
    setsWonB,
    bestSetDiffA,
    bestSetDiffB,
    fannyGivenA,
    fannyGivenB,
    recentMatches,
  })
}
