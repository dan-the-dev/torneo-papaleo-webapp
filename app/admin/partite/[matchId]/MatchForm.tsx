'use client';

import { useState, useTransition } from 'react';
import type { MatchDetail, Player, Team } from '@/types/tournament';
import { saveMatchAction } from './actions';

interface EventRow {
  id: string;
  player_id: number | null;
  team_id: number;
  type: 'goal' | 'assist' | 'red_card';
  minute: string;
}

function genId() {
  return Math.random().toString(36).slice(2);
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  goal: '⚽ Gol',
  assist: '🅰️ Assist',
  red_card: '🟥 Rosso',
};

function EventRowInput({
  row,
  players,
  teams,
  onUpdate,
  onRemove,
}: {
  row: EventRow;
  players: Array<Player & { team: Team }>;
  teams: Team[];
  onUpdate: (updated: EventRow) => void;
  onRemove: () => void;
}) {
  const teamPlayers = players.filter((p) => p.team_id === row.team_id);

  return (
    <div className="flex gap-2 items-center">
      <select
        value={row.team_id}
        onChange={(e) => onUpdate({ ...row, team_id: parseInt(e.target.value, 10), player_id: null })}
        className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#e87425] w-28"
      >
        {teams.map((t) => (
          <option key={t.id} value={t.id}>{t.short_name}</option>
        ))}
      </select>

      <select
        value={row.player_id ?? ''}
        onChange={(e) => onUpdate({ ...row, player_id: e.target.value ? parseInt(e.target.value, 10) : null })}
        className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#e87425] flex-1 min-w-0"
      >
        <option value="">— Giocatore —</option>
        {teamPlayers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.number != null ? `#${p.number} ` : ''}{p.name}
          </option>
        ))}
      </select>

      <select
        value={row.type}
        onChange={(e) => onUpdate({ ...row, type: e.target.value as EventRow['type'] })}
        className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#e87425] w-28"
      >
        {Object.entries(EVENT_TYPE_LABELS).map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>

      <input
        type="number"
        min="1"
        max="99"
        placeholder="min"
        value={row.minute}
        onChange={(e) => onUpdate({ ...row, minute: e.target.value })}
        className="bg-[var(--background)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#e87425] w-16 tabular-nums"
      />

      <button
        type="button"
        onClick={onRemove}
        className="text-[var(--muted)] hover:text-red-400 transition-colors p-1"
      >
        ✕
      </button>
    </div>
  );
}

export function MatchForm({
  match,
  players,
}: {
  match: MatchDetail;
  players: Array<Player & { team: Team }>;
}) {
  const teams = [match.team_home, match.team_away];

  const [status, setStatus] = useState<MatchDetail['status']>(match.status);
  const [scoreHome, setScoreHome] = useState(match.score_home?.toString() ?? '');
  const [scoreAway, setScoreAway] = useState(match.score_away?.toString() ?? '');
  const [notes, setNotes] = useState(match.notes ?? '');
  const [events, setEvents] = useState<EventRow[]>(
    match.events.map((e) => ({
      id: genId(),
      player_id: e.player_id,
      team_id: e.team_id,
      type: e.type,
      minute: e.minute?.toString() ?? '',
    }))
  );
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function addEvent(type: EventRow['type']) {
    setEvents((prev) => [
      ...prev,
      { id: genId(), player_id: null, team_id: match.team_home_id, type, minute: '' },
    ]);
  }

  function updateEvent(id: string, updated: EventRow) {
    setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }

  function removeEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.append('status', status);
    fd.append('score_home', scoreHome);
    fd.append('score_away', scoreAway);
    fd.append('notes', notes);
    fd.append(
      'events',
      JSON.stringify(
        events.map((ev) => ({
          player_id: ev.player_id,
          team_id: ev.team_id,
          type: ev.type,
          minute: ev.minute ? parseInt(ev.minute, 10) : null,
        }))
      )
    );

    startTransition(async () => {
      const result = await saveMatchAction(match.id, fd);
      setMessage(
        result.success
          ? { type: 'success', text: 'Salvato con successo!' }
          : { type: 'error', text: result.error ?? 'Errore sconosciuto' }
      );
      setTimeout(() => setMessage(null), 4000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Risultato */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="font-bold text-white mb-4">Risultato</h2>
        <div className="flex gap-3 items-center mb-4">
          <div className="flex-1">
            <label className="block text-xs text-[var(--muted)] mb-1">{match.team_home.name}</label>
            <input
              type="number"
              min="0"
              value={scoreHome}
              onChange={(e) => setScoreHome(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-lg font-bold text-center text-white focus:outline-none focus:border-[#e87425]"
              placeholder="–"
            />
          </div>
          <div className="text-[var(--muted)] font-bold text-lg mt-5">–</div>
          <div className="flex-1">
            <label className="block text-xs text-[var(--muted)] mb-1">{match.team_away.name}</label>
            <input
              type="number"
              min="0"
              value={scoreAway}
              onChange={(e) => setScoreAway(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-lg font-bold text-center text-white focus:outline-none focus:border-[#e87425]"
              placeholder="–"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[var(--muted)] mb-2">Stato partita</label>
          <div className="flex gap-2">
            {(['scheduled', 'live', 'finished'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  status === s
                    ? 'bg-[#e87425] text-white'
                    : 'bg-[var(--background)] border border-[var(--border)] text-[var(--muted)] hover:text-white'
                }`}
              >
                {s === 'scheduled' ? 'In programma' : s === 'live' ? 'In corso' : 'Terminata'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs text-[var(--muted)] mb-1">Note (opzionale)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e87425]"
            placeholder="Note sulla partita..."
          />
        </div>
      </div>

      {/* Eventi */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">Marcatori / Assist / Espulsioni</h2>
        </div>

        <div className="flex flex-col gap-2 mb-3">
          {events.length === 0 && (
            <p className="text-sm text-[var(--muted)] py-2">Nessun evento registrato</p>
          )}
          {events.map((ev) => (
            <EventRowInput
              key={ev.id}
              row={ev}
              players={players}
              teams={teams}
              onUpdate={(updated) => updateEvent(ev.id, updated)}
              onRemove={() => removeEvent(ev.id)}
            />
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['goal', 'assist', 'red_card'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => addEvent(type)}
              className="bg-[var(--background)] border border-[var(--border)] hover:border-[#e87425]/50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              + {EVENT_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="bg-[#e87425] hover:bg-[#c55f0a] disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
        >
          {isPending ? 'Salvataggio...' : 'Salva partita'}
        </button>
        {message && (
          <p
            className={`text-sm ${
              message.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
