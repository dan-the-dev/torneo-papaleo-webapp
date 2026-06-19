import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getMatchById } from '@/db/queries/matches';
import { getAllPlayers } from '@/db/queries/players';
import { MatchForm } from './MatchForm';
import { MatchStatusControls } from '@/components/ui/MatchStatusControls';
import Link from 'next/link';

const roundLabels: Record<string, string> = {
  group: 'Girone',
  r16: 'Ottavi di finale',
  qf: 'Quarti di finale',
  sf: 'Semifinale',
  '3rd': 'Finale 3°/4° posto',
  final: 'Finale',
};

export default async function AdminMatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  await requireAdmin();
  const { matchId } = await params;
  const id = parseInt(matchId, 10);
  if (isNaN(id)) notFound();

  const [match, players] = await Promise.all([getMatchById(id), getAllPlayers()]);
  if (!match) notFound();

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/admin/partite"
          className="text-[var(--muted)] hover:text-white text-sm transition-colors"
        >
          ← Partite
        </Link>
        <span className="text-[var(--muted)]">/</span>
        <span className="text-sm text-white">
          {match.team_home.name} vs {match.team_away.name}
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">
          {match.team_home.name} – {match.team_away.name}
        </h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">
          {roundLabels[match.round] ?? match.round} ·{' '}
          {new Date(match.scheduled_at).toLocaleString('it-IT', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Rome',
          })}
        </p>
      </div>

      <MatchStatusControls matchId={match.id} status={match.status} />

      <MatchForm match={match} players={players} />
    </div>
  );
}
