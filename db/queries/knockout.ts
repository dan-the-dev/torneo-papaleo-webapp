import pool from '../client';
import type { KnockoutSlotWithDetails, Round, Team, MatchWithTeams } from '@/types/tournament';
import { getGroupStandings } from './groups';

// R16 bracket seeding: slot → { group position, group name }
// 1st A vs 2nd B, 1st B vs 2nd A, 1st C vs 2nd D, 1st D vs 2nd C
// + 1st of runners-up from other groups (simplified: 3rd place crossings)
// Full 16-team R16 seeding:
export const R16_SEEDING: Array<{ slot: number; group: string; position: number }[]> = [
  [{ slot: 1, group: 'A', position: 1 }, { slot: 2, group: 'B', position: 2 }],
  [{ slot: 3, group: 'C', position: 1 }, { slot: 4, group: 'D', position: 2 }],
  [{ slot: 5, group: 'B', position: 1 }, { slot: 6, group: 'A', position: 2 }],
  [{ slot: 7, group: 'D', position: 1 }, { slot: 8, group: 'C', position: 2 }],
  [{ slot: 9, group: 'A', position: 3 }, { slot: 10, group: 'B', position: 4 }],
  [{ slot: 11, group: 'C', position: 3 }, { slot: 12, group: 'D', position: 4 }],
  [{ slot: 13, group: 'B', position: 3 }, { slot: 14, group: 'A', position: 4 }],
  [{ slot: 15, group: 'D', position: 3 }, { slot: 16, group: 'C', position: 4 }],
];

export async function getKnockoutSlots(): Promise<KnockoutSlotWithDetails[]> {
  interface RawRow {
    id: number;
    round: Round;
    slot_number: number;
    team_id: number | null;
    match_id: number | null;
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
     ORDER BY ks.round, ks.slot_number`
  );

  return rows.map((r) => ({
    id: r.id,
    round: r.round,
    slot_number: r.slot_number,
    team_id: r.team_id,
    match_id: r.match_id,
    team: r.team as Team | null,
    match: r.match as MatchWithTeams | null,
  }));
}

export async function generateKnockoutBracket(): Promise<void> {
  const { rows: groups } = await pool.query<{ id: number; name: string }>(
    'SELECT id, name FROM groups ORDER BY name'
  );

  const standingsByGroup = new Map<string, Awaited<ReturnType<typeof getGroupStandings>>>();
  for (const group of groups) {
    const standings = await getGroupStandings(group.id);
    standingsByGroup.set(group.name, standings);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM knockout_slots WHERE round = $1', ['r16']);

    const slotTeams: Array<{ slot: number; teamId: number | null }> = [];

    for (const pair of R16_SEEDING) {
      for (const entry of pair) {
        const groupStandings = standingsByGroup.get(entry.group) ?? [];
        const teamEntry = groupStandings[entry.position - 1];
        slotTeams.push({ slot: entry.slot, teamId: teamEntry?.team.id ?? null });
      }
    }

    for (const { slot, teamId } of slotTeams) {
      await client.query(
        'INSERT INTO knockout_slots (round, slot_number, team_id) VALUES ($1, $2, $3)',
        ['r16', slot, teamId]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateKnockoutSlotTeam(
  round: Round,
  slotNumber: number,
  teamId: number | null
): Promise<void> {
  await pool.query(
    `INSERT INTO knockout_slots (round, slot_number, team_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (round, slot_number)
     DO UPDATE SET team_id = EXCLUDED.team_id`,
    [round, slotNumber, teamId]
  );
}

export async function isGroupStageDone(): Promise<boolean> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM matches WHERE round = 'group' AND status != 'finished'`
  );
  return parseInt(rows[0]?.count ?? '1', 10) === 0;
}
