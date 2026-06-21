import pool from '../client';
import type {
  KnockoutSlotSource,
  KnockoutSlotWithDetails,
  MatchStatus,
  Round,
  Team,
  MatchWithTeams,
} from '@/types/tournament';

export async function getKnockoutSlots(): Promise<KnockoutSlotWithDetails[]> {
  interface RawRow {
    id: number;
    round: Round;
    slot_number: number;
    team_id: number | null;
    match_id: number | null;
    provisional: boolean;
    source: KnockoutSlotSource;
    team: Record<string, unknown> | null;
    match: Record<string, unknown> | null;
  }

  const { rows } = await pool.query<RawRow>(
    `SELECT ks.*,
       row_to_json(t) AS team,
       row_to_json(m) AS match
     FROM knockout_slots ks
     LEFT JOIN teams t ON ks.team_id = t.id
     LEFT JOIN matches m ON ks.match_id = m.id
     ORDER BY ks.round, ks.slot_number`,
  );

  return rows.map((r) => ({
    id: r.id,
    round: r.round,
    slot_number: r.slot_number,
    team_id: r.team_id,
    match_id: r.match_id,
    provisional: r.provisional,
    source: r.source,
    team: r.team as Team | null,
    match: r.match as MatchWithTeams | null,
  }));
}

export async function isGroupStageDone(): Promise<boolean> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM matches WHERE round = 'group' AND status != 'finished'`,
  );
  return parseInt(rows[0]?.count ?? '1', 10) === 0;
}

export interface R16MatchSlot {
  matchNum: number;
  matchId: number;
  scheduledAt: Date;
  status: MatchStatus;
  homeTeamId: number | null;
  awayTeamId: number | null;
}

// One row per R16 match (1-8) for the admin bracket editor — team ids come
// straight from `matches`, which both auto-sync and manual saves keep in sync.
export async function getR16MatchSlots(): Promise<R16MatchSlot[]> {
  const { rows } = await pool.query<{
    match_number: number;
    id: number;
    scheduled_at: Date;
    status: MatchStatus;
    team_home_id: number | null;
    team_away_id: number | null;
  }>(
    `SELECT match_number, id, scheduled_at, status, team_home_id, team_away_id
     FROM matches WHERE round = 'r16' ORDER BY match_number`,
  );

  return rows.map((r) => ({
    matchNum: r.match_number,
    matchId: r.id,
    scheduledAt: r.scheduled_at,
    status: r.status,
    homeTeamId: r.team_home_id,
    awayTeamId: r.team_away_id,
  }));
}
