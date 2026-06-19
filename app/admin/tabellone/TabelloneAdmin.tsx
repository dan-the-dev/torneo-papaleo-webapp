'use client';

import { useTransition, useState } from 'react';
import type { KnockoutSlotWithDetails, Round, Team } from '@/types/tournament';
import { generateBracketAction, updateSlotAction } from './actions';

const ROUND_LABELS: Record<Round, string> = {
  r16: 'Ottavi di finale',
  qf: 'Quarti di finale',
  sf: 'Semifinali',
  '3rd': 'Finale 3°/4° posto',
  final: 'Finale',
  group: 'Girone',
};

const DISPLAY_ROUNDS: Round[] = ['r16', 'qf', 'sf', '3rd', 'final'];

export function TabelloneAdmin({
  slots,
  teams,
  groupDone,
}: {
  slots: KnockoutSlotWithDetails[];
  teams: Team[];
  groupDone: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateBracketAction();
      showMessage(result.success ? 'success' : 'error', result.success ? 'Tabellone generato!' : (result.error ?? 'Errore'));
    });
  }

  function handleSlotUpdate(round: Round, slotNumber: number, teamId: number | null) {
    startTransition(async () => {
      const result = await updateSlotAction(round, slotNumber, teamId);
      showMessage(result.success ? 'success' : 'error', result.success ? 'Slot aggiornato' : (result.error ?? 'Errore'));
    });
  }

  const slotsByRound = new Map<Round, KnockoutSlotWithDetails[]>();
  for (const slot of slots) {
    const arr = slotsByRound.get(slot.round) ?? [];
    arr.push(slot);
    slotsByRound.set(slot.round, arr);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Generate button */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-white mb-1">Genera tabellone</h2>
            <p className="text-sm text-[var(--muted)]">
              Popola il tabellone R16 in base alle classifiche dei gironi.
              {!groupDone && (
                <span className="text-yellow-400 ml-1">
                  Attenzione: la fase a gironi non è ancora completata.
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="bg-[#e87425] hover:bg-[#c55f0a] disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm flex-shrink-0"
          >
            {isPending ? 'Generazione...' : 'Genera tabellone'}
          </button>
        </div>
      </div>

      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}

      {/* Slot tables by round */}
      {DISPLAY_ROUNDS.map((round) => {
        const roundSlots = (slotsByRound.get(round) ?? []).sort(
          (a, b) => a.slot_number - b.slot_number
        );
        if (roundSlots.length === 0) return null;

        return (
          <div key={round} className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <h3 className="font-bold text-white">{ROUND_LABELS[round]}</h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {roundSlots.map((slot) => (
                <div key={slot.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 text-xs text-[var(--muted)] font-mono">#{slot.slot_number}</div>
                  <div className="flex-1">
                    {slot.team && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slot.team.color_primary }} />
                        <span className="text-sm font-medium text-white">{slot.team.name}</span>
                      </div>
                    )}
                  </div>
                  <select
                    defaultValue={slot.team_id ?? ''}
                    onChange={(e) =>
                      handleSlotUpdate(
                        round,
                        slot.slot_number,
                        e.target.value ? parseInt(e.target.value, 10) : null
                      )
                    }
                    disabled={isPending}
                    className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#e87425]"
                  >
                    <option value="">— Da definire —</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
