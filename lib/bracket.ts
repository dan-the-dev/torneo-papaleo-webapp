import type { PoolClient } from 'pg';
import type { KnockoutSlotSource, Round } from '@/types/tournament';

// ─── Seeding constants ────────────────────────────────────────────────────────
// R16 is no longer seeded from standings — it's set entirely by the admin's
// draw (see saveManualR16Slot below). Only QF/SF/Final/3rd stay automatic.

// QF: winner of R16-n vs winner of R16-(9-n)
// Exported so the UI can derive "Vinc. Ottavo X" placeholder labels from the
// same source of truth instead of duplicating the mapping.
export const QF_SEEDING = [
  { matchNum: 1, homeR16: 1, awayR16: 8 },
  { matchNum: 2, homeR16: 2, awayR16: 7 },
  { matchNum: 3, homeR16: 3, awayR16: 6 },
  { matchNum: 4, homeR16: 4, awayR16: 5 },
] as const;

// SF: winner of QF-1 vs QF-4, winner of QF-2 vs QF-3
export const SF_SEEDING = [
  { matchNum: 1, homeQF: 1, awayQF: 4 },
  { matchNum: 2, homeQF: 2, awayQF: 3 },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type KnockoutRound = Exclude<Round, 'group'>;

// Used exclusively by the auto-sync below. Writes are skipped for any slot
// an admin has manually configured (source = 'manual'), so a goal during the
// group stage never clobbers a manually-set R16 matchup.
async function upsertMatchSlots(
  client: PoolClient,
  round: KnockoutRound,
  matchNum: number,
  homeTeamId: number | null,
  awayTeamId: number | null,
): Promise<void> {
  const { rows } = await client.query<{ id: number; status: string }>(
    `SELECT id, status FROM matches WHERE round = $1 AND match_number = $2`,
    [round, matchNum],
  );
  const match = rows[0];
  if (!match) return;
  if (match.status === 'live' || match.status === 'finished') return;

  const homeSlot = matchNum * 2 - 1;
  const awaySlot = matchNum * 2;

  await client.query(
    `INSERT INTO knockout_slots (round, slot_number, team_id, match_id, provisional, source)
     VALUES ($1, $2, $3, $4, false, 'auto')
     ON CONFLICT (round, slot_number) DO UPDATE
       SET team_id = EXCLUDED.team_id,
           match_id = EXCLUDED.match_id,
           provisional = EXCLUDED.provisional,
           source = EXCLUDED.source
       WHERE knockout_slots.source = 'auto'`,
    [round, homeSlot, homeTeamId, match.id],
  );
  await client.query(
    `INSERT INTO knockout_slots (round, slot_number, team_id, match_id, provisional, source)
     VALUES ($1, $2, $3, $4, false, 'auto')
     ON CONFLICT (round, slot_number) DO UPDATE
       SET team_id = EXCLUDED.team_id,
           match_id = EXCLUDED.match_id,
           provisional = EXCLUDED.provisional,
           source = EXCLUDED.source
       WHERE knockout_slots.source = 'auto'`,
    [round, awaySlot, awayTeamId, match.id],
  );

  // Only auto-sync the match's teams if neither slot has been manually set —
  // otherwise an admin's manual home pick could be paired with an auto away pick.
  const { rows: slotRows } = await client.query<{ source: KnockoutSlotSource }>(
    `SELECT source FROM knockout_slots WHERE round = $1 AND slot_number IN ($2, $3)`,
    [round, homeSlot, awaySlot],
  );
  if (slotRows.every((s) => s.source === 'auto')) {
    await client.query(
      `UPDATE matches SET team_home_id = $1, team_away_id = $2 WHERE id = $3`,
      [homeTeamId, awayTeamId, match.id],
    );
  }
}

// Admin-driven draw for a single R16 match. Always wins over whatever the
// auto-sync had set, and marks both slots as 'manual' so future
// syncBracket() runs leave them alone. scheduled_at is left untouched — R16
// timing comes from the seed placeholders, the draw only sets the matchup.
export async function saveManualR16Slot(
  client: PoolClient,
  matchNum: number,
  homeTeamId: number | null,
  awayTeamId: number | null,
): Promise<void> {
  const { rows } = await client.query<{ id: number; status: string }>(
    `SELECT id, status FROM matches WHERE round = 'r16' AND match_number = $1`,
    [matchNum],
  );
  const match = rows[0];
  if (!match) throw new Error(`R16 match ${matchNum} not found`);
  if (match.status === 'live' || match.status === 'finished') return;

  const homeSlot = matchNum * 2 - 1;
  const awaySlot = matchNum * 2;

  await client.query(
    `INSERT INTO knockout_slots (round, slot_number, team_id, match_id, provisional, source)
     VALUES ('r16', $1, $2, $3, false, 'manual')
     ON CONFLICT (round, slot_number) DO UPDATE
       SET team_id = EXCLUDED.team_id,
           match_id = EXCLUDED.match_id,
           provisional = EXCLUDED.provisional,
           source = EXCLUDED.source`,
    [homeSlot, homeTeamId, match.id],
  );
  await client.query(
    `INSERT INTO knockout_slots (round, slot_number, team_id, match_id, provisional, source)
     VALUES ('r16', $1, $2, $3, false, 'manual')
     ON CONFLICT (round, slot_number) DO UPDATE
       SET team_id = EXCLUDED.team_id,
           match_id = EXCLUDED.match_id,
           provisional = EXCLUDED.provisional,
           source = EXCLUDED.source`,
    [awaySlot, awayTeamId, match.id],
  );
  await client.query(
    `UPDATE matches SET team_home_id = $1, team_away_id = $2 WHERE id = $3`,
    [homeTeamId, awayTeamId, match.id],
  );
}

async function getWinner(
  client: PoolClient,
  round: KnockoutRound,
  matchNum: number,
): Promise<number | null> {
  const { rows } = await client.query<{
    status: string;
    score_home: number | null;
    score_away: number | null;
    team_home_id: number | null;
    team_away_id: number | null;
  }>(
    `SELECT status, score_home, score_away, team_home_id, team_away_id
     FROM matches WHERE round = $1 AND match_number = $2`,
    [round, matchNum],
  );
  const m = rows[0];
  if (!m || m.status !== 'finished') return null;
  if (m.score_home === null || m.score_away === null) return null;
  if (m.score_home > m.score_away) return m.team_home_id;
  if (m.score_away > m.score_home) return m.team_away_id;
  return null;
}

async function getLoser(
  client: PoolClient,
  round: KnockoutRound,
  matchNum: number,
): Promise<number | null> {
  const { rows } = await client.query<{
    status: string;
    score_home: number | null;
    score_away: number | null;
    team_home_id: number | null;
    team_away_id: number | null;
  }>(
    `SELECT status, score_home, score_away, team_home_id, team_away_id
     FROM matches WHERE round = $1 AND match_number = $2`,
    [round, matchNum],
  );
  const m = rows[0];
  if (!m || m.status !== 'finished') return null;
  if (m.score_home === null || m.score_away === null) return null;
  if (m.score_home > m.score_away) return m.team_away_id;
  if (m.score_away > m.score_home) return m.team_home_id;
  return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

// Cheap pre-check so callers can skip the full recalculation while the group
// stage is still in progress, when the bracket has nothing to update yet.
export async function hasAnyFinishedGroupMatch(client: PoolClient): Promise<boolean> {
  const { rows } = await client.query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM matches WHERE round = 'group' AND status = 'finished') AS exists`,
  );
  return rows[0]?.exists ?? false;
}

export async function syncBracket(client: PoolClient): Promise<void> {
  // QF — from finished R16 results
  for (const qf of QF_SEEDING) {
    const homeTeamId = await getWinner(client, 'r16', qf.homeR16);
    const awayTeamId = await getWinner(client, 'r16', qf.awayR16);
    await upsertMatchSlots(client, 'qf', qf.matchNum, homeTeamId, awayTeamId);
  }

  // SF — from finished QF results
  for (const sf of SF_SEEDING) {
    const homeTeamId = await getWinner(client, 'qf', sf.homeQF);
    const awayTeamId = await getWinner(client, 'qf', sf.awayQF);
    await upsertMatchSlots(client, 'sf', sf.matchNum, homeTeamId, awayTeamId);
  }

  // Final — winners of both SF
  const finalHome = await getWinner(client, 'sf', 1);
  const finalAway = await getWinner(client, 'sf', 2);
  await upsertMatchSlots(client, 'final', 1, finalHome, finalAway);

  // 3rd place — losers of both SF
  const thirdHome = await getLoser(client, 'sf', 1);
  const thirdAway = await getLoser(client, 'sf', 2);
  await upsertMatchSlots(client, '3rd', 1, thirdHome, thirdAway);
}
