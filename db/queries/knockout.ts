import pool from '../client';
import type { KnockoutSlotWithDetails, Round, Team, MatchWithTeams } from '@/types/tournament';

export async function getKnockoutSlots(): Promise<KnockoutSlotWithDetails[]> {
  interface RawRow {
    id: number;
    round: Round;
    slot_number: number;
    team_id: number | null;
    match_id: number | null;
    provisional: boolean;
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
