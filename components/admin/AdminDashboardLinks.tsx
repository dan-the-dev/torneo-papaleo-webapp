'use client';

import { LoadingLink } from '@/components/navigation/LoadingLink';
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

export function AdminMatchWidgetLink({
  match,
  live = false,
}: {
  match: MatchWithTeams;
  live?: boolean;
}) {
  return (
    <LoadingLink
      href={`/admin/partite/${match.id}`}
      showSpinner
      className="bg-[#e87425] hover:bg-[#c55f0a] text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
    >
      {live ? 'Gestisci' : 'Inserisci'}
    </LoadingLink>
  );
}

export function AdminDashboardLinks() {
  const cards = [
    { href: '/admin/partite', label: 'Gestisci partite', icon: '⚽', desc: 'Inserisci risultati e marcatori' },
    { href: '/tabellone', label: 'Tabellone', icon: '🏆', desc: 'Visualizza il tabellone (aggiornamento automatico)' },
    { href: '/', label: 'Visualizza sito', icon: '👁️', desc: 'Area pubblica del torneo' },
  ] as const;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((card) => (
        <LoadingLink key={card.href} href={card.href} className="block">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:border-[#e87425]/50 transition-colors">
            <div className="text-2xl mb-2">{card.icon}</div>
            <p className="font-semibold text-white text-sm">{card.label}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">{card.desc}</p>
          </div>
        </LoadingLink>
      ))}
    </div>
  );
}

export { formatDateTime };
