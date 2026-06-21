'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import type { Team } from '@/types/tournament';

interface TeamSelectProps {
  teams: Team[];
  value: number | null;
  onChange: (teamId: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TeamSelect({ teams, value, onChange, placeholder, disabled }: TeamSelectProps) {
  const selectedTeam = teams.find((t) => t.id === value) ?? null;
  const [inputValue, setInputValue] = useState(selectedTeam?.name ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Keep the input text in sync if `value` changes from outside (e.g. reset).
  useEffect(() => {
    setInputValue(selectedTeam?.name ?? '');
  }, [selectedTeam]);

  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => a.name.localeCompare(b.name, 'it')),
    [teams],
  );

  const suggestions = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q || q === selectedTeam?.name.toLowerCase()) return sortedTeams;
    return sortedTeams.filter((t) => t.name.toLowerCase().includes(q));
  }, [sortedTeams, inputValue, selectedTeam]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        setInputValue(selectedTeam?.name ?? '');
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [selectedTeam]);

  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  function pick(team: Team | null) {
    onChange(team?.id ?? null);
    setInputValue(team?.name ?? '');
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
      setInputValue(selectedTeam?.name ?? '');
      return;
    }
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
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
      if (team) pick(team);
    }
  }

  const dropdownOpen = isOpen && !disabled;

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={dropdownOpen}
        aria-autocomplete="list"
        disabled={disabled}
        placeholder={placeholder ?? 'Cerca squadra…'}
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white placeholder-[var(--muted)] focus:outline-none focus:border-[#e87425] disabled:opacity-50 transition-colors"
      />
      {dropdownOpen && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-20 mt-1 w-full bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto py-1"
        >
          <li
            role="option"
            aria-selected={value === null}
            onMouseDown={(e) => { e.preventDefault(); pick(null); }}
            className="px-3 py-2 text-xs italic cursor-pointer text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-white transition-colors"
          >
            — Nessuna squadra —
          </li>
          {suggestions.map((team, i) => {
            const active = i === highlightedIndex;
            return (
              <li
                key={team.id}
                role="option"
                aria-selected={active}
                onMouseDown={(e) => { e.preventDefault(); pick(team); }}
                onMouseEnter={() => setHighlightedIndex(i)}
                className={`px-3 py-2 text-sm cursor-pointer border-l-2 transition-colors ${
                  active
                    ? 'border-[#e87425] bg-[#e87425]/10 text-white'
                    : 'border-transparent text-[var(--muted)] hover:text-white hover:bg-[var(--surface-hover)]'
                }`}
              >
                {team.name}
              </li>
            );
          })}
          {suggestions.length === 0 && (
            <li className="px-3 py-2 text-xs text-[var(--muted)]">Nessun risultato</li>
          )}
        </ul>
      )}
    </div>
  );
}
