import { getTopScorers } from '@/db/queries/players';
import { getLiveMatches } from '@/db/queries/matches';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { BackToTop } from '@/components/ui/BackToTop';
import type { TopScorer } from '@/types/tournament';

function ScorerRow({ scorer, rank, isLive }: { scorer: TopScorer; rank: number; isLive: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 py-3 border-b border-[var(--border)]/50 last:border-0 ${isLive ? 'pl-1' : ''}`}
      style={isLive ? {
        borderLeft: `3px solid ${scorer.team.color_primary}`,
        backgroundColor: `${scorer.team.color_primary}12`,
      } : undefined}
    >
      <div className="w-6 text-center flex-shrink-0">
        <span className={`text-sm font-bold ${rank <= 3 ? 'text-[#e87425]' : 'text-[var(--muted)]'}`}>
          {rank}
        </span>
      </div>
      <PlayerAvatar
        name={scorer.player.name}
        colorPrimary={scorer.team.color_primary}
        colorSecondary={scorer.team.color_secondary}
        size={36}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-white text-sm truncate">{scorer.player.name}</p>
          {isLive && (
            <span className="inline-flex items-center gap-1 bg-[#e87425]/15 text-[#e87425] border border-[#e87425]/30 px-1.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e87425] animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: scorer.team.color_primary }} />
          <p className="text-xs text-[var(--muted)] truncate">{scorer.team.name}</p>
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <span className="text-2xl font-bold text-white tabular-nums">{scorer.goals}</span>
        <p className="text-xs text-[var(--muted)] mt-0.5">gol</p>
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
          <div className="px-4">
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
