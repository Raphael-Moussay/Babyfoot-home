import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { NewMatchForm } from '@/components/match/NewMatchForm'

export default async function EditMatchPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: currentPlayer } = await supabase
    .from('players')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (!currentPlayer) redirect('/auth/login')

  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, match_type, created_by,
      match_sets ( set_index, team_a_goals, team_b_goals ),
      match_teams (
        id, team,
        match_players ( player_id, role )
      )
    `)
    .eq('id', params.id)
    .single()

  if (!match) redirect('/matches')
  if (match.created_by !== currentPlayer.id) redirect(`/matches/${params.id}`)

  const teamA = (match as any).match_teams?.find((t: any) => t.team === 'A')
  const teamB = (match as any).match_teams?.find((t: any) => t.team === 'B')

  const initialData = {
    match_type: match.match_type,
    sets: ((match as any).match_sets ?? [])
      .sort((a: any, b: any) => a.set_index - b.set_index)
      .map((s: any) => ({
        team_a_goals: s.team_a_goals,
        team_b_goals: s.team_b_goals,
      })),
    team_a: (teamA?.match_players ?? []).map((p: any) => ({
      player_id: p.player_id,
      role: p.role,
    })),
    team_b: (teamB?.match_players ?? []).map((p: any) => ({
      player_id: p.player_id,
      role: p.role,
    })),
  }

  const { data: allPlayers } = await supabase
    .from('players')
    .select('id, display_name, avatar_url, email')
    .order('display_name')

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="font-display text-3xl sm:text-4xl tracking-wider mb-8">MODIFIER MATCH</h1>
        <NewMatchForm
          mode="edit"
          matchId={match.id}
          currentPlayer={currentPlayer}
          allPlayers={allPlayers ?? []}
          initialData={initialData}
        />
      </main>
    </div>
  )
}
