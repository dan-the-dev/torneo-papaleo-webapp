import { getAllGroups, getGroupWithMatches } from '@/db/queries/groups';
import { MatchCard } from '@/components/ui/MatchCard';
import type { GroupStanding, MatchWithTeams } from '@/types/tournament';

export const dynamic = 'force-dynamic';

function groupMatchesByDate(matches: MatchWithTeams[]): [string, MatchWithTeams[]][] {
  const map = new Map<string, MatchWithTeams[]>();
  for (const m of matches) {
    const label = new Date(m.scheduled_at).toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Rome',
    });
    const arr = map.get(label) ?? [];
    arr.push(m);
    map.set(label, arr);
  }
  return [...map.entries()];
}

function StandingsTable({
  standings,
  liveTeamIds = [],
}: {
  standings: GroupStanding[];
  liveTeamIds?: number[];
}) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-[var(--muted)] uppercase tracking-wide border-b border-[var(--border)]">
              <th className="text-left py-2 pr-2 font-medium">#</th>
              <th className="text-left py-2 pr-2 font-medium">Squadra</th>
              <th className="text-center py-2 px-1 font-medium">G</th>
              <th className="text-center py-2 px-1 font-medium">V</th>
              <th className="text-center py-2 px-1 font-medium">P</th>
              <th className="text-center py-2 px-1 font-medium">S</th>
              <th className="text-center py-2 px-1 font-medium">GF</th>
              <th className="text-center py-2 px-1 font-medium">GS</th>
              <th className="text-center py-2 px-1 font-medium">DR</th>
              <th className="text-center py-2 px-1 font-medium font-bold text-[var(--foreground)]">Pt</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const isLive = liveTeamIds.includes(s.team.id);
              return (
                <tr
                  key={s.team.id}
                  className={`border-b border-[var(--border)]/50 ${isLive ? 'font-semibold' : ''}`}
                >
                  <td
                    className={`py-2.5 pr-2 text-[var(--muted)] ${isLive ? 'pl-1' : ''}`}
                    style={isLive ? { borderLeft: '4px solid #e87425' } : undefined}
                  >
                    {i + 1}
                  </td>
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-2">
                      {isLive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#e87425] animate-pulse flex-shrink-0" />
                      )}
                      <span className={`font-medium truncate max-w-[120px] sm:max-w-none ${isLive ? 'text-[var(--foreground)]' : ''}`}>
                        {s.team.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-1 text-center text-[var(--muted)]">{s.played}</td>
                  <td className="py-2.5 px-1 text-center text-[var(--muted)]">{s.won}</td>
                  <td className="py-2.5 px-1 text-center text-[var(--muted)]">{s.drawn}</td>
                  <td className="py-2.5 px-1 text-center text-[var(--muted)]">{s.lost}</td>
                  <td className="py-2.5 px-1 text-center text-[var(--muted)]">{s.goals_for}</td>
                  <td className="py-2.5 px-1 text-center text-[var(--muted)]">{s.goals_against}</td>
                  <td className="py-2.5 px-1 text-center text-[var(--muted)]">
                    {s.goal_diff > 0 ? `+${s.goal_diff}` : s.goal_diff}
                  </td>
                  <td className="py-2.5 px-1 text-center font-bold text-[var(--foreground)]">{s.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {liveTeamIds.length > 0 && (
        <p className="text-xs text-[var(--muted)] mt-2 px-1">
          * Classifica provvisoria: partita in corso
        </p>
      )}
    </div>
  );
}

export default async function GironiPage() {
  const groups = await getAllGroups();
  const group = groups[0];
  if (!group) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Classifica</h1>
        <p className="text-[var(--muted)]">Nessun dato disponibile.</p>
      </div>
    );
  }

  const { standings, matches, isFinished } = await getGroupWithMatches(group.id);

  const liveMatch = matches.find((m) => m.status === 'live');
  const liveTeamIds = liveMatch ? [liveMatch.team_home_id, liveMatch.team_away_id] : [];
  const matchesByDate = groupMatchesByDate(matches);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Classifica</h1>

      {/* Standings */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden mb-8">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="font-bold text-lg text-[var(--foreground)]">Classifica generale</h2>
          {matches.length > 0 && (
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                isFinished
                  ? 'bg-green-500/20 text-[var(--status-green-text)]'
                  : 'bg-yellow-500/20 text-[var(--status-yellow-text)]'
              }`}
            >
              {isFinished ? 'Girone concluso' : 'Girone in corso'}
            </span>
          )}
        </div>
        <div className="px-4 py-3">
          <StandingsTable standings={standings} liveTeamIds={liveTeamIds} />
        </div>
      </div>

      {/* Matches grouped by date */}
      {matchesByDate.length > 0 && (
        <div className="flex flex-col gap-6">
          {matchesByDate.map(([dateLabel, dayMatches]) => (
            <div key={dateLabel}>
              <p className="text-xs text-[var(--muted)] uppercase tracking-wide font-semibold capitalize mb-3">
                {dateLabel}
              </p>
              <div className="flex flex-col gap-2">
                {dayMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
