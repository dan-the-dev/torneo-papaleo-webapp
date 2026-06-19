'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type {
  MatchDetail,
  Player,
  Team,
  MatchEventWithDetails,
} from '@/types/tournament';
import {
  addEventAction,
  removeEventAction,
  saveNotesAction,
  startMatchAction,
  finishMatchAction,
  type AddEventResult,
  type StartMatchActionResult,
} from './actions';

// ─── PlayerRow ────────────────────────────────────────────────────────────────

interface PlayerRowProps {
  player: Player;
  team: Team;
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  onEventAdded: (
    result: AddEventResult & { kind: 'ok' },
    player: Player,
    team: Team,
    minute: number | null,
  ) => void;
}

function PlayerRow({
  player,
  team,
  matchId,
  homeTeamId,
  awayTeamId,
  onEventAdded,
}: PlayerRowProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGoal() {
    if (isPending) return;
    startTransition(async () => {
      const result = await addEventAction(
        matchId,
        player.id,
        team.id,
        null,
        homeTeamId,
        awayTeamId,
      );
      if (result.kind === 'ok') {
        onEventAdded(result, player, team, null);
        setError(null);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="border-b border-[var(--border)]/30 last:border-0">
      <div className="flex items-center gap-2 px-3 py-1">
        <span className="text-xs text-[var(--muted)] w-5 text-right tabular-nums shrink-0">
          {player.number ?? ''}
        </span>
        <span className="flex-1 text-sm text-white truncate min-w-0">
          {player.name}
        </span>
        <button
          type="button"
          onClick={handleGoal}
          disabled={isPending}
          className="flex items-center gap-1.5 min-h-[44px] px-3 text-sm font-semibold text-white hover:opacity-90 active:opacity-75 disabled:opacity-50 rounded-lg transition-opacity shrink-0"
          style={{ backgroundColor: team.color_primary }}
        >
          <span>⚽</span>
          <span>{isPending ? '…' : 'Goal'}</span>
        </button>
      </div>
      {error !== null && (
        <p className="px-3 pb-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

// ─── MatchAnalyst ─────────────────────────────────────────────────────────────

interface ConflictInfo {
  id: number;
  homeName: string;
  awayName: string;
}

interface MatchAnalystProps {
  match: MatchDetail;
  homePlayers: Player[];
  awayPlayers: Player[];
}

export function MatchAnalyst({
  match,
  homePlayers,
  awayPlayers,
}: MatchAnalystProps) {
  const [scoreHome, setScoreHome] = useState(match.score_home ?? 0);
  const [scoreAway, setScoreAway] = useState(match.score_away ?? 0);
  const [events, setEvents] = useState<MatchEventWithDetails[]>(
    match.events.filter((e) => e.type === 'goal'),
  );
  const [status, setStatus] = useState(match.status);
  const [notes, setNotes] = useState(match.notes ?? '');
  const [notesSaved, setNotesSaved] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);

  const [isPendingStart, startStart] = useTransition();
  const [isPendingFinish, startFinish] = useTransition();
  const [isPendingRemove, startRemove] = useTransition();
  const [isPendingNotes, startNotes] = useTransition();

  function handleEventAdded(
    result: AddEventResult & { kind: 'ok' },
    player: Player,
    team: Team,
    minute: number | null,
  ) {
    setScoreHome(result.scoreHome);
    setScoreAway(result.scoreAway);
    const newEvent: MatchEventWithDetails = {
      id: result.eventId,
      match_id: match.id,
      player_id: player.id,
      team_id: team.id,
      type: 'goal',
      minute,
      player,
      team,
    };
    setEvents((prev) => [...prev, newEvent]);
  }

  function handleRemoveEvent(eventId: number) {
    startRemove(async () => {
      const result = await removeEventAction(
        match.id,
        eventId,
        match.team_home_id,
        match.team_away_id,
      );
      if (result.kind === 'ok') {
        setScoreHome(result.scoreHome);
        setScoreAway(result.scoreAway);
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
      }
    });
  }

  function handleStart() {
    setConflictInfo(null);
    setLifecycleError(null);
    startStart(async () => {
      const result: StartMatchActionResult = await startMatchAction(match.id);
      if (result.kind === 'ok') {
        setStatus('live');
      } else if (result.kind === 'conflict') {
        setConflictInfo({
          id: result.conflictId,
          homeName: result.conflictHomeName,
          awayName: result.conflictAwayName,
        });
      } else {
        setLifecycleError(result.message);
      }
    });
  }

  function handleFinish() {
    startFinish(async () => {
      const result = await finishMatchAction(match.id);
      if (result.kind === 'ok') {
        setStatus('finished');
        setShowFinishConfirm(false);
      } else {
        setLifecycleError(result.message);
        setShowFinishConfirm(false);
      }
    });
  }

  function handleSaveNotes() {
    startNotes(async () => {
      const result = await saveNotesAction(match.id, notes);
      if (result.kind === 'ok') {
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
      }
    });
  }

  const sortedEvents = [...events].sort(
    (a, b) => (a.minute ?? 999) - (b.minute ?? 999),
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px_1fr] -mx-4 border-t border-[var(--border)] lg:h-[calc(100vh-8rem)] lg:overflow-hidden">

      {/* ─── Left column: home team (mobile: 2nd) ────────────────── */}
      <div className="flex flex-col min-h-0 order-2 lg:order-1 border-b border-[var(--border)] lg:border-b-0 lg:border-r">
        <div
          className="px-4 py-3 border-b border-[var(--border)] shrink-0 flex items-center gap-2.5 border-l-4"
          style={{
            borderLeftColor: match.team_home.color_primary,
            backgroundColor: `${match.team_home.color_primary}18`,
          }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: match.team_home.color_primary }}
          />
          <h2 className="font-bold text-white text-sm truncate">
            {match.team_home.name}
          </h2>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0">
          {homePlayers.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              team={match.team_home}
              matchId={match.id}
              homeTeamId={match.team_home_id}
              awayTeamId={match.team_away_id}
              onEventAdded={handleEventAdded}
            />
          ))}
        </div>
      </div>

      {/* ─── Center column: controls (mobile: 1st) ───────────────── */}
      <div className="flex flex-col min-h-0 order-1 lg:order-2 border-b border-[var(--border)] lg:border-b-0 lg:border-r">
        {/* Score */}
        <div className="py-8 px-4 text-center border-b border-[var(--border)] shrink-0">
          <div className="text-5xl font-extrabold text-white tabular-nums tracking-tight">
            {scoreHome}
            <span className="text-[var(--muted)] mx-3 font-light">–</span>
            {scoreAway}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-xs font-semibold text-[var(--muted)]">
              {match.team_home.short_name}
            </span>
            <span className="text-[var(--border)]">·</span>
            <span className="text-xs font-semibold text-[var(--muted)]">
              {match.team_away.short_name}
            </span>
          </div>
          <div className="mt-3 h-5 flex items-center justify-center">
            {status === 'live' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e87425] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e87425] animate-pulse" />
                In corso
              </span>
            )}
            {status === 'scheduled' && (
              <span className="text-xs text-[var(--muted)] font-medium">
                In programma
              </span>
            )}
            {status === 'finished' && (
              <span className="text-xs text-[var(--muted)] font-medium">
                Terminata
              </span>
            )}
          </div>
        </div>

        {/* Lifecycle controls */}
        <div className="px-4 py-4 border-b border-[var(--border)] shrink-0 space-y-3">
          {status === 'scheduled' && conflictInfo === null && (
            <button
              type="button"
              onClick={handleStart}
              disabled={isPendingStart}
              className="w-full flex items-center justify-center gap-2 bg-green-800 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              <span className="w-2 h-2 rounded-full bg-white shrink-0" />
              {isPendingStart ? 'Avvio in corso…' : 'Inizia partita'}
            </button>
          )}

          {conflictInfo !== null && (
            <div className="bg-red-950/50 border border-red-800/50 rounded-lg p-3 space-y-1.5">
              <p className="text-sm text-red-300">
                ⚠️{' '}
                <span className="font-semibold">
                  {conflictInfo.homeName} vs {conflictInfo.awayName}
                </span>{' '}
                è già in corso. Terminala prima.
              </p>
              <Link
                href={`/admin/partite/${conflictInfo.id}`}
                className="text-xs text-[#e87425] hover:text-white transition-colors block"
              >
                → Vai a quella partita
              </Link>
            </div>
          )}

          {status === 'live' && !showFinishConfirm && (
            <button
              type="button"
              onClick={() => {
                setShowFinishConfirm(true);
                setLifecycleError(null);
              }}
              className="w-full flex items-center justify-center gap-2 bg-red-900 hover:bg-red-800 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
              Termina partita
            </button>
          )}

          {status === 'live' && showFinishConfirm && (
            <div className="space-y-2.5">
              <p className="text-sm text-white text-center">
                Risultato finale:{' '}
                <span className="font-bold tabular-nums">
                  {scoreHome} – {scoreAway}
                </span>
                . Confermi?
              </p>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={isPendingFinish}
                  className="flex-1 bg-[#e87425] hover:bg-[#c55f0a] disabled:opacity-60 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  {isPendingFinish ? 'Chiusura…' : 'Sì, termina'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFinishConfirm(false)}
                  className="text-sm text-[var(--muted)] hover:text-white transition-colors px-2 shrink-0"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}

          {lifecycleError !== null && (
            <p className="text-xs text-red-400">{lifecycleError}</p>
          )}
        </div>

        {/* Event log */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3">
          <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
            Cronologia
          </h3>
          {sortedEvents.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">Nessun evento registrato</p>
          ) : (
            <div className="space-y-1">
              {sortedEvents.map((event) => {
                const isHome = event.team_id === match.team_home_id;
                const teamColor = event.team?.color_primary ?? '#888';
                return (
                  <div
                    key={event.id}
                    className={`flex items-start gap-2 py-1 px-1 rounded hover:bg-white/5 transition-colors ${isHome ? '' : 'flex-row-reverse'}`}
                  >
                    <div
                      className="w-0.5 self-stretch rounded-full shrink-0 mt-0.5 mb-0.5"
                      style={{ backgroundColor: teamColor }}
                    />
                    <div className={`flex-1 min-w-0 ${isHome ? 'text-left' : 'text-right'}`}>
                      <p className="text-xs text-white font-medium leading-tight truncate">
                        {event.player?.name ?? '—'}
                      </p>
                      <p className="text-xs leading-tight truncate" style={{ color: teamColor }}>
                        {event.team?.name ?? ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvent(event.id)}
                      disabled={isPendingRemove}
                      title="Rimuovi"
                      className="text-[var(--muted)] hover:text-red-400 transition-colors text-xs shrink-0 disabled:opacity-40 disabled:cursor-not-allowed mt-0.5"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="px-4 py-3 border-t border-[var(--border)] shrink-0">
          <label className="block text-xs text-[var(--muted)] mb-1.5">Note</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNotes();
              }}
              placeholder="Note sulla partita…"
              className="flex-1 min-w-0 bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#e87425]"
            />
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={isPendingNotes}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0 disabled:opacity-60 ${
                notesSaved
                  ? 'bg-green-800/30 border-green-600/40 text-green-400'
                  : 'bg-[var(--card)] border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-[#e87425]/50'
              }`}
            >
              {notesSaved ? '✓ Salvato' : isPendingNotes ? '…' : 'Salva'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Right column: away team (mobile: 3rd) ───────────────── */}
      <div className="flex flex-col min-h-0 order-3">
        <div
          className="px-4 py-3 border-b border-[var(--border)] shrink-0 flex items-center gap-2.5 border-l-4"
          style={{
            borderLeftColor: match.team_away.color_primary,
            backgroundColor: `${match.team_away.color_primary}18`,
          }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: match.team_away.color_primary }}
          />
          <h2 className="font-bold text-white text-sm truncate">
            {match.team_away.name}
          </h2>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0">
          {awayPlayers.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              team={match.team_away}
              matchId={match.id}
              homeTeamId={match.team_home_id}
              awayTeamId={match.team_away_id}
              onEventAdded={handleEventAdded}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
