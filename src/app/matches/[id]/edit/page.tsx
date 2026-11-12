import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { NewMatchForm } from '@/components/match/NewMatchForm'
import type { MatchType, Player, PlayerRole, TeamSide } from '@/types'

/**
 * Route parameters for the EditMatchPage component.
 */
interface EditMatchPageProps {
  params: {
    id: string
  }
}

/**
 * Set record structure returned when loading an existing match for editing.
 */
interface EditableSetRecord {
  set_index: number
  team_a_goals: number
  team_b_goals: number
}

/**
 * Team player record structure returned when loading an existing match for editing.
 */
interface EditableTeamPlayerRecord {
  player_id: string
  role: PlayerRole
}

/**
 * Team record structure returned when loading an existing match for editing.
 */
interface EditableTeamRecord {
  id: string
  team: TeamSide
  match_players: EditableTeamPlayerRecord[]
}

/**
 * Complete editable match payload returned from Supabase.
 */
interface EditableMatchRecord {
  id: string
  match_type: MatchType
  created_by: string
  match_sets: EditableSetRecord[]
  match_teams: EditableTeamRecord[]
}

/**
 * Renders the match editing screen styled after Cricket Cut-throat Pro's setup panel.
 *
 * @param {EditMatchPageProps} props - Route parameters containing the target match ID.
 * @returns {Promise<JSX.Element>} The rendered edit match page.
 */
export default async function EditMatchPage({
  params,
}: EditMatchPageProps): Promise<JSX.Element> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: rawCurrentPlayer } = await supabase
    .from('players')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (!rawCurrentPlayer) redirect('/auth/login')
  const currentPlayer = rawCurrentPlayer as Player

  const { data: rawMatch } = await supabase
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

  if (!rawMatch) redirect('/matches')
  const matchRecord = rawMatch as unknown as EditableMatchRecord

  if (matchRecord.created_by !== currentPlayer.id) redirect(`/matches/${params.id}`)

  const teamARecord: EditableTeamRecord | undefined = matchRecord.match_teams?.find(
    (teamEntry: EditableTeamRecord) => teamEntry.team === 'A'
  )
  const teamBRecord: EditableTeamRecord | undefined = matchRecord.match_teams?.find(
    (teamEntry: EditableTeamRecord) => teamEntry.team === 'B'
  )

  const initialFormData = {
    match_type: matchRecord.match_type,
    sets: [...(matchRecord.match_sets ?? [])]
      .sort(
        (setA: EditableSetRecord, setB: EditableSetRecord) => setA.set_index - setB.set_index
      )
      .map((matchSet: EditableSetRecord) => ({
        team_a_goals: matchSet.team_a_goals,
        team_b_goals: matchSet.team_b_goals,
      })),
    team_a: (teamARecord?.match_players ?? []).map((participant: EditableTeamPlayerRecord) => ({
      player_id: participant.player_id,
      role: participant.role,
    })),
    team_b: (teamBRecord?.match_players ?? []).map((participant: EditableTeamPlayerRecord) => ({
      player_id: participant.player_id,
      role: participant.role,
    })),
  }

  const { data: allPlayersRecords } = await supabase
    .from('players')
    .select('id, display_name, avatar_url, email')
    .order('display_name')

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto p-3 sm:p-6 space-y-5">
        <div className="panel rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
            <div>
              <div className="app-title text-2xl sm:text-3xl text-white">Modifier le Match</div>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                Correction des scores & recalcul ELO automatique
              </p>
            </div>
            <div className="hidden sm:block rounded-xl bg-amber-400/10 border border-amber-400/25 px-3 py-1.5 text-xs font-display font-bold uppercase tracking-widest text-amber-300">
              Édition
            </div>
          </div>

          <NewMatchForm
            mode="edit"
            matchId={matchRecord.id}
            currentPlayer={currentPlayer}
            allPlayers={allPlayersRecords ?? []}
            initialData={initialFormData}
          />
        </div>
      </main>
    </div>
  )
}
