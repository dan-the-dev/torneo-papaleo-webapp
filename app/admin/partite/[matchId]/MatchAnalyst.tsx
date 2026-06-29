'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { LoadingLink } from '@/components/navigation/LoadingLink';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { Spinner } from '@/components/ui/Spinner';
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
  addPlayerAction,
  type AddEventResult,
  type StartMatchActionResult,
} from './actions';

const MAX_ROSTER = 10;

// ─── AddPlayerForm ────────────────────────────────────────────────────────────

function AddPlayerForm({
  team,
  matchId,
  onAdded,
}: {
  team: Team;
  matchId: number;
  onAdded: (player: Player, warning?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setName('');
    setError(null);
  }

  function handleSubmit() {
    if (isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await addPlayerAction(matchId, team.id, name);
      if (result.kind === 'ok') {
        onAdded(result.player, result.warning);
        close();
      } else {
        setError(result.message);
      }
    });
  }

  if (!open) {
    return (
      <div className="p-3 border-t border-dashed border-[var(--border)] shrink-0">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-lg border border-dashed border-[var(--border)] text-sm font-medium text-[var(--muted)] hover:text-white hover:border-[#e87425]/50 hover:bg-[#e87425]/5 transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Aggiungi giocatore
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-dashed border-[#e87425]/40 bg-[#e87425]/5 shrink-0 space-y-2">
      <p className="text-xs font-medium text-white">Giocatore mancante in lista</p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') close();
        }}
        autoFocus
        placeholder="Nome e cognome"
        className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[var(--muted)] focus:outline-none focus:border-[#e87425]"
      />
      {error !== null && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <LoadingButton
          type="button"
          onClick={handleSubmit}
          loading={isPending}
          loadingText="Aggiungo…"
          className="flex-1 bg-[#e87425] hover:bg-[#c55f0a] text-white font-semibold py-2 rounded-lg text-sm transition-colors"
        >
          Aggiungi in rosa
        </LoadingButton>
        <button
          type="button"
          onClick={close}
          disabled={isPending}
          className="text-sm text-[var(--muted)] hover:text-white transition-colors px-2 shrink-0 disabled:opacity-50"
        >
          Annulla
        </button>
      </div>
    </div>
  );
}

// ─── TeamRoster ───────────────────────────────────────────────────────────────

function TeamRoster({
  team,
  players,
  matchId,
  homeTeamId,
  awayTeamId,
  isHome,
  onPlayersChange,
  onGoalStart,
  onEventAdded,
}: {
  team: Team;
  players: Player[];
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  isHome: boolean;
  onPlayersChange: (players: Player[]) => void;
  onGoalStart: (player: Player, team: Team) => void;
  onEventAdded: (
    result: AddEventResult & { kind: 'ok' },
    player: Player,
    team: Team,
    minute: number | null,
  ) => void;
}) {
  const [rosterWarning, setRosterWarning] = useState<string | null>(null);
  const overLimit = players.length > MAX_ROSTER;

  function handlePlayerAdded(player: Player, warning?: string) {
    onPlayersChange([...players, player]);
    if (warning) {
      setRosterWarning(warning);
      window.setTimeout(() => setRosterWarning(null), 6000);
    }
  }

  return (
    <div className={`flex flex-col min-h-0 ${isHome ? 'order-2 lg:order-1 border-b border-[var(--border)] lg:border-b-0 lg:border-r' : 'order-3'}`}>
      <div
        className={`px-4 py-3 border-b border-[var(--border)] shrink-0 flex items-center gap-2.5 border-l-4 ${
          isHome ? 'border-l-[#e87425] bg-[#e87425]/10' : 'border-l-white/30 bg-[#141414]'
        }`}
      >
        <div
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            isHome ? 'bg-[#e87425] border-2 border-[#141414]' : 'bg-[#141414] border-2 border-[#e87425]'
          }`}
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-white text-sm truncate">{team.name}</h2>
          <p className={`text-[10px] mt-0.5 ${overLimit ? 'text-yellow-400' : 'text-[var(--muted)]'}`}>
            {players.length} in rosa{overLimit ? ` (max ${MAX_ROSTER} + extra)` : ''}
          </p>
        </div>
      </div>
      {rosterWarning !== null && (
        <p className="px-3 py-2 text-xs text-yellow-400 bg-yellow-400/10 border-b border-yellow-400/20 shrink-0">
          ⚠️ {rosterWarning}
        </p>
      )}
      <div className="overflow-y-auto flex-1 min-h-0">
        {players.length === 0 ? (
          <p className="px-3 py-4 text-xs text-[var(--muted)] text-center">Nessun giocatore in rosa</p>
        ) : (
          players.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              team={team}
              matchId={matchId}
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              onGoalStart={onGoalStart}
              onEventAdded={onEventAdded}
            />
          ))
        )}
      </div>
      <AddPlayerForm
        team={team}
        matchId={matchId}
        onAdded={handlePlayerAdded}
      />
    </div>
  );
}

// ─── PlayerRow ────────────────────────────────────────────────────────────────

interface PlayerRowProps {
  player: Player;
  team: Team;
  matchId: number;
  homeTeamId: number;
  awayTeamId: number;
  onGoalStart: (player: Player, team: Team) => void;
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
  onGoalStart,
  onEventAdded,
}: PlayerRowProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGoal() {
    if (isPending) return;
    startTransition(async () => {
      onGoalStart(player, team);
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
        <LoadingButton
          type="button"
          onClick={handleGoal}
          loading={isPending}
          className={`min-h-[44px] px-3 text-sm font-semibold text-white hover:opacity-90 active:opacity-75 rounded-lg transition-opacity shrink-0 ${team.id === homeTeamId ? 'bg-[#e87425]' : 'bg-[#141414] border border-[var(--border)]'}`}
        >
          {!isPending && <span>⚽</span>}
          <span>Goal</span>
        </LoadingButton>
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

interface ScoreboardState {
  scoreHome: number;
  scoreAway: number;
  events: MatchEventWithDetails[];
}

type ScoreboardOptimisticAction =
  | { type: 'add-goal'; tempId: number; player: Player; team: Team; minute: number | null }
  | { type: 'remove-goal'; eventId: number };

export function MatchAnalyst({
  match,
  homePlayers: initialHomePlayers,
  awayPlayers: initialAwayPlayers,
}: MatchAnalystProps) {
  const [homePlayers, setHomePlayers] = useState(initialHomePlayers);
  const [awayPlayers, setAwayPlayers] = useState(initialAwayPlayers);

  const [scoreboard, setScoreboard] = useState<ScoreboardState>({
    scoreHome: match.score_home ?? 0,
    scoreAway: match.score_away ?? 0,
    events: match.events.filter((e) => e.type === 'goal'),
  });

  // Optimistic overlay: applied the instant "Goal" is tapped, reverts on its
  // own once the enclosing transition settles without a confirmed update.
  const [optimisticScoreboard, applyOptimistic] = useOptimistic(
    scoreboard,
    (current: ScoreboardState, action: ScoreboardOptimisticAction): ScoreboardState => {
      if (action.type === 'add-goal') {
        const isHome = action.team.id === match.team_home_id;
        const newEvent: MatchEventWithDetails = {
          id: action.tempId,
          match_id: match.id,
          player_id: action.player.id,
          team_id: action.team.id,
          type: 'goal',
          minute: action.minute,
          player: action.player,
          team: action.team,
        };
        return {
          scoreHome: current.scoreHome + (isHome ? 1 : 0),
          scoreAway: current.scoreAway + (isHome ? 0 : 1),
          events: [...current.events, newEvent],
        };
      }
      const removed = current.events.find((e) => e.id === action.eventId);
      if (!removed) return current;
      const isHome = removed.team_id === match.team_home_id;
      return {
        scoreHome: current.scoreHome - (isHome ? 1 : 0),
        scoreAway: current.scoreAway - (isHome ? 0 : 1),
        events: current.events.filter((e) => e.id !== action.eventId),
      };
    },
  );

  const [status, setStatus] = useState(match.status);
  const [notes, setNotes] = useState(match.notes ?? '');
  const [notesSaved, setNotesSaved] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);

  const [isPendingStart, startStart] = useTransition();
  const [isPendingFinish, startFinish] = useTransition();
  const [removingEventId, setRemovingEventId] = useState<number | null>(null);
  const [isPendingRemove, startRemove] = useTransition();
  const [isPendingNotes, startNotes] = useTransition();

  function handleGoalStart(player: Player, team: Team) {
    applyOptimistic({ type: 'add-goal', tempId: -Date.now(), player, team, minute: null });
  }

  function handleEventAdded(
    result: AddEventResult & { kind: 'ok' },
    player: Player,
    team: Team,
    minute: number | null,
  ) {
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
    setScoreboard((prev) => ({
      scoreHome: result.scoreHome,
      scoreAway: result.scoreAway,
      events: [...prev.events, newEvent],
    }));
  }

  function handleRemoveEvent(eventId: number) {
    startRemove(async () => {
      setRemovingEventId(eventId);
      applyOptimistic({ type: 'remove-goal', eventId });
      const result = await removeEventAction(
        match.id,
        eventId,
        match.team_home_id,
        match.team_away_id,
      );
      if (result.kind === 'ok') {
        setScoreboard((prev) => ({
          scoreHome: result.scoreHome,
          scoreAway: result.scoreAway,
          events: prev.events.filter((e) => e.id !== eventId),
        }));
      }
      setRemovingEventId(null);
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

  const { scoreHome, scoreAway, events } = optimisticScoreboard;
  const sortedEvents = [...events].sort(
    (a, b) => (a.minute ?? 999) - (b.minute ?? 999),
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px_1fr] -mx-4 border-t border-[var(--border)] lg:h-[calc(100vh-8rem)] lg:overflow-hidden">

      {/* ─── Left column: home team (mobile: 2nd) ────────────────── */}
      <TeamRoster
        team={match.team_home}
        players={homePlayers}
        matchId={match.id}
        homeTeamId={match.team_home_id}
        awayTeamId={match.team_away_id}
        isHome
        onPlayersChange={setHomePlayers}
        onGoalStart={handleGoalStart}
        onEventAdded={handleEventAdded}
      />

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
            <LoadingButton
              type="button"
              onClick={handleStart}
              loading={isPendingStart}
              loadingText="Avvio in corso…"
              className="w-full bg-green-800 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              <span className="w-2 h-2 rounded-full bg-white shrink-0" />
              Inizia partita
            </LoadingButton>
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
              <LoadingLink
                href={`/admin/partite/${conflictInfo.id}`}
                showSpinner
                className="text-xs text-[#e87425] hover:text-white transition-colors block"
              >
                → Vai a quella partita
              </LoadingLink>
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
                <LoadingButton
                  type="button"
                  onClick={handleFinish}
                  loading={isPendingFinish}
                  loadingText="Chiusura…"
                  className="flex-1 bg-[#e87425] hover:bg-[#c55f0a] text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  Sì, termina
                </LoadingButton>
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
                return (
                  <div
                    key={event.id}
                    className={`flex items-start gap-2 py-1 px-1 rounded hover:bg-white/5 transition-colors ${isHome ? '' : 'flex-row-reverse'}`}
                  >
                    <div className={`w-0.5 self-stretch rounded-full shrink-0 mt-0.5 mb-0.5 ${isHome ? 'bg-[#e87425]' : 'bg-white/40'}`} />
                    <div className={`flex-1 min-w-0 ${isHome ? 'text-left' : 'text-right'}`}>
                      <p className="text-xs text-white font-medium leading-tight truncate">
                        {event.player?.name ?? '—'}
                      </p>
                      <p className={`text-xs leading-tight truncate ${isHome ? 'text-[#e87425]' : 'text-white/50'}`}>
                        {event.team?.name ?? ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvent(event.id)}
                      disabled={isPendingRemove}
                      title="Rimuovi"
                      className="text-[var(--muted)] hover:text-red-400 transition-colors text-xs shrink-0 disabled:opacity-40 disabled:cursor-not-allowed mt-0.5 min-w-[20px] flex items-center justify-center"
                    >
                      {removingEventId === event.id ? (
                        <Spinner size="xs" className="border-[var(--muted)]/40 border-t-[var(--muted)]" />
                      ) : (
                        '✕'
                      )}
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
            <LoadingButton
              type="button"
              onClick={handleSaveNotes}
              loading={isPendingNotes}
              loadingText="…"
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${
                notesSaved
                  ? 'bg-green-800/30 border-green-600/40 text-green-400'
                  : 'bg-[var(--card)] border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-[#e87425]/50'
              }`}
            >
              {notesSaved ? '✓ Salvato' : 'Salva'}
            </LoadingButton>
          </div>
        </div>
      </div>

      {/* ─── Right column: away team (mobile: 3rd) ───────────────── */}
      <TeamRoster
        team={match.team_away}
        players={awayPlayers}
        matchId={match.id}
        homeTeamId={match.team_home_id}
        awayTeamId={match.team_away_id}
        isHome={false}
        onPlayersChange={setAwayPlayers}
        onGoalStart={handleGoalStart}
        onEventAdded={handleEventAdded}
      />

    </div>
  );
}
