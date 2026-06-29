'use client';

import { LoadingLink } from '@/components/navigation/LoadingLink';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { MatchStatus, MatchWithTeams } from '@/types/tournament';

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  });
}

const roundLabels: Record<string, string> = {
  group: 'Girone',
  r16: 'Ottavi',
  qf: 'Quarti',
  sf: 'Semi',
  '3rd': '3°/4°',
  final: 'Finale',
};

export function AdminPartiteList({
  matches,
  activeFilter,
}: {
  matches: MatchWithTeams[];
  activeFilter: MatchStatus | null;
}) {
  return (
    <>
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { label: 'Tutte', value: null },
          { label: 'Da giocare', value: 'scheduled' as MatchStatus },
          { label: 'In corso', value: 'live' as MatchStatus },
          { label: 'Terminate', value: 'finished' as MatchStatus },
        ].map(({ label, value }) => (
          <LoadingLink
            key={label}
            href={value ? `/admin/partite?filter=${value}` : '/admin/partite'}
            showSpinner
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              activeFilter === value
                ? 'bg-[#e87425] text-white'
                : 'bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-white'
            }`}
          >
            {label}
          </LoadingLink>
        ))}
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        {matches.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--muted)]">Nessuna partita trovata</p>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {matches.map((match) => (
              <div key={match.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-shrink-0 w-12 text-xs text-[var(--muted)]">
                  {roundLabels[match.round] ?? match.round}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {match.team_home.name} <span className="text-[var(--muted)]">vs</span>{' '}
                    {match.team_away.name}
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {formatDateTime(match.scheduled_at)}
                    {match.status === 'finished' &&
                      match.score_home !== null &&
                      match.score_away !== null &&
                      ` · ${match.score_home}–${match.score_away}`}
                  </p>
                </div>
                <StatusBadge status={match.status} />
                <LoadingLink
                  href={`/admin/partite/${match.id}`}
                  showSpinner
                  className="flex-shrink-0 bg-[var(--background)] border border-[var(--border)] hover:border-[#e87425]/50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  {match.status === 'scheduled' ? 'Inserisci' : 'Modifica'}
                </LoadingLink>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
