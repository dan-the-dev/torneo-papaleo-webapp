import { notFound } from 'next/navigation';
import { getMatchById } from '@/db/queries/matches';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LiveRefresher } from '@/components/ui/LiveRefresher';
import type { EventType } from '@/types/tournament';

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  });
}

const eventIcons: Record<EventType, string> = {
  goal: '⚽',
  assist: '🅰️',
  red_card: '🟥',
};

const eventLabels: Record<EventType, string> = {
  goal: 'Goal',
  assist: 'Assist',
  red_card: 'Espulsione',
};

const roundLabels: Record<string, string> = {
  group: 'Girone',
  r16: 'Ottavi di finale',
  qf: 'Quarti di finale',
  sf: 'Semifinale',
  '3rd': 'Finale 3°/4° posto',
  final: 'Finale',
};

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const id = parseInt(matchId, 10);
  if (isNaN(id)) notFound();

  const match = await getMatchById(id);
  if (!match) notFound();

  const homeEvents = match.events.filter((e) => e.team_id === match.team_home_id);
  const awayEvents = match.events.filter((e) => e.team_id === match.team_away_id);
  const isPlayed = match.status !== 'scheduled';

  return (
    <div>
      <LiveRefresher enabled={match.status === 'live'} />

      <div className="mb-4 text-sm text-[var(--muted)] capitalize">
        {roundLabels[match.round] ?? match.round}
      </div>

      {/* Score card */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 mb-6">
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Home team */}
          <div className="text-center">
            <div className="w-10 h-10 rounded-full mx-auto mb-2 bg-[#e87425] border-2 border-[#141414]" />
            <p className="font-bold text-[#e87425] text-sm">{match.team_home.name}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">{match.team_home.short_name}</p>
          </div>

          {/* Score */}
          <div className="text-center">
            {isPlayed ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-bold tabular-nums text-[var(--foreground)]">
                  {match.score_home ?? '–'}
                </span>
                <span className="text-2xl text-[var(--muted)]">–</span>
                <span className="text-4xl font-bold tabular-nums text-[var(--foreground)]">
                  {match.score_away ?? '–'}
                </span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-[var(--muted)]">vs</span>
            )}
            <div className="mt-2 flex justify-center">
              <StatusBadge status={match.status} />
            </div>
          </div>

          {/* Away team */}
          <div className="text-center">
            <div className="w-10 h-10 rounded-full mx-auto mb-2 bg-[#141414] border-2 border-[#e87425]" />
            <p className="font-bold text-[var(--foreground)] text-sm">{match.team_away.name}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">{match.team_away.short_name}</p>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-[var(--muted)] capitalize">
          {formatDateTime(match.scheduled_at)}
        </div>

        {match.notes && (
          <div className="mt-3 text-center text-sm text-[var(--muted)] italic">
            {match.notes}
          </div>
        )}
      </div>

      {/* Events timeline */}
      {match.events.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <h2 className="font-bold text-[var(--foreground)]">Cronaca</h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {match.events.map((event) => {
              const isHome = event.team_id === match.team_home_id;
              return (
                <div key={event.id} className={`flex items-center gap-3 px-4 py-3 ${isHome ? '' : 'flex-row-reverse'}`}>
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-xs text-[var(--muted)]">
                      {event.minute != null ? `${event.minute}'` : '–'}
                    </span>
                  </div>
                  <div className="text-lg">{eventIcons[event.type]}</div>
                  <div className={`flex items-center gap-2 ${isHome ? '' : 'flex-row-reverse'}`}>
                    <div className={isHome ? 'text-left' : 'text-right'}>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {event.player?.name ?? 'N/D'}
                      </p>
                      <p className="text-xs text-[var(--muted)]">{eventLabels[event.type]}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-team event summary */}
      {isPlayed && (homeEvents.length > 0 || awayEvents.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { team: match.team_home, events: homeEvents },
            { team: match.team_away, events: awayEvents },
          ].map(({ team, events: tevs }) => (
            <div key={team.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full border-2 ${team.id === match.team_home_id ? 'bg-[#e87425] border-[#141414]' : 'bg-[#141414] border-[#e87425]'}`} />
                <p className="text-sm font-bold text-[var(--foreground)]">{team.short_name}</p>
              </div>
              {tevs.length === 0 ? (
                <p className="text-xs text-[var(--muted)]">–</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {tevs.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-1.5 text-xs">
                      <span>{eventIcons[ev.type]}</span>
                      <span className="text-[var(--foreground)] truncate">{ev.player?.name ?? 'N/D'}</span>
                      {ev.minute != null && (
                        <span className="text-[var(--muted)] ml-auto flex-shrink-0">{ev.minute}&apos;</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
