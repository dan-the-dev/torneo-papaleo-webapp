'use server';

import { requireAdmin } from '@/lib/auth';
import { startMatchInDb, finishMatchInDb } from '@/db/queries/matches';
import { MATCH_SLOT_MINUTES } from '@/lib/schedule';
import { revalidatePath } from 'next/cache';
import pool from '@/db/client';

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

    revalidatePath('/');
    revalidatePath('/gironi');
    revalidatePath(`/gironi/${matchId}`);
    revalidatePath('/marcatori');
    revalidatePath(`/admin/partite/${matchId}`);

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

    revalidatePath('/');
    revalidatePath('/gironi');
    revalidatePath('/marcatori');
    revalidatePath(`/admin/partite/${matchId}`);

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
    revalidatePath('/');
    revalidatePath('/admin/partite');
    revalidatePath(`/admin/partite/${matchId}`);
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
    revalidatePath('/');
    revalidatePath('/admin/partite');
    revalidatePath(`/admin/partite/${matchId}`);
    return { kind: 'ok' };
  } catch (err) {
    console.error(err);
    return { kind: 'error', message: 'Errore durante la chiusura della partita' };
  }
}
