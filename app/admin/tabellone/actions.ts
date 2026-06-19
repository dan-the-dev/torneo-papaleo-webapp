'use server';

import { requireAdmin } from '@/lib/auth';
import { generateKnockoutBracket, updateKnockoutSlotTeam } from '@/db/queries/knockout';
import { revalidatePath } from 'next/cache';
import type { Round } from '@/types/tournament';

export async function generateBracketAction(): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await generateKnockoutBracket();
    revalidatePath('/tabellone');
    revalidatePath('/admin/tabellone');
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: 'Errore durante la generazione del tabellone' };
  }
}

export async function updateSlotAction(
  round: Round,
  slotNumber: number,
  teamId: number | null
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await updateKnockoutSlotTeam(round, slotNumber, teamId);
    revalidatePath('/tabellone');
    revalidatePath('/admin/tabellone');
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: 'Errore durante l\'aggiornamento' };
  }
}
