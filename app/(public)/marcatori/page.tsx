import { getTopScorers, getTopAssisters } from '@/db/queries/players';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { BackToTop } from '@/components/ui/BackToTop';
import type { TopScorer } from '@/types/tournament';

function ScorerRow({ scorer, rank, statKey }: { scorer: TopScorer; rank: number; statKey: 'goals' | 'assists' }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--border)]/50 last:border-0">
      <div className="w-6 text-center">
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
        <p className="font-semibold text-white text-sm truncate">{scorer.player.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: scorer.team.color_primary }}
          />
          <p className="text-xs text-[var(--muted)] truncate">{scorer.team.name}</p>
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <span className="text-2xl font-bold text-white tabular-nums">{scorer[statKey]}</span>
        <p className="text-xs text-[var(--muted)] mt-0.5">{statKey === 'goals' ? 'gol' : 'assist'}</p>
      </div>
    </div>
  );
}

export default async function MarcatoriPage() {
  const [scorers, assisters] = await Promise.all([getTopScorers(), getTopAssisters()]);

  return (
    <div>
      <BackToTop />
      <h1 className="text-2xl font-bold text-white mb-6">Marcatori</h1>

      {scorers.length === 0 && assisters.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <div className="text-5xl mb-4">⚽</div>
          <p className="text-lg font-medium text-white mb-1">Nessun dato disponibile</p>
          <p className="text-sm">Le statistiche appariranno dopo le prime partite.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Classifica marcatori */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <h2 className="font-bold text-white">⚽ Classifica marcatori</h2>
            </div>
            <div className="px-4">
              {scorers.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--muted)]">Nessun gol segnato</p>
              ) : (
                scorers.map((s, i) => (
                  <ScorerRow key={s.player.id} scorer={s} rank={i + 1} statKey="goals" />
                ))
              )}
            </div>
          </div>

          {/* Classifica assistman */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <h2 className="font-bold text-white">🅰️ Classifica assistman</h2>
            </div>
            <div className="px-4">
              {assisters.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--muted)]">Nessun assist registrato</p>
              ) : (
                assisters.map((s, i) => (
                  <ScorerRow key={s.player.id} scorer={s} rank={i + 1} statKey="assists" />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
