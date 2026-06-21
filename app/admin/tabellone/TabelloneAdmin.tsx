'use client';

import { useState, useTransition } from 'react';
import { TeamSelect } from '@/components/ui/TeamSelect';
import type { Team, KnockoutSlotWithDetails } from '@/types/tournament';
import type { R16MatchSlot } from '@/db/queries/knockout';
import {
  publishBracketAction,
  unpublishBracketAction,
  saveR16BracketAction,
  type R16SlotInput,
} from './actions';

// R16 matchNum → destination QF matchNum (mirrors QF_SEEDING in lib/bracket.ts)
const R16_TO_QF: Record<number, number> = { 1: 1, 8: 1, 2: 2, 7: 2, 3: 3, 6: 3, 4: 4, 5: 4 };
// One accent color per QF group, shared by the two R16 cards that feed it —
// purely decorative, stands in for a literal connector line.
const QF_GROUP_COLOR: Record<number, string> = {
  1: '#e87425',
  2: '#3b82f6',
  3: '#22c55e',
  4: '#a855f7',
};

function formatLocalInputValue(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

interface FormSlot {
  homeTeamId: number | null;
  awayTeamId: number | null;
  scheduledAtLocal: string;
}

interface R16SlotCardProps {
  matchNum: number;
  match: R16MatchSlot;
  teams: Team[];
  value: FormSlot;
  onChange: (matchNum: number, value: FormSlot) => void;
}

function R16SlotCard({ matchNum, match, teams, value, onChange }: R16SlotCardProps) {
  const locked = match.status !== 'scheduled';
  const color = QF_GROUP_COLOR[R16_TO_QF[matchNum] ?? 1];

  return (
    <div
      className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 space-y-2"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white">Ottavo {matchNum}</p>
        <span className="text-[10px] text-[var(--muted)]">→ Quarto {R16_TO_QF[matchNum]}</span>
      </div>
      {locked && (
        <p className="text-xs text-yellow-400">
          Partita già avviata — non modificabile da qui
        </p>
      )}
      <TeamSelect
        teams={teams}
        value={value.homeTeamId}
        onChange={(teamId) => onChange(matchNum, { ...value, homeTeamId: teamId })}
        placeholder="Squadra in casa"
        disabled={locked}
      />
      <TeamSelect
        teams={teams}
        value={value.awayTeamId}
        onChange={(teamId) => onChange(matchNum, { ...value, awayTeamId: teamId })}
        placeholder="Squadra in trasferta"
        disabled={locked}
      />
      <input
        type="datetime-local"
        value={value.scheduledAtLocal}
        onChange={(e) => onChange(matchNum, { ...value, scheduledAtLocal: e.target.value })}
        disabled={locked}
        className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e87425] disabled:opacity-50 transition-colors"
      />
    </div>
  );
}

function getPair(slots: KnockoutSlotWithDetails[], matchNum: number) {
  return {
    home: slots.find((s) => s.slot_number === matchNum * 2 - 1) ?? null,
    away: slots.find((s) => s.slot_number === matchNum * 2) ?? null,
  };
}

function ReadOnlyNode({
  label,
  home,
  away,
}: {
  label: string;
  home: KnockoutSlotWithDetails | null;
  away: KnockoutSlotWithDetails | null;
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3">
      <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">{label}</p>
      <p className="text-sm text-white truncate">{home?.team?.name ?? 'Da definire'}</p>
      <p className="text-xs text-[var(--muted)] my-1">vs</p>
      <p className="text-sm text-white truncate">{away?.team?.name ?? 'Da definire'}</p>
    </div>
  );
}

interface TabelloneAdminProps {
  teams: Team[];
  r16Matches: R16MatchSlot[];
  qfSlots: KnockoutSlotWithDetails[];
  sfSlots: KnockoutSlotWithDetails[];
  finalSlots: KnockoutSlotWithDetails[];
  thirdSlots: KnockoutSlotWithDetails[];
  initialPublished: boolean;
}

export function TabelloneAdmin({
  teams,
  r16Matches,
  qfSlots,
  sfSlots,
  finalSlots,
  thirdSlots,
  initialPublished,
}: TabelloneAdminProps) {
  const [published, setPublished] = useState(initialPublished);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPendingPublish, startPublish] = useTransition();

  const [formSlots, setFormSlots] = useState<Record<number, FormSlot>>(() => {
    const initial: Record<number, FormSlot> = {};
    for (const m of r16Matches) {
      initial[m.matchNum] = {
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        scheduledAtLocal: formatLocalInputValue(m.scheduledAt),
      };
    }
    return initial;
  });

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPendingSave, startSave] = useTransition();

  function handleSlotChange(matchNum: number, value: FormSlot) {
    setFormSlots((prev) => ({ ...prev, [matchNum]: value }));
  }

  function handlePublishClick() {
    setPublishError(null);
    setShowPublishConfirm(true);
  }

  function handleConfirmPublish() {
    startPublish(async () => {
      const result = await publishBracketAction();
      if (result.kind === 'ok') {
        setPublished(true);
        setShowPublishConfirm(false);
      } else {
        setPublishError(result.message);
        setShowPublishConfirm(false);
      }
    });
  }

  function handleUnpublish() {
    startPublish(async () => {
      const result = await unpublishBracketAction();
      if (result.kind === 'ok') {
        setPublished(false);
      } else {
        setPublishError(result.message);
      }
    });
  }

  function handleSave() {
    setSaveError(null);
    setSaveSuccess(false);
    startSave(async () => {
      const slots: R16SlotInput[] = r16Matches.map((m) => {
        const f = formSlots[m.matchNum];
        return {
          matchNum: m.matchNum,
          homeTeamId: f?.homeTeamId ?? null,
          awayTeamId: f?.awayTeamId ?? null,
          scheduledAt: `${f?.scheduledAtLocal ?? ''}:00+02:00`,
        };
      });
      const result = await saveR16BracketAction(slots);
      if (result.kind === 'ok') {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        setSaveError(result.message);
      }
    });
  }

  const leftMatches = r16Matches.filter((m) => m.matchNum >= 1 && m.matchNum <= 4);
  const rightMatches = r16Matches.filter((m) => m.matchNum >= 5 && m.matchNum <= 8);

  return (
    <div className="space-y-6">
      {/* ─── Publish controls ────────────────────────────────────── */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${published ? 'bg-green-400' : 'bg-[var(--muted)]'}`} />
              {published ? 'Tabellone pubblicato' : 'Tabellone non pubblicato'}
            </p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {published
                ? 'Visibile a tutti su /tabellone.'
                : 'Nascosto al pubblico fino alla pubblicazione.'}
            </p>
          </div>

          {!published && !showPublishConfirm && (
            <button
              type="button"
              onClick={handlePublishClick}
              disabled={isPendingPublish}
              className="bg-[#e87425] hover:bg-[#c55f0a] disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Pubblica tabellone
            </button>
          )}

          {published && (
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={isPendingPublish}
              className="bg-red-900 hover:bg-red-800 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {isPendingPublish ? 'Aggiornamento…' : 'Nascondi tabellone'}
            </button>
          )}
        </div>

        {showPublishConfirm && (
          <div className="mt-3 bg-[#e87425]/10 border border-[#e87425]/30 rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-white">
              Una volta pubblicato il tabellone sarà visibile a tutti. Confermi?
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleConfirmPublish}
                disabled={isPendingPublish}
                className="bg-[#e87425] hover:bg-[#c55f0a] disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                {isPendingPublish ? 'Pubblicazione…' : 'Sì, pubblica'}
              </button>
              <button
                type="button"
                onClick={() => setShowPublishConfirm(false)}
                className="text-xs text-[var(--muted)] hover:text-white transition-colors px-2"
              >
                Annulla
              </button>
            </div>
          </div>
        )}

        {publishError !== null && (
          <p className="mt-2 text-xs text-red-400">{publishError}</p>
        )}
      </div>

      {/* ─── Bracket editor ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_260px] gap-4">
        <div className="space-y-3">
          <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
            Ottavi 1–4
          </p>
          {leftMatches.map((m) => (
            <R16SlotCard
              key={m.matchNum}
              matchNum={m.matchNum}
              match={m}
              teams={teams}
              value={
                formSlots[m.matchNum] ?? {
                  homeTeamId: null,
                  awayTeamId: null,
                  scheduledAtLocal: formatLocalInputValue(m.scheduledAt),
                }
              }
              onChange={handleSlotChange}
            />
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
            Ottavi 5–8
          </p>
          {rightMatches.map((m) => (
            <R16SlotCard
              key={m.matchNum}
              matchNum={m.matchNum}
              match={m}
              teams={teams}
              value={
                formSlots[m.matchNum] ?? {
                  homeTeamId: null,
                  awayTeamId: null,
                  scheduledAtLocal: formatLocalInputValue(m.scheduledAt),
                }
              }
              onChange={handleSlotChange}
            />
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
            Quarti, semifinali, finale
          </p>
          {[1, 2, 3, 4].map((n) => {
            const { home, away } = getPair(qfSlots, n);
            return <ReadOnlyNode key={`qf-${n}`} label={`Quarto ${n}`} home={home} away={away} />;
          })}
          {[1, 2].map((n) => {
            const { home, away } = getPair(sfSlots, n);
            return <ReadOnlyNode key={`sf-${n}`} label={`Semifinale ${n}`} home={home} away={away} />;
          })}
          {(() => {
            const { home, away } = getPair(finalSlots, 1);
            return <ReadOnlyNode label="Finale" home={home} away={away} />;
          })()}
          {(() => {
            const { home, away } = getPair(thirdSlots, 1);
            return <ReadOnlyNode label="Finale 3°/4° posto" home={home} away={away} />;
          })()}
        </div>
      </div>

      {/* ─── Save ────────────────────────────────────────────────── */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          {saveError !== null && <p className="text-xs text-red-400">{saveError}</p>}
          {saveSuccess && <p className="text-xs text-green-400">✓ Tabellone salvato</p>}
          {saveError === null && !saveSuccess && (
            <p className="text-xs text-[var(--muted)]">
              Salva gli ottavi: la pubblicazione resta una scelta separata.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPendingSave}
          className="bg-[#e87425] hover:bg-[#c55f0a] disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors flex-shrink-0"
        >
          {isPendingSave ? 'Salvataggio…' : 'Salva tabellone'}
        </button>
      </div>
    </div>
  );
}
