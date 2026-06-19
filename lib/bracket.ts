import type { PoolClient } from 'pg';
import type { Round } from '@/types/tournament';

// ─── R16 seeding constants ────────────────────────────────────────────────────
// Groups pair as A-C (left half) and B-D (right half)

const R16_SEEDING = [
  // Left half (A-C groups)
  { matchNum: 1, homeGroup: 'A', homePos: 1, awayGroup: 'C', awayPos: 4 },
  { matchNum: 2, homeGroup: 'C', homePos: 1, awayGroup: 'A', awayPos: 4 },
  { matchNum: 3, homeGroup: 'A', homePos: 2, awayGroup: 'C', awayPos: 3 },
  { matchNum: 4, homeGroup: 'C', homePos: 2, awayGroup: 'A', awayPos: 3 },
  // Right half (B-D groups)
  { matchNum: 5, homeGroup: 'B', homePos: 1, awayGroup: 'D', awayPos: 4 },
  { matchNum: 6, homeGroup: 'D', homePos: 1, awayGroup: 'B', awayPos: 4 },
  { matchNum: 7, homeGroup: 'B', homePos: 2, awayGroup: 'D', awayPos: 3 },
  { matchNum: 8, homeGroup: 'D', homePos: 2, awayGroup: 'B', awayPos: 3 },
] as const;

const QF_SEEDING = [
  { matchNum: 1, homeR16: 1, awayR16: 2 },
  { matchNum: 2, homeR16: 3, awayR16: 4 },
  { matchNum: 3, homeR16: 5, awayR16: 6 },
  { matchNum: 4, homeR16: 7, awayR16: 8 },
] as const;

const SF_SEEDING = [
  { matchNum: 1, homeQF: 1, awayQF: 2 },
  { matchNum: 2, homeQF: 3, awayQF: 4 },
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

// Compute group rankings using the transaction client so we see the
// current (uncommitted) match score updates.
async function computeGroupRankings(
  client: PoolClient,
): Promise<Map<string, number[]>> {
  const { rows: teams } = await client.query<{ id: number; group_name: string }>(
    `SELECT t.id, g.name AS group_name
     FROM teams t
     JOIN groups g ON g.id = t.group_id`,
  );

  const { rows: matches } = await client.query<{
    group_name: string;
    team_home_id: number;
    team_away_id: number;
    score_home: number;
    score_away: number;
  }>(
    `SELECT g.name AS group_name, m.team_home_id, m.team_away_id,
            m.score_home, m.score_away
     FROM matches m
     JOIN groups g ON g.id = m.group_id
     WHERE m.round = 'group'
       AND m.status IN ('finished', 'live')
       AND m.score_home IS NOT NULL
       AND m.score_away IS NOT NULL`,
  );

  type Stats = { pts: number; gd: number; gf: number };
  const groupStats = new Map<string, Map<number, Stats>>();
  for (const { id, group_name } of teams) {
    if (!groupStats.has(group_name)) groupStats.set(group_name, new Map());
    groupStats.get(group_name)!.set(id, { pts: 0, gd: 0, gf: 0 });
  }

  type Mtch = (typeof matches)[number];
  const matchesByGroup = new Map<string, Mtch[]>();
  for (const m of matches) {
    const arr = matchesByGroup.get(m.group_name) ?? [];
    arr.push(m);
    matchesByGroup.set(m.group_name, arr);
  }

  for (const m of matches) {
    const home = groupStats.get(m.group_name)?.get(m.team_home_id);
    const away = groupStats.get(m.group_name)?.get(m.team_away_id);
    if (!home || !away) continue;
    const sh = m.score_home;
    const sa = m.score_away;
    home.gf += sh;
    home.gd += sh - sa;
    away.gf += sa;
    away.gd += sa - sh;
    if (sh > sa) {
      home.pts += 3;
    } else if (sh === sa) {
      home.pts += 1;
      away.pts += 1;
    } else {
      away.pts += 3;
    }
  }

  const result = new Map<string, number[]>();
  for (const [gName, stats] of groupStats) {
    const groupMatches = matchesByGroup.get(gName) ?? [];
    const entries = [...stats.entries()];
    entries.sort(([aId, aS], [bId, bS]) => {
      if (bS.pts !== aS.pts) return bS.pts - aS.pts;

      // Head-to-head tiebreaker
      const h2h = groupMatches.filter(
        (m) =>
          (m.team_home_id === aId && m.team_away_id === bId) ||
          (m.team_home_id === bId && m.team_away_id === aId),
      );
      let ptA = 0;
      let ptB = 0;
      let gdA = 0;
      for (const m of h2h) {
        const sh = m.score_home;
        const sa = m.score_away;
        if (m.team_home_id === aId) {
          if (sh > sa) ptA += 3;
          else if (sh === sa) { ptA++; ptB++; }
          else ptB += 3;
          gdA += sh - sa;
        } else {
          if (sa > sh) ptA += 3;
          else if (sh === sa) { ptA++; ptB++; }
          else ptB += 3;
          gdA += sa - sh;
        }
      }
      if (ptB !== ptA) return ptB - ptA;
      if (gdA !== 0) return gdA > 0 ? -1 : 1;

      if (bS.gd !== aS.gd) return bS.gd - aS.gd;
      return bS.gf - aS.gf;
    });
    result.set(gName, entries.map(([id]) => id));
  }

  return result;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function syncBracket(client: PoolClient): Promise<void> {
  // Group stage status
  const { rows: unfinishedRows } = await client.query<{ unfinished: string }>(
    `SELECT COUNT(*)::text AS unfinished
     FROM matches WHERE round = 'group' AND status != 'finished'`,
  );
  const provisional = parseInt(unfinishedRows[0]?.unfinished ?? '0', 10) > 0;

  // Group standings (uses same transaction client to see uncommitted scores)
  const standings = await computeGroupRankings(client);

  // R16 — from group standings
  for (const seed of R16_SEEDING) {
    const homeTeamId = standings.get(seed.homeGroup)?.[seed.homePos - 1] ?? null;
    const awayTeamId = standings.get(seed.awayGroup)?.[seed.awayPos - 1] ?? null;
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
