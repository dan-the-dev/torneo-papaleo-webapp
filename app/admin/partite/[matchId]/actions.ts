'use server';

import { requireAdmin } from '@/lib/auth';
import {
  updateMatchResult,
  replaceMatchEvents,
  startMatchInDb,
  finishMatchInDb,
} from '@/db/queries/matches';
import { MATCH_SLOT_MINUTES } from '@/lib/schedule';
import { revalidatePath } from 'next/cache';

interface EventInput {
  player_id: number | null;
  team_id: number;
  type: 'goal' | 'assist' | 'red_card';
  minute: number | null;
}

export async function saveMatchAction(
  matchId: number,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: 'Non autorizzato' };
  }

  const status = formData.get('status');
  if (status !== 'scheduled' && status !== 'live' && status !== 'finished') {
    return { success: false, error: 'Status non valido' };
  }

  const scoreHomeRaw = formData.get('score_home');
  const scoreAwayRaw = formData.get('score_away');
  const notes = formData.get('notes');

  const score_home =
    typeof scoreHomeRaw === 'string' && scoreHomeRaw !== ''
      ? parseInt(scoreHomeRaw, 10)
      : null;
  const score_away =
    typeof scoreAwayRaw === 'string' && scoreAwayRaw !== ''
      ? parseInt(scoreAwayRaw, 10)
      : null;

  const eventsJson = formData.get('events');
  let events: EventInput[] = [];
  if (typeof eventsJson === 'string' && eventsJson) {
    try {
      const parsed: unknown = JSON.parse(eventsJson);
      if (Array.isArray(parsed)) {
        events = parsed.filter(
          (e): e is EventInput =>
            typeof e === 'object' &&
            e !== null &&
            'team_id' in e &&
            'type' in e
        );
      }
    } catch {
      return { success: false, error: 'Formato eventi non valido' };
    }
  }

  try {
    await updateMatchResult(matchId, {
      status,
      score_home: isNaN(score_home ?? NaN) ? null : score_home,
      score_away: isNaN(score_away ?? NaN) ? null : score_away,
      notes: typeof notes === 'string' ? notes || null : null,
    });
    await replaceMatchEvents(matchId, events);
    revalidatePath('/');
    revalidatePath('/gironi');
    revalidatePath(`/gironi/${matchId}`);
    revalidatePath('/marcatori');
    revalidatePath('/tabellone');
    revalidatePath('/calendario');
    revalidatePath('/admin');
    revalidatePath('/admin/partite');
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: 'Errore durante il salvataggio' };
  }
}

// ─── Match lifecycle actions ──────────────────────────────────────────────────

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
  matchId: number
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
    return { kind: 'error', message: 'Errore durante l\'avvio della partita' };
  }
}

export type FinishMatchActionResult =
  | { kind: 'ok' }
  | { kind: 'error'; message: string };

export async function finishMatchAction(
  matchId: number
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
