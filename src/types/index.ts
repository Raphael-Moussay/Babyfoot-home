export type MatchType = '1v1' | '2v2'
export type TeamSide = 'A' | 'B'
export type PlayerRole = 'attacker' | 'defender' | 'solo'
export type MatchStatus = 'valid' | 'disputed'

export interface Player {
  id: string
  display_name: string
  email: string
  avatar_url?: string
  auth_user_id?: string
  created_at: string
}

export interface PlayerStats {
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
  last_match_at?: string
}

export interface LeaderboardEntry extends Player {
  elo: number
  wins: number
  losses: number
  match_count: number
  goal_average: number
  win_rate: number
  fanny_given: number
  fanny_taken: number
  current_streak: number
  last_3_wins: boolean
}

export interface Match {
  id: string
  created_at: string
  created_by: string
  match_type: MatchType
  team_a_score: number
  team_b_score: number
  status: MatchStatus
}

export interface MatchSet {
  id: string
  match_id: string
  set_index: number
  team_a_goals: number
  team_b_goals: number
  winner_team: TeamSide
  is_fanny: boolean
}

export interface MatchTeam {
  id: string
  match_id: string
  team: TeamSide
}

export interface MatchPlayer {
  id: string
  match_team_id: string
  player_id: string
  role: PlayerRole
}

// Form types for match creation
export interface SetInput {
  team_a_goals: number | ''
  team_b_goals: number | ''
}

export interface MatchFormData {
  match_type: MatchType
  sets: SetInput[]
  team_a: { player_id: string; role: PlayerRole }[]
  team_b: { player_id: string; role: PlayerRole }[]
}

// Head-to-head
export interface HeadToHeadStats {
  player_a_wins: number
  player_b_wins: number
  total_matches: number
  player_a_sets_won: number
  player_b_sets_won: number
  best_win_a: number // max goal difference in a set won by A
  best_win_b: number
}
