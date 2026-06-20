import type { PoolClient } from 'pg';
import type { Round } from '@/types/tournament';

// ─── Seeding constants ────────────────────────────────────────────────────────
// Regulation: position-based seeding (1st vs 16th, 2nd vs 15th, …)

const R16_SEEDING = [
  { matchNum: 1, homePos:  1, awayPos: 16 },
  { matchNum: 2, homePos:  2, awayPos: 15 },
  { matchNum: 3, homePos:  3, awayPos: 14 },
  { matchNum: 4, homePos:  4, awayPos: 13 },
  { matchNum: 5, homePos:  5, awayPos: 12 },
  { matchNum: 6, homePos:  6, awayPos: 11 },
  { matchNum: 7, homePos:  7, awayPos: 10 },
  { matchNum: 8, homePos:  8, awayPos:  9 },
] as const;

// QF: winner of R16-n vs winner of R16-(9-n)
const QF_SEEDING = [
  { matchNum: 1, homeR16: 1, awayR16: 8 },
  { matchNum: 2, homeR16: 2, awayR16: 7 },
  { matchNum: 3, homeR16: 3, awayR16: 6 },
  { matchNum: 4, homeR16: 4, awayR16: 5 },
] as const;

// SF: winner of QF-1 vs QF-4, winner of QF-2 vs QF-3
const SF_SEEDING = [
  { matchNum: 1, homeQF: 1, awayQF: 4 },
  { matchNum: 2, homeQF: 2, awayQF: 3 },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type KnockoutRound = Exclude<Round, 'group'>;

async function upsertMatchSlots(
  client: PoolClient,
  round: KnockoutRound,
  matchNum: number,
  homeTeamId: number | null,
  awayTeamId: number | null,
  provisional: boolean,
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
    `INSERT INTO knockout_slots (round, slot_number, team_id, match_id, provisional)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (round, slot_number) DO UPDATE
       SET team_id = EXCLUDED.team_id,
           match_id = EXCLUDED.match_id,
           provisional = EXCLUDED.provisional`,
    [round, homeSlot, homeTeamId, match.id, provisional],
  );
  await client.query(
    `INSERT INTO knockout_slots (round, slot_number, team_id, match_id, provisional)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (round, slot_number) DO UPDATE
       SET team_id = EXCLUDED.team_id,
           match_id = EXCLUDED.match_id,
           provisional = EXCLUDED.provisional`,
    [round, awaySlot, awayTeamId, match.id, provisional],
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

// Compute single overall standings across all 16 teams.
// Tiebreaker order (regulation): pts → gd → gf → ga (fewer is better) → sorteggio.
async function computeOverallRankings(client: PoolClient): Promise<number[]> {
  const { rows: teams } = await client.query<{ id: number; name: string }>(
    'SELECT id, name FROM teams ORDER BY id',
  );

  const { rows: matches } = await client.query<{
    team_home_id: number;
    team_away_id: number;
    score_home: number;
    score_away: number;
  }>(
    `SELECT team_home_id, team_away_id, score_home, score_away
     FROM matches
     WHERE round = 'group'
       AND status IN ('finished', 'live')
       AND score_home IS NOT NULL
       AND score_away IS NOT NULL`,
  );

  type Stats = { pts: number; gd: number; gf: number; ga: number; name: string };
  const stats = new Map<number, Stats>();
  for (const { id, name } of teams) {
    stats.set(id, { pts: 0, gd: 0, gf: 0, ga: 0, name });
  }

  for (const m of matches) {
    const home = stats.get(m.team_home_id);
    const away = stats.get(m.team_away_id);
    if (!home || !away) continue;
    home.gf += m.score_home;
    home.ga += m.score_away;
    home.gd += m.score_home - m.score_away;
    away.gf += m.score_away;
    away.ga += m.score_home;
    away.gd += m.score_away - m.score_home;
    if (m.score_home > m.score_away) {
      home.pts += 3;
    } else if (m.score_home === m.score_away) {
      home.pts += 1;
      away.pts += 1;
    } else {
      away.pts += 3;
    }
  }

  const entries = [...stats.entries()];
  entries.sort(([, a], [, b]) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    if (a.ga !== b.ga) return a.ga - b.ga; // fewer goals conceded is better
    return a.name.localeCompare(b.name, 'it'); // stable order before sorteggio
  });

  return entries.map(([id]) => id);
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function syncBracket(client: PoolClient): Promise<void> {
  const { rows: unfinishedRows } = await client.query<{ unfinished: string }>(
    `SELECT COUNT(*)::text AS unfinished
     FROM matches WHERE round = 'group' AND status != 'finished'`,
  );
  const provisional = parseInt(unfinishedRows[0]?.unfinished ?? '0', 10) > 0;

  const rankings = await computeOverallRankings(client);

  // R16 — seeded from overall standings (pos 1 vs 16, pos 2 vs 15, …)
  for (const seed of R16_SEEDING) {
    const homeTeamId = rankings[seed.homePos - 1] ?? null;
    const awayTeamId = rankings[seed.awayPos - 1] ?? null;
    await upsertMatchSlots(client, 'r16', seed.matchNum, homeTeamId, awayTeamId, provisional);
  }

  // QF — from finished R16 results
  for (const qf of QF_SEEDING) {
    const homeTeamId = await getWinner(client, 'r16', qf.homeR16);
    const awayTeamId = await getWinner(client, 'r16', qf.awayR16);
    await upsertMatchSlots(client, 'qf', qf.matchNum, homeTeamId, awayTeamId, false);
  }

  // SF — from finished QF results
  for (const sf of SF_SEEDING) {
    const homeTeamId = await getWinner(client, 'qf', sf.homeQF);
    const awayTeamId = await getWinner(client, 'qf', sf.awayQF);
    await upsertMatchSlots(client, 'sf', sf.matchNum, homeTeamId, awayTeamId, false);
  }

  // Final — winners of both SF
  const finalHome = await getWinner(client, 'sf', 1);
  const finalAway = await getWinner(client, 'sf', 2);
  await upsertMatchSlots(client, 'final', 1, finalHome, finalAway, false);

  // 3rd place — losers of both SF
  const thirdHome = await getLoser(client, 'sf', 1);
  const thirdAway = await getLoser(client, 'sf', 2);
  await upsertMatchSlots(client, '3rd', 1, thirdHome, thirdAway, false);
}
