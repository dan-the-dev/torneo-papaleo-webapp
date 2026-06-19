import { getAllMatchesGroupedByDay } from '@/db/queries/matches';
import { MatchCard } from '@/components/ui/MatchCard';
import { BackToTop } from '@/components/ui/BackToTop';

const roundLabels: Record<string, string> = {
  group: 'Fase a gironi',
  r16: 'Ottavi di finale',
  qf: 'Quarti di finale',
  sf: 'Semifinali',
  '3rd': 'Finale 3°/4° posto',
  final: 'Finale',
};

function formatDayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function CalendarioPage() {
  const days = await getAllMatchesGroupedByDay();

  return (
    <div>
      <BackToTop />
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Calendario</h1>

      {days.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <p className="text-lg font-medium text-[var(--foreground)] mb-1">Nessuna partita in programma</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {days.map(({ date, matches }) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide capitalize">
                  {formatDayLabel(date)}
                </h2>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              <div className="flex flex-col gap-2">
                {matches.map((match) => (
                  <div key={match.id}>
                    <div className="text-xs text-[#e87425] font-medium mb-1 ml-1">
                      {roundLabels[match.round] ?? match.round}
                    </div>
                    <MatchCard match={match} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
