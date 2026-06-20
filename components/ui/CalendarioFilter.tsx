'use client';

import { useState, useMemo } from 'react';
import { MatchCard } from './MatchCard';
import type { MatchWithTeams, Team } from '@/types/tournament';

interface Day {
  date: string;
  matches: MatchWithTeams[];
}

const ROUND_LABELS: Record<string, string> = {
  group: 'Fase a gironi',
  r16: 'Ottavi di finale',
  qf: 'Quarti di finale',
  sf: 'Semifinali',
  '3rd': 'Finale 3°/4° posto',
  final: 'Finale',
};

function formatDayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="2" y1="2" x2="11" y2="11" />
      <line x1="11" y1="2" x2="2" y2="11" />
    </svg>
  );
}

export function CalendarioFilter({ days, teams }: { days: Day[]; teams: Team[] }) {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => a.name.localeCompare(b.name, 'it')),
    [teams],
  );

  const visibleTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? sortedTeams.filter((t) => t.name.toLowerCase().includes(q)) : sortedTeams;
  }, [sortedTeams, search]);

  const filteredDays = useMemo(() => {
    if (!selectedTeamId) return days;
    return days
      .map(({ date, matches }) => ({
        date,
        matches: matches.filter(
          (m) => m.team_home_id === selectedTeamId || m.team_away_id === selectedTeamId,
        ),
      }))
      .filter(({ matches }) => matches.length > 0);
  }, [days, selectedTeamId]);

  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === selectedTeamId) ?? null,
    [teams, selectedTeamId],
  );

  function toggleTeam(id: number) {
    setSelectedTeamId((prev) => (prev === id ? null : id));
    setSearch('');
  }

  function reset() {
    setSelectedTeamId(null);
    setSearch('');
  }

  return (
    <div>
      {/* ── Filter area ─────────────────────────────────────────── */}
      {selectedTeam ? (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-sm text-[var(--muted)]">Stai vedendo:</span>
          <span className="inline-flex items-center gap-1.5 bg-[#e87425] text-white text-sm font-medium px-3 py-1.5 rounded-full">
            {selectedTeam.name}
            <button
              onClick={reset}
              aria-label="Rimuovi filtro"
              className="opacity-80 hover:opacity-100 transition-opacity"
            >
              <XIcon />
            </button>
          </span>
        </div>
      ) : (
        <div className="mb-6">
          {/* Search input */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Cerca squadra…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2.5 pr-9 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#e87425] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Cancella ricerca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <XIcon />
              </button>
            )}
          </div>

          {/* Team grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {visibleTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => toggleTeam(team.id)}
                className={`px-2 py-2.5 rounded-xl text-xs font-medium text-center leading-tight transition-all active:scale-95 ${
                  selectedTeamId === team.id
                    ? 'bg-[#e87425] text-white scale-[1.03] shadow-sm'
                    : 'bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:border-[#e87425]/50'
                }`}
              >
                {team.name}
              </button>
            ))}
            {visibleTeams.length === 0 && (
              <p className="col-span-2 sm:col-span-4 text-sm text-[var(--muted)] py-1">
                Nessuna squadra trovata.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Match list ──────────────────────────────────────────── */}
      {filteredDays.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <p className="text-base font-medium text-[var(--foreground)] mb-1">Nessuna partita trovata</p>
          <p className="text-sm">Questa squadra non ha partite in calendario.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {filteredDays.map(({ date, matches }) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide capitalize">
                  {formatDayLabel(date)}
                </h2>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>
              <div className="flex flex-col gap-2">
                {matches.map((match) => (
                  <div key={match.id}>
                    <div className="text-xs text-[#e87425] font-medium mb-1 ml-1">
                      {ROUND_LABELS[match.round] ?? match.round}
                    </div>
                    <MatchCard match={match} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
