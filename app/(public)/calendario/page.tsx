import { getAllMatchesGroupedByDay } from '@/db/queries/matches';
import { CalendarioFilter } from '@/components/ui/CalendarioFilter';
import { BackToTop } from '@/components/ui/BackToTop';
import type { Team } from '@/types/tournament';

export const dynamic = 'force-dynamic';

export default async function CalendarioPage() {
  const days = await getAllMatchesGroupedByDay();

  // Collect unique teams from all matches (knockout placeholders may have no team yet)
  const teamMap = new Map<number, Team>();
  for (const { matches } of days) {
    for (const m of matches) {
      const home = m.team_home as Team | null;
      const away = m.team_away as Team | null;
      if (home) teamMap.set(home.id, home);
      if (away) teamMap.set(away.id, away);
    }
  }
  const teams = [...teamMap.values()];

  return (
    <div>
      <BackToTop />
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Calendario</h1>

      {days.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <p className="text-lg font-medium text-[var(--foreground)] mb-1">Nessuna partita in programma</p>
        </div>
      ) : (
        <CalendarioFilter days={days} teams={teams} />
      )}
    </div>
  );
}
