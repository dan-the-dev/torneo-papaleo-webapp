'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
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
  const [inputValue, setInputValue]           = useState('');
  const [selectedTeam, setSelectedTeam]       = useState<Team | null>(null);
  const [isOpen, setIsOpen]                   = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const listRef      = useRef<HTMLUListElement>(null);

  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => a.name.localeCompare(b.name, 'it')),
    [teams],
  );

  // Suggestions: show all when query empty, filtered otherwise.
  const suggestions = useMemo(() => {
    if (selectedTeam) return [];
    const q = inputValue.trim().toLowerCase();
    return q
      ? sortedTeams.filter((t) => t.name.toLowerCase().includes(q))
      : sortedTeams;
  }, [sortedTeams, inputValue, selectedTeam]);

  const filteredDays = useMemo(() => {
    if (!selectedTeam) return days;
    return days
      .map(({ date, matches }) => ({
        date,
        matches: matches.filter(
          (m) => m.team_home_id === selectedTeam.id || m.team_away_id === selectedTeam.id,
        ),
      }))
      .filter(({ matches }) => matches.length > 0);
  }, [days, selectedTeam]);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // Scroll highlighted suggestion into view
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  function selectTeam(team: Team) {
    setSelectedTeam(team);
    setInputValue(team.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function clearFilter() {
    setSelectedTeam(null);
    setInputValue('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedTeam(null);
    setInputValue(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  }

  function handleFocus() {
    if (selectedTeam) {
      // Let user type over current selection to search again
      inputRef.current?.select();
    } else {
      setIsOpen(true);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }
    if (!isOpen) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setIsOpen(true); setHighlightedIndex(0); }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const team = suggestions[highlightedIndex];
      if (team) selectTeam(team);
    }
  }

  const showClear = selectedTeam !== null || inputValue !== '';
  const dropdownOpen = isOpen && suggestions.length > 0;

  return (
    <div>
      {/* ── Combobox ────────────────────────────────────────────── */}
      <div ref={containerRef} className="relative mb-6">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={dropdownOpen}
            aria-autocomplete="list"
            aria-controls="team-listbox"
            aria-activedescendant={highlightedIndex >= 0 ? `team-opt-${highlightedIndex}` : undefined}
            placeholder="Cerca squadra…"
            value={inputValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            className={`w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#e87425] transition-colors ${showClear ? 'pr-9' : ''}`}
          />
          {showClear && (
            <button
              onMouseDown={(e) => { e.preventDefault(); clearFilter(); }}
              aria-label="Cancella filtro"
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <XIcon />
            </button>
          )}
        </div>

        {dropdownOpen && (
          <ul
            ref={listRef}
            id="team-listbox"
            role="listbox"
            className="absolute z-20 mt-1 w-full bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg max-h-52 overflow-y-auto py-1"
          >
            {suggestions.map((team, i) => {
              const active = i === highlightedIndex;
              return (
                <li
                  key={team.id}
                  id={`team-opt-${i}`}
                  role="option"
                  aria-selected={active}
                  onMouseDown={(e) => { e.preventDefault(); selectTeam(team); }}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  className={`px-4 py-2.5 text-sm cursor-pointer border-l-2 transition-colors ${
                    active
                      ? 'border-[#e87425] bg-[#e87425]/10 text-[var(--foreground)]'
                      : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  {team.name}
                </li>
              );
            })}
          </ul>
        )}
      </div>

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
