'use client';

import type { Round } from '@/types/tournament';
import { LoadingLink } from '@/components/navigation/LoadingLink';

const ROUND_LABELS: Record<Round, string> = {
  r16: 'Ottavi',
  qf: 'Quarti',
  sf: 'Semifinali',
  '3rd': 'Fin. 3°',
  final: 'Finale',
  group: 'Girone',
};

export function TabelloneRoundChips({
  rounds,
  selectedRound,
}: {
  rounds: Round[];
  selectedRound: Round;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
      {rounds.map((r) => (
        <LoadingLink
          key={r}
          href={`?round=${r}`}
          showSpinner
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedRound === r
              ? 'bg-[#e87425] text-white'
              : 'bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
        >
          {ROUND_LABELS[r]}
        </LoadingLink>
      ))}
    </div>
  );
}
