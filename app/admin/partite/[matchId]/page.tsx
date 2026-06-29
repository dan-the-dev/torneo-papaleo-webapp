import { notFound } from 'next/navigation';
import { AdminBackLink } from '@/components/admin/AdminBackLink';
import { requireAdmin } from '@/lib/auth';
import { getMatchById } from '@/db/queries/matches';
import { getPlayersByTeam } from '@/db/queries/players';
import { MatchAnalyst } from './MatchAnalyst';

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

  const match = await getMatchById(id);
  if (!match) notFound();

  const [homePlayers, awayPlayers] = await Promise.all([
    getPlayersByTeam(match.team_home_id),
    getPlayersByTeam(match.team_away_id),
  ]);

  const dateStr = new Date(match.scheduled_at).toLocaleString('it-IT', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  });

  return (
    <>
      <div className="flex items-center gap-2 py-3 text-sm flex-wrap">
        <AdminBackLink href="/admin/partite">← Partite</AdminBackLink>
        <span className="text-[var(--border)]">/</span>
        <span className="text-white font-medium">
          {match.team_home.name} vs {match.team_away.name}
        </span>
        <span className="text-[var(--border)]">·</span>
        <span className="text-[var(--muted)]">
          {roundLabels[match.round] ?? match.round} · {dateStr}
        </span>
      </div>

      <MatchAnalyst
        match={match}
        homePlayers={homePlayers}
        awayPlayers={awayPlayers}
      />
    </>
  );
}
