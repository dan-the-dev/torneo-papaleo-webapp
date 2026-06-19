import pool from '../client';
import type {
  Match,
  MatchWithTeams,
  MatchDetail,
  MatchEventWithDetails,
  Round,
} from '@/types/tournament';
import { computeScheduleShift } from '@/lib/schedule';

interface RawMatchRow {
  id: number;
  group_id: number | null;
  round: Round;
  match_number: number;
  scheduled_at: Date;
  team_home_id: number;
  team_away_id: number;
  status: 'scheduled' | 'live' | 'finished';
  score_home: number | null;
  score_away: number | null;
  notes: string | null;
  current_minute: number | null;
  started_at: Date | null;
  finished_at: Date | null;
  team_home: Record<string, unknown>;
  team_away: Record<string, unknown>;
}

function rowToMatchWithTeams(row: RawMatchRow): MatchWithTeams {
  return {
    id: row.id,
    group_id: row.group_id,
    round: row.round,
    match_number: row.match_number,
    scheduled_at: row.scheduled_at,
    team_home_id: row.team_home_id,
    team_away_id: row.team_away_id,
    status: row.status,
    score_home: row.score_home,
    score_away: row.score_away,
    notes: row.notes,
    current_minute: row.current_minute,
    started_at: row.started_at,
    finished_at: row.finished_at,
    team_home: row.team_home as unknown as MatchWithTeams['team_home'],
    team_away: row.team_away as unknown as MatchWithTeams['team_away'],
  };
}

const TEAMS_JOIN = `
  JOIN teams th ON m.team_home_id = th.id
  JOIN teams ta ON m.team_away_id = ta.id`;

const TEAMS_SELECT = `m.*, row_to_json(th) AS team_home, row_to_json(ta) AS team_away`;

export async function getLiveMatches(): Promise<MatchWithTeams[]> {
  const { rows } = await pool.query<RawMatchRow>(
    `SELECT ${TEAMS_SELECT} FROM matches m${TEAMS_JOIN}
     WHERE m.status = 'live'
     ORDER BY m.scheduled_at`
  );
  return rows.map(rowToMatchWithTeams);
}

export async function getNextScheduledMatch(): Promise<MatchWithTeams | null> {
  const { rows } = await pool.query<RawMatchRow>(
    `SELECT ${TEAMS_SELECT} FROM matches m${TEAMS_JOIN}
     WHERE m.status = 'scheduled'
     ORDER BY m.scheduled_at
     LIMIT 1`
  );
  return rows[0] ? rowToMatchWithTeams(rows[0]) : null;
}

export async function getMatchesToday(): Promise<MatchWithTeams[]> {
  const { rows } = await pool.query<RawMatchRow>(
    `SELECT ${TEAMS_SELECT} FROM matches m${TEAMS_JOIN}
     WHERE DATE(m.scheduled_at AT TIME ZONE 'Europe/Rome') = CURRENT_DATE AT TIME ZONE 'Europe/Rome'
     ORDER BY m.scheduled_at`
  );
  return rows.map(rowToMatchWithTeams);
}

export async function getNextScheduledDay(): Promise<Date | null> {
  const { rows } = await pool.query<{ day: Date }>(
    `SELECT DATE(scheduled_at AT TIME ZONE 'Europe/Rome') AS day
     FROM matches
     WHERE DATE(scheduled_at AT TIME ZONE 'Europe/Rome') > CURRENT_DATE AT TIME ZONE 'Europe/Rome'
     ORDER BY scheduled_at
     LIMIT 1`
  );
  return rows[0]?.day ?? null;
}

export async function getMatchesByDate(date: Date): Promise<MatchWithTeams[]> {
  const { rows } = await pool.query<RawMatchRow>(
    `SELECT ${TEAMS_SELECT} FROM matches m${TEAMS_JOIN}
     WHERE DATE(m.scheduled_at AT TIME ZONE 'Europe/Rome') = DATE($1 AT TIME ZONE 'Europe/Rome')
     ORDER BY m.scheduled_at`,
    [date]
  );
  return rows.map(rowToMatchWithTeams);
}

export async function getAllMatchesGroupedByDay(): Promise<
  Array<{ date: string; matches: MatchWithTeams[] }>
> {
  const { rows } = await pool.query<RawMatchRow>(
    `SELECT ${TEAMS_SELECT} FROM matches m${TEAMS_JOIN}
     ORDER BY m.scheduled_at, m.match_number`
  );

  const byDay = new Map<string, MatchWithTeams[]>();
  for (const row of rows) {
    const match = rowToMatchWithTeams(row);
    const day = new Date(match.scheduled_at)
      .toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' })
      .split('/')
      .reverse()
      .join('-');
    const existing = byDay.get(day) ?? [];
    existing.push(match);
    byDay.set(day, existing);
  }

  return Array.from(byDay.entries()).map(([date, matches]) => ({ date, matches }));
}

export async function getMatchById(id: number): Promise<MatchDetail | null> {
  const { rows } = await pool.query<RawMatchRow>(
    `SELECT ${TEAMS_SELECT} FROM matches m${TEAMS_JOIN} WHERE m.id = $1`,
    [id]
  );
  if (!rows[0]) return null;

  const match = rowToMatchWithTeams(rows[0]);

  interface RawEventRow {
    id: number;
    match_id: number;
    player_id: number | null;
    team_id: number;
    type: 'goal' | 'assist' | 'red_card';
    minute: number | null;
    player: Record<string, unknown> | null;
    team: Record<string, unknown>;
  }

  const { rows: eventRows } = await pool.query<RawEventRow>(
    `SELECT me.*,
       row_to_json(p) AS player,
       row_to_json(t) AS team
     FROM match_events me
     LEFT JOIN players p ON me.player_id = p.id
     JOIN teams t ON me.team_id = t.id
     WHERE me.match_id = $1
     ORDER BY me.minute NULLS LAST, me.id`,
    [id]
  );

  const events: MatchEventWithDetails[] = eventRows.map((r) => ({
    id: r.id,
    match_id: r.match_id,
    player_id: r.player_id,
    team_id: r.team_id,
    type: r.type,
    minute: r.minute,
    player: r.player as unknown as MatchEventWithDetails['player'],
    team: r.team as unknown as MatchEventWithDetails['team'],
  }));

  return { ...match, events };
}

export async function getAllMatchesAdmin(): Promise<MatchWithTeams[]> {
  const { rows } = await pool.query<RawMatchRow>(
    `SELECT ${TEAMS_SELECT} FROM matches m${TEAMS_JOIN}
     ORDER BY m.scheduled_at, m.match_number`
  );
  return rows.map(rowToMatchWithTeams);
}

export async function updateMatchResult(
  id: number,
  data: {
    status: Match['status'];
    score_home: number | null;
    score_away: number | null;
    notes?: string | null;
  }
): Promise<void> {
  await pool.query(
    `UPDATE matches SET status = $1, score_home = $2, score_away = $3, notes = $4
     WHERE id = $5`,
    [data.status, data.score_home, data.score_away, data.notes ?? null, id]
  );
}

export async function replaceMatchEvents(
  matchId: number,
  events: Array<{
    player_id: number | null;
    team_id: number;
    type: 'goal' | 'assist' | 'red_card';
    minute: number | null;
  }>
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM match_events WHERE match_id = $1', [matchId]);
    for (const ev of events) {
      await client.query(
        'INSERT INTO match_events (match_id, player_id, team_id, type, minute) VALUES ($1,$2,$3,$4,$5)',
        [matchId, ev.player_id, ev.team_id, ev.type, ev.minute]
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

// ─── Match lifecycle ──────────────────────────────────────────────────────────

type StartMatchResult =
  | { conflict: false }
  | { conflict: true; conflictMatch: MatchWithTeams };

export async function startMatchInDb(id: number): Promise<StartMatchResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check for a conflicting live match (needs teams for display)
    const { rows: liveRows } = await client.query<RawMatchRow>(
      `SELECT ${TEAMS_SELECT} FROM matches m${TEAMS_JOIN}
       WHERE m.status = 'live' AND m.id != $1
       LIMIT 1`,
      [id]
    );
    if (liveRows[0]) {
      await client.query('ROLLBACK');
      return { conflict: true, conflictMatch: rowToMatchWithTeams(liveRows[0]) };
    }

    // Get this match's original scheduled_at
    const { rows: matchRows } = await client.query<{ scheduled_at: Date }>(
      'SELECT scheduled_at FROM matches WHERE id = $1',
      [id]
    );
    const original = matchRows[0];
    if (!original) {
      await client.query('ROLLBACK');
      throw new Error(`Match ${id} not found`);
    }

    const now = new Date();
    await client.query(
      "UPDATE matches SET status = 'live', started_at = $1 WHERE id = $2",
      [now, id]
    );

    const delta = computeScheduleShift(original.scheduled_at, now);
    if (delta !== 0) {
      await client.query(
        `UPDATE matches
         SET scheduled_at = scheduled_at + ($1 || ' minutes')::interval
         WHERE status = 'scheduled'
           AND DATE(scheduled_at AT TIME ZONE 'Europe/Rome') = DATE($2 AT TIME ZONE 'Europe/Rome')
           AND scheduled_at > $2`,
        [delta, now]
      );
    }

    await client.query('COMMIT');
    return { conflict: false };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function finishMatchInDb(id: number, slotMinutes: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: matchRows } = await client.query<{
      started_at: Date | null;
      scheduled_at: Date;
    }>('SELECT started_at, scheduled_at FROM matches WHERE id = $1', [id]);
    const m = matchRows[0];
    if (!m) throw new Error(`Match ${id} not found`);

    const now = new Date();
    await client.query(
      "UPDATE matches SET status = 'finished', finished_at = $1 WHERE id = $2",
      [now, id]
    );

    // Delta = how much longer/shorter than planned slot
    const startedAt = m.started_at ?? m.scheduled_at;
    const actualMinutes = (now.getTime() - startedAt.getTime()) / 60000;
    const delta = Math.round(actualMinutes - slotMinutes);

    if (delta !== 0) {
      await client.query(
        `UPDATE matches
         SET scheduled_at = scheduled_at + ($1 || ' minutes')::interval
         WHERE status = 'scheduled'
           AND DATE(scheduled_at AT TIME ZONE 'Europe/Rome') = DATE($2 AT TIME ZONE 'Europe/Rome')`,
        [delta, now]
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

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<{
  total: number;
  finished: number;
  live: number;
  nextMatch: MatchWithTeams | null;
}> {
  const { rows: counts } = await pool.query<{
    total: string;
    finished: string;
    live: string;
  }>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE status = 'finished')::text AS finished,
       COUNT(*) FILTER (WHERE status = 'live')::text AS live
     FROM matches`
  );
  const c = counts[0] ?? { total: '0', finished: '0', live: '0' };

  const { rows: nextRows } = await pool.query<RawMatchRow>(
    `SELECT ${TEAMS_SELECT} FROM matches m${TEAMS_JOIN}
     WHERE m.status = 'scheduled'
     ORDER BY m.scheduled_at
     LIMIT 1`
  );

  return {
    total: parseInt(c.total, 10),
    finished: parseInt(c.finished, 10),
    live: parseInt(c.live, 10),
    nextMatch: nextRows[0] ? rowToMatchWithTeams(nextRows[0]) : null,
  };
}
