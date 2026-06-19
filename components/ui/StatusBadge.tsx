import type { MatchStatus } from '@/types/tournament';

const labels: Record<MatchStatus, string> = {
  scheduled: 'In programma',
  live: 'In corso',
  finished: 'Terminata',
};

const styles: Record<MatchStatus, string> = {
  scheduled: 'bg-zinc-800 text-zinc-300',
  live: 'bg-green-500/20 text-green-400 animate-pulse',
  finished: 'bg-zinc-700 text-zinc-400',
};

export function StatusBadge({ status }: { status: MatchStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
      {status === 'live' && (
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5" />
      )}
      {labels[status]}
    </span>
  );
}
