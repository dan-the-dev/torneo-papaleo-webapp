import { requireAdmin } from '@/lib/auth';
import { getDashboardStats } from '@/db/queries/matches';
import Link from 'next/link';
import type { MatchWithTeams } from '@/types/tournament';

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  });
}

function MatchWidget({ label, match, live = false }: {
  label: string;
  match: MatchWithTeams;
  live?: boolean;
}) {
  return (
    <div className={`bg-[var(--card)] border rounded-xl p-4 ${live ? 'border-[#e87425]/50' : 'border-[var(--border)]'}`}>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs text-[var(--muted)] uppercase tracking-wide font-medium">{label}</p>
        {live && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#e87425]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e87425] animate-pulse" />
            LIVE
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-white">
            {match.team_home.name} vs {match.team_away.name}
          </p>
          {live ? (
            <p className="text-sm font-bold text-[#e87425] mt-0.5">
              {match.score_home ?? 0} — {match.score_away ?? 0}
              {match.current_minute !== null && (
                <span className="text-[var(--muted)] font-normal ml-2">{match.current_minute}&apos;</span>
              )}
            </p>
          ) : (
            <p className="text-sm text-[var(--muted)] mt-0.5 capitalize">
              {formatDateTime(match.scheduled_at)}
            </p>
          )}
        </div>
        <Link
          href={`/admin/partite/${match.id}`}
          className="bg-[#e87425] hover:bg-[#c55f0a] text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          {live ? 'Gestisci' : 'Inserisci'}
        </Link>
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  await requireAdmin();
  const stats = await getDashboardStats();

  return (
    <div>
      <div className="flex items-start justify-between gap-4 bg-[#e87425]/10 border border-[#e87425]/30 rounded-xl px-4 py-3 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-lg">⚙️</span>
          <div>
            <p className="text-sm font-semibold text-white">Area amministrativa</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Le modifiche sono applicate immediatamente al sito pubblico.
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="flex-shrink-0 text-xs text-[#e87425] hover:text-white transition-colors pt-0.5"
        >
          Vai al sito →
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-white tabular-nums">{stats.total}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Partite totali</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-400 tabular-nums">{stats.finished}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Giocate</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-white tabular-nums">{stats.total - stats.finished}</p>
          <p className="text-xs text-[var(--muted)] mt-1">Da giocare</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-400 tabular-nums">{stats.live}</p>
          <p className="text-xs text-[var(--muted)] mt-1">In corso</p>
        </div>
      </div>

      {(stats.liveMatch || stats.nextMatch) && (
        <div className="flex flex-col gap-3 mb-6">
          {stats.liveMatch && (
            <MatchWidget label="Partita in corso" match={stats.liveMatch} live />
          )}
          {stats.nextMatch && (
            <MatchWidget label="Prossima partita" match={stats.nextMatch} />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { href: '/admin/partite', label: 'Gestisci partite', icon: '⚽', desc: 'Inserisci risultati e marcatori' },
          { href: '/tabellone', label: 'Tabellone', icon: '🏆', desc: 'Visualizza il tabellone (aggiornamento automatico)' },
          { href: '/', label: 'Visualizza sito', icon: '👁️', desc: 'Area pubblica del torneo' },
        ].map((card) => (
          <Link key={card.href} href={card.href} className="block">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:border-[#e87425]/50 transition-colors">
              <div className="text-2xl mb-2">{card.icon}</div>
              <p className="font-semibold text-white text-sm">{card.label}</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
