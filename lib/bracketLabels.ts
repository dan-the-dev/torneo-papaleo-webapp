import { QF_SEEDING, SF_SEEDING } from './bracket';
import type { Round } from '@/types/tournament';

// Display-only placeholder for an unpopulated QF/SF/Final/3rd slot, derived
// from the same seeding tables syncBracket() uses — never shown once
// team_id is set, callers should fall back to the real team name first.
export function getKnockoutPlaceholderLabel(round: Round, slotNumber: number): string | null {
  const isHome = slotNumber % 2 === 1;
  const matchNum = isHome ? (slotNumber + 1) / 2 : slotNumber / 2;

  if (round === 'qf') {
    const seed = QF_SEEDING.find((s) => s.matchNum === matchNum);
    if (!seed) return null;
    return isHome ? `Vinc. Ottavo ${seed.homeR16}` : `Vinc. Ottavo ${seed.awayR16}`;
  }
  if (round === 'sf') {
    const seed = SF_SEEDING.find((s) => s.matchNum === matchNum);
    if (!seed) return null;
    return isHome ? `Vinc. Quarto ${seed.homeQF}` : `Vinc. Quarto ${seed.awayQF}`;
  }
  if (round === 'final') {
    return isHome ? 'Vinc. Semifinale 1' : 'Vinc. Semifinale 2';
  }
  if (round === '3rd') {
    return isHome ? 'Perd. Semifinale 1' : 'Perd. Semifinale 2';
  }
  return null;
}
