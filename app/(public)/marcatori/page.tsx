import { getTopScorers } from '@/db/queries/players';
import { getLiveMatches } from '@/db/queries/matches';
import { BackToTop } from '@/components/ui/BackToTop';
import type { TopScorer } from '@/types/tournament';

function ScorerRow({ scorer, rank, isLive }: { scorer: TopScorer; rank: number; isLive: boolean }) {
  const isFirst = rank === 1;
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]/50 last:border-0 ${
        isFirst
          ? 'bg-[#e87425]'
          : rank % 2 === 0
          ? 'bg-[#1a1a1a]'
          : 'bg-[#141414]'
      }`}
    >
      <div className="w-6 text-center flex-shrink-0">
        <span className={`text-sm font-bold ${isFirst ? 'text-[#141414]' : rank <= 3 ? 'text-[#e87425]' : 'text-[var(--muted)]'}`}>
          {rank}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-semibold text-sm truncate ${isFirst ? 'text-[#141414]' : 'text-white'}`}>
            {scorer.player.name}
          </p>
          {isLive && (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0 border ${
              isFirst
                ? 'bg-[#141414]/20 text-[#141414] border-[#141414]/30'
                : 'bg-[#e87425]/15 text-[#e87425] border-[#e87425]/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isFirst ? 'bg-[#141414]' : 'bg-[#e87425]'}`} />
              LIVE
            </span>
          )}
        </div>
        <p className={`text-sm font-semibold truncate mt-0.5 ${isFirst ? 'text-[#141414]/75' : 'text-[var(--muted)]'}`}>
          {scorer.team.name}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <span className={`text-2xl font-bold tabular-nums ${isFirst ? 'text-[#141414]' : 'text-white'}`}>
          {scorer.goals}
        </span>
        <p className={`text-xs mt-0.5 ${isFirst ? 'text-[#141414]/75' : 'text-[var(--muted)]'}`}>gol</p>
      </div>
    </div>
  );
}

export default async function MarcatoriPage() {
  const [scorers, liveMatches] = await Promise.all([getTopScorers(), getLiveMatches()]);
  const liveTeamIds = new Set<number>(
    liveMatches.flatMap((m) => [m.team_home_id, m.team_away_id]),
  );
  const hasLive = liveTeamIds.size > 0;

  return (
    <div>
      <BackToTop />
      <h1 className="text-2xl font-bold text-white mb-6">Marcatori</h1>

      {scorers.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <div className="text-5xl mb-4">⚽</div>
          <p className="text-lg font-medium text-white mb-1">Nessun dato disponibile</p>
          <p className="text-sm">Le statistiche appariranno dopo le prime partite.</p>
        </div>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <h2 className="font-bold text-white">⚽ Classifica marcatori</h2>
          </div>
          <div>
            {scorers.map((s, i) => (
              <ScorerRow
                key={s.player.id}
                scorer={s}
                rank={i + 1}
                isLive={liveTeamIds.has(s.team.id)}
              />
            ))}
          </div>
          {hasLive && (
            <div className="px-4 py-3 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--muted)]">
                <span className="inline-flex items-center gap-1 mr-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e87425] animate-pulse inline-block" />
                </span>
                Partita in corso — il totale potrebbe aggiornarsi
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
