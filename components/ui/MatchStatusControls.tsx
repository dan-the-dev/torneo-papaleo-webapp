'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { MatchStatus } from '@/types/tournament';
import {
  startMatchAction,
  finishMatchAction,
  type StartMatchActionResult,
} from '@/app/admin/partite/[matchId]/actions';

interface ConflictInfo {
  id: number;
  homeName: string;
  awayName: string;
}

interface Props {
  matchId: number;
  status: MatchStatus;
}

export function MatchStatusControls({ matchId, status }: Props) {
  const router = useRouter();
  const [conflict, setConflict] = useState<ConflictInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPendingStart, startStart] = useTransition();
  const [isPendingFinish, startFinish] = useTransition();

  if (status !== 'scheduled' && status !== 'live') return null;

  function handleStart() {
    setError(null);
    startStart(async () => {
      const result: StartMatchActionResult = await startMatchAction(matchId);
      if (result.kind === 'ok') {
        router.refresh();
      } else if (result.kind === 'conflict') {
        setConflict({
          id: result.conflictId,
          homeName: result.conflictHomeName,
          awayName: result.conflictAwayName,
        });
      } else {
        setError(result.message);
      }
    });
  }

  function handleFinish() {
    setError(null);
    startFinish(async () => {
      const result = await finishMatchAction(matchId);
      if (result.kind === 'ok') {
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <h2 className="font-bold text-white mb-4">Stato partita</h2>

        <div className="flex items-center gap-3 flex-wrap">
          {status === 'scheduled' && (
            <button
              onClick={handleStart}
              disabled={isPendingStart}
              className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-white" />
              {isPendingStart ? 'Avvio...' : 'Inizia partita'}
            </button>
          )}

          {status === 'live' && (
            <button
              onClick={handleFinish}
              disabled={isPendingFinish}
              className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {isPendingFinish ? 'Chiusura...' : 'Termina partita'}
            </button>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </div>

      {/* ─── Conflict modal ────────────────────────────────────────── */}
      {conflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-white text-lg mb-2">Partita già in corso</h3>
            <p className="text-sm text-[var(--muted)] mb-5">
              C&apos;è già una partita in corso:{' '}
              <span className="text-white font-medium">
                {conflict.homeName} vs {conflict.awayName}
              </span>
              . Terminala prima di iniziarne un&apos;altra.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setConflict(null);
                  router.push(`/admin/partite/${conflict.id}`);
                }}
                className="flex-1 bg-[#e87425] hover:bg-[#c55f0a] text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Vai a quella partita
              </button>
              <button
                onClick={() => setConflict(null)}
                className="px-4 py-2 rounded-lg text-sm text-[var(--muted)] hover:text-white border border-[var(--border)] transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
