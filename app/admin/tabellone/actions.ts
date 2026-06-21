'use server';

import { requireAdmin } from '@/lib/auth';
import { setBracketPublished } from '@/db/queries/config';
import { saveManualR16Slot } from '@/lib/bracket';
import { revalidatePath } from 'next/cache';
import pool from '@/db/client';

// ─── Publish toggle ───────────────────────────────────────────────────────────

export type SetPublishedResult =
  | { kind: 'ok'; published: boolean }
  | { kind: 'error'; message: string };

async function setPublished(published: boolean): Promise<SetPublishedResult> {
  try {
    await requireAdmin();
  } catch {
    return { kind: 'error', message: 'Non autorizzato' };
  }
  try {
    await setBracketPublished(published);
    revalidatePath('/tabellone');
    revalidatePath('/admin/tabellone');
    return { kind: 'ok', published };
  } catch (err) {
    console.error(err);
    return { kind: 'error', message: 'Errore durante l\'aggiornamento' };
  }
}

export async function publishBracketAction(): Promise<SetPublishedResult> {
  return setPublished(true);
}

export async function unpublishBracketAction(): Promise<SetPublishedResult> {
  return setPublished(false);
}

// ─── R16 bracket save ─────────────────────────────────────────────────────────

export interface R16SlotInput {
  matchNum: number;
  homeTeamId: number | null;
  awayTeamId: number | null;
}

export type SaveR16BracketResult =
  | { kind: 'ok' }
  | { kind: 'error'; message: string };

export async function saveR16BracketAction(
  slots: R16SlotInput[],
): Promise<SaveR16BracketResult> {
  try {
    await requireAdmin();
  } catch {
    return { kind: 'error', message: 'Non autorizzato' };
  }

  // Validate: no team in more than one R16 slot.
  const seen = new Map<number, number>();
  for (const slot of slots) {
    for (const teamId of [slot.homeTeamId, slot.awayTeamId]) {
      if (teamId === null) continue;
      seen.set(teamId, (seen.get(teamId) ?? 0) + 1);
    }
  }
  const duplicateIds = [...seen.entries()].filter(([, count]) => count > 1).map(([id]) => id);
  if (duplicateIds.length > 0) {
    const { rows } = await pool.query<{ name: string }>(
      'SELECT name FROM teams WHERE id = ANY($1) ORDER BY name',
      [duplicateIds],
    );
    const names = rows.map((r) => r.name).join(', ');
    return {
      kind: 'error',
      message: `Squadra assegnata a più di un ottavo: ${names}`,
    };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const slot of slots) {
      await saveManualR16Slot(client, slot.matchNum, slot.homeTeamId, slot.awayTeamId);
    }
    await client.query('COMMIT');

    revalidatePath('/admin/tabellone');
    revalidatePath('/tabellone');

    return { kind: 'ok' };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return { kind: 'error', message: 'Errore durante il salvataggio del tabellone' };
  } finally {
    client.release();
  }
}
