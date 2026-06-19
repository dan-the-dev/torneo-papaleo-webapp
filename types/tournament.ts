export type Round = 'group' | 'r16' | 'qf' | 'sf' | '3rd' | 'final';
export type MatchStatus = 'scheduled' | 'live' | 'finished';
export type EventType = 'goal' | 'assist' | 'red_card';

export interface Group {
  id: number;
  name: string;
}

export interface Team {
  id: number;
  name: string;
  short_name: string;
  color_primary: string;
  color_secondary: string;
  group_id: number;
}

export interface Player {
  id: number;
  team_id: number;
  name: string;
  number: number | null;
}

export interface Match {
  id: number;
  group_id: number | null;
  round: Round;
  match_number: number;
  scheduled_at: Date;
  team_home_id: number;
  team_away_id: number;
  status: MatchStatus;
  score_home: number | null;
  score_away: number | null;
  notes: string | null;
  current_minute: number | null;
  started_at: Date | null;
  finished_at: Date | null;
}

export interface MatchEvent {
  id: number;
  match_id: number;
  player_id: number | null;
  team_id: number;
  type: EventType;
  minute: number | null;
}

export interface KnockoutSlot {
  id: number;
  round: Round;
  slot_number: number;
  team_id: number | null;
  match_id: number | null;
}

export interface GroupStanding {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
}

export interface MatchWithTeams extends Match {
  team_home: Team;
  team_away: Team;
}

export interface MatchEventWithDetails extends MatchEvent {
  player: Player | null;
  team: Team;
}

export interface MatchDetail extends MatchWithTeams {
  events: MatchEventWithDetails[];
}

export interface TopScorer {
  player: Player;
  team: Team;
  goals: number;
  assists: number;
}

export interface KnockoutSlotWithDetails extends KnockoutSlot {
  team: Team | null;
  match: MatchWithTeams | null;
}
