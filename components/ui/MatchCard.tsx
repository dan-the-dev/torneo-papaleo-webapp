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

  return (
    <Link href={`/gironi/${match.id}`} className="block">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:border-[#e87425]/50 transition-colors">
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
                <span className={`text-xl font-bold tabular-nums ${match.score_home !== null && match.score_away !== null && match.score_home > match.score_away ? 'text-white' : 'text-[var(--muted)]'}`}>
                  {match.score_home ?? '-'}
                </span>
                <span className="text-[var(--muted)]">–</span>
                <span className={`text-xl font-bold tabular-nums ${match.score_home !== null && match.score_away !== null && match.score_away > match.score_home ? 'text-white' : 'text-[var(--muted)]'}`}>
                  {match.score_away ?? '-'}
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
        </div>
      </div>
    </Link>
  );
}
