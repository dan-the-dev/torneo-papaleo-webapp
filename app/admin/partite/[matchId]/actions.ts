'use server';

import { requireAdmin } from '@/lib/auth';
import { startMatchInDb, finishMatchInDb } from '@/db/queries/matches';
import { MATCH_SLOT_MINUTES } from '@/lib/schedule';
import { syncBracket, hasAnyFinishedGroupMatch } from '@/lib/bracket';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import pool from '@/db/client';

// ─── Bracket sync (off the hot path) ──────────────────────────────────────────
// Goal/removal scoring must feel instant, but the knockout bracket only needs
// to settle within a second or two — so it's synced after the response is
// sent, on its own connection, and skipped entirely while no group match has
// finished yet (the bracket has nothing to recompute at that point).
async function syncBracketInBackground(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (!(await hasAnyFinishedGroupMatch(client))) {
      await client.query('ROLLBACK');
      return;
    }
    await syncBracket(client);
    await client.query('COMMIT');
    revalidatePath('/tabellone');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Background bracket sync failed:', err);
  } finally {
    client.release();
  }
}

// ─── Event actions ────────────────────────────────────────────────────────────

export type AddEventResult =
  | { kind: 'ok'; scoreHome: number; scoreAway: number; eventId: number }
  | { kind: 'error'; message: string };

export async function addEventAction(
  matchId: number,
  playerId: number | null,
  teamId: number,
  minute: number | null,
  homeTeamId: number,
  awayTeamId: number,
): Promise<AddEventResult> {
  try {
    await requireAdmin();
  } catch {
    return { kind: 'error', message: 'Non autorizzato' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: ins } = await client.query<{ id: number }>(
      `INSERT INTO match_events (match_id, player_id, team_id, type, minute)
       VALUES ($1, $2, $3, 'goal', $4) RETURNING id`,
      [matchId, playerId, teamId, minute],
    );
    const eventId = ins[0]?.id;
    if (!eventId) throw new Error('Insert returned no id');

    const { rows: sc } = await client.query<{ home: string; away: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE team_id = $2 AND type = 'goal')::text AS home,
         COUNT(*) FILTER (WHERE team_id = $3 AND type = 'goal')::text AS away
       FROM match_events WHERE match_id = $1`,
      [matchId, homeTeamId, awayTeamId],
    );
    const scoreHome = parseInt(sc[0]?.home ?? '0', 10);
    const scoreAway = parseInt(sc[0]?.away ?? '0', 10);

    await client.query(
      'UPDATE matches SET score_home = $1, score_away = $2 WHERE id = $3',
      [scoreHome, scoreAway, matchId],
    );

    await client.query('COMMIT');

    revalidatePath(`/admin/partite/${matchId}`);
    revalidatePath(`/gironi/${matchId}`);
    revalidatePath('/marcatori');
    after(syncBracketInBackground);

    return { kind: 'ok', scoreHome, scoreAway, eventId };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return { kind: 'error', message: "Errore durante l'inserimento" };
  } finally {
    client.release();
  }
}

export type RemoveEventResult =
  | { kind: 'ok'; scoreHome: number; scoreAway: number }
  | { kind: 'error'; message: string };

export async function removeEventAction(
  matchId: number,
  eventId: number,
  homeTeamId: number,
  awayTeamId: number,
): Promise<RemoveEventResult> {
  try {
    await requireAdmin();
  } catch {
    return { kind: 'error', message: 'Non autorizzato' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'DELETE FROM match_events WHERE id = $1 AND match_id = $2',
      [eventId, matchId],
    );

    const { rows: sc } = await client.query<{ home: string; away: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE team_id = $2 AND type = 'goal')::text AS home,
         COUNT(*) FILTER (WHERE team_id = $3 AND type = 'goal')::text AS away
       FROM match_events WHERE match_id = $1`,
      [matchId, homeTeamId, awayTeamId],
    );
    const scoreHome = parseInt(sc[0]?.home ?? '0', 10);
    const scoreAway = parseInt(sc[0]?.away ?? '0', 10);

    await client.query(
      'UPDATE matches SET score_home = $1, score_away = $2 WHERE id = $3',
      [scoreHome, scoreAway, matchId],
    );

    await client.query('COMMIT');

    revalidatePath(`/admin/partite/${matchId}`);
    revalidatePath(`/gironi/${matchId}`);
    revalidatePath('/marcatori');
    after(syncBracketInBackground);

    return { kind: 'ok', scoreHome, scoreAway };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return { kind: 'error', message: 'Errore durante la rimozione' };
  } finally {
    client.release();
  }
}

export type SaveNotesResult =
  | { kind: 'ok' }
  | { kind: 'error'; message: string };

export async function saveNotesAction(
  matchId: number,
  notes: string,
): Promise<SaveNotesResult> {
  try {
    await requireAdmin();
  } catch {
    return { kind: 'error', message: 'Non autorizzato' };
  }
  try {
    await pool.query('UPDATE matches SET notes = $1 WHERE id = $2', [
      notes || null,
      matchId,
    ]);
    revalidatePath(`/admin/partite/${matchId}`);
    return { kind: 'ok' };
  } catch (err) {
    console.error(err);
    return { kind: 'error', message: 'Errore durante il salvataggio' };
  }
}

// ─── Match lifecycle ──────────────────────────────────────────────────────────

export type StartMatchActionResult =
  | { kind: 'ok' }
  | { kind: 'error'; message: string }
  | {
      kind: 'conflict';
      conflictId: number;
      conflictHomeName: string;
      conflictAwayName: string;
    };

export async function startMatchAction(
  matchId: number,
): Promise<StartMatchActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { kind: 'error', message: 'Non autorizzato' };
  }
  try {
    const result = await startMatchInDb(matchId);
    if (result.conflict) {
      return {
        kind: 'conflict',
        conflictId: result.conflictMatch.id,
        conflictHomeName: result.conflictMatch.team_home.name,
        conflictAwayName: result.conflictMatch.team_away.name,
      };
    }
    revalidatePath('/admin/partite');
    revalidatePath(`/admin/partite/${matchId}`);
    revalidatePath(`/gironi/${matchId}`);
    return { kind: 'ok' };
  } catch (err) {
    console.error(err);
    return { kind: 'error', message: "Errore durante l'avvio della partita" };
  }
}

export type FinishMatchActionResult =
  | { kind: 'ok' }
  | { kind: 'error'; message: string };

export async function finishMatchAction(
  matchId: number,
): Promise<FinishMatchActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { kind: 'error', message: 'Non autorizzato' };
  }
  try {
    await finishMatchInDb(matchId, MATCH_SLOT_MINUTES);
    revalidatePath('/admin/partite');
    revalidatePath(`/admin/partite/${matchId}`);
    revalidatePath(`/gironi/${matchId}`);
    revalidatePath('/marcatori');
    after(syncBracketInBackground);
    return { kind: 'ok' };
  } catch (err) {
    console.error(err);
    return { kind: 'error', message: 'Errore durante la chiusura della partita' };
  }
}

// ─── Roster ───────────────────────────────────────────────────────────────────

const MAX_ROSTER_PLAYERS = 10;

export type AddPlayerResult =
  | {
      kind: 'ok';
      player: { id: number; team_id: number; name: string; number: number | null };
      warning?: string;
    }
  | { kind: 'error'; message: string };

export async function addPlayerAction(
  matchId: number,
  teamId: number,
  name: string,
): Promise<AddPlayerResult> {
  try {
    await requireAdmin();
  } catch {
    return { kind: 'error', message: 'Non autorizzato' };
  }

  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 2) {
    return { kind: 'error', message: 'Inserisci nome e cognome' };
  }

  const client = await pool.connect();
  try {
    const { rows: matchRows } = await client.query<{
      team_home_id: number;
      team_away_id: number;
    }>('SELECT team_home_id, team_away_id FROM matches WHERE id = $1', [matchId]);

    const matchRow = matchRows[0];
    if (!matchRow) {
      return { kind: 'error', message: 'Partita non trovata' };
    }
    if (teamId !== matchRow.team_home_id && teamId !== matchRow.team_away_id) {
      return { kind: 'error', message: 'Squadra non valida per questa partita' };
    }

    const { rowCount: duplicateCount } = await client.query(
      'SELECT 1 FROM players WHERE team_id = $1 AND LOWER(TRIM(name)) = LOWER($2) LIMIT 1',
      [teamId, trimmed],
    );
    if (duplicateCount && duplicateCount > 0) {
      return { kind: 'error', message: 'Questo giocatore è già in rosa' };
    }

    const { rows: countRows } = await client.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM players WHERE team_id = $1',
      [teamId],
    );
    const currentCount = parseInt(countRows[0]?.count ?? '0', 10);

    const { rows: inserted } = await client.query<{
      id: number;
      team_id: number;
      name: string;
      number: number | null;
    }>(
      'INSERT INTO players (team_id, name, number) VALUES ($1, $2, NULL) RETURNING id, team_id, name, number',
      [teamId, trimmed],
    );
    const player = inserted[0];
    if (!player) {
      return { kind: 'error', message: "Errore durante l'inserimento" };
    }

    revalidatePath(`/admin/partite/${matchId}`);

    const warning =
      currentCount >= MAX_ROSTER_PLAYERS
        ? `Rosa oltre il massimo di ${MAX_ROSTER_PLAYERS} giocatori (regolamento: +20 € per ogni extra)`
        : undefined;

    if (warning) {
      return { kind: 'ok', player, warning };
    }
    return { kind: 'ok', player };
  } catch (err) {
    console.error(err);
    return { kind: 'error', message: "Errore durante l'inserimento" };
  } finally {
    client.release();
  }
}
