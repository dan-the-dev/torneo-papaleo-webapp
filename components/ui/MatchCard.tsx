import Link from 'next/link';
import type { MatchWithTeams } from '@/types/tournament';
import { StatusBadge } from './StatusBadge';

interface MatchCardProps {
  match: MatchWithTeams;
  showGroup?: boolean;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  });
}

const roundLabels: Record<string, string> = {
  group: 'Girone',
  r16: 'Ottavi',
  qf: 'Quarti',
  sf: 'Semifinale',
  '3rd': 'Finale 3°/4°',
  final: 'Finale',
};

export function MatchCard({ match, showGroup = false }: MatchCardProps) {
  const isPlayed = match.status === 'finished' || match.status === 'live';
  const sh = match.score_home;
  const sa = match.score_away;

  return (
    <Link href={`/gironi/${match.id}`} className="block group cursor-pointer">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 group-hover:border-[#e87425]/70 group-hover:bg-white/[0.015] transition-all">
        {showGroup && (
          <div className="text-xs text-[var(--muted)] mb-2 font-medium uppercase tracking-wide">
            {match.round === 'group' ? `Girone` : roundLabels[match.round] ?? match.round}
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Home team */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: match.team_home.color_primary }}
              />
              <span className="font-semibold text-sm truncate">{match.team_home.name}</span>
            </div>
          </div>

          {/* Score / time */}
          <div className="flex-shrink-0 text-center min-w-[72px]">
            {isPlayed ? (
              <div className="flex items-center justify-center gap-2">
                <span className={`text-xl font-bold tabular-nums ${sh !== null && sa !== null && sh > sa ? 'text-white' : 'text-[var(--muted)]'}`}>
                  {sh ?? '-'}
                </span>
                <span className="text-[var(--muted)]">–</span>
                <span className={`text-xl font-bold tabular-nums ${sh !== null && sa !== null && sa > sh ? 'text-white' : 'text-[var(--muted)]'}`}>
                  {sa ?? '-'}
                </span>
              </div>
            ) : (
              <span className="text-sm font-medium text-[var(--muted)]">
                {formatTime(match.scheduled_at)}
              </span>
            )}
            <div className="mt-1 flex justify-center">
              <StatusBadge status={match.status} />
            </div>
          </div>

          {/* Away team */}
          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="font-semibold text-sm truncate">{match.team_away.name}</span>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: match.team_away.color_primary }}
              />
            </div>
          </div>

          {/* Chevron */}
          <span className="text-[var(--muted)] group-hover:text-[#e87425] transition-colors flex-shrink-0 text-base leading-none">›</span>
        </div>
      </div>
    </Link>
  );
}
