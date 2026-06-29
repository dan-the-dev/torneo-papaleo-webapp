import { MatchDetailLink } from '@/components/navigation/MatchDetailLink';
import { getLiveMatches, getNextScheduledMatch, getMatchesToday, getLiveMatchGoals, type LiveGoal } from '@/db/queries/matches';
import { getPodiumData, type PodiumData } from '@/db/queries/podium';
import { getTournamentState } from '@/lib/tournament';
import { MatchCard } from '@/components/ui/MatchCard';
import { LiveRefresher } from '@/components/ui/LiveRefresher';
import type { MatchWithTeams } from '@/types/tournament';

export const dynamic = 'force-dynamic';

const roundLabels: Record<string, string> = {
  group: 'Girone',
  r16: 'Ottavi di finale',
  qf: 'Quarti di finale',
  sf: 'Semifinale',
  '3rd': 'Finale 3°/4° posto',
  final: 'Finale',
};

function LiveMatchCard({ match, goals }: { match: MatchWithTeams; goals: LiveGoal[] }) {
  const homeGoals = goals.filter((g) => g.team_id === match.team_home_id);
  const awayGoals = goals.filter((g) => g.team_id === match.team_away_id);

  return (
    <MatchDetailLink matchId={match.id} className="block">
      <div className="bg-[var(--card)] border border-[#e87425]/50 rounded-xl p-6 hover:border-[#e87425] transition-colors cursor-pointer">
        <div className="flex items-center justify-center mb-5">
          <span className="inline-flex items-center gap-1.5 bg-[#e87425]/15 text-[#e87425] border border-[#e87425]/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#e87425] animate-pulse" />
            LIVE
            {match.current_minute !== null && (
              <span className="ml-0.5 tabular-nums">{match.current_minute}&apos;</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 text-center min-w-0">
            <div className="w-5 h-5 rounded-full mx-auto mb-2 bg-[#e87425] border-2 border-[#141414]" />
            <p className="font-bold text-[#e87425] text-base leading-tight">{match.team_home.name}</p>
          </div>
          <div className="flex-shrink-0 text-center">
            <p className="text-4xl font-extrabold text-[var(--foreground)] tabular-nums tracking-tight">
              {match.score_home ?? 0}&nbsp;–&nbsp;{match.score_away ?? 0}
            </p>
          </div>
          <div className="flex-1 text-center min-w-0">
            <div className="w-5 h-5 rounded-full mx-auto mb-2 bg-[#141414] border-2 border-[#e87425]" />
            <p className="font-bold text-[var(--foreground)] text-base leading-tight">{match.team_away.name}</p>
          </div>
        </div>

        {(homeGoals.length > 0 || awayGoals.length > 0) && (
          <div className="mt-4 flex gap-4">
            <div className="flex-1 space-y-1">
              {homeGoals.map((g, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#e87425] border border-[#141414]" />
                  <span className="text-[11px] text-[var(--foreground)]/80 leading-tight truncate">
                    {g.player_name ?? '—'}{' '}
                    <span className="text-[var(--foreground)]/40">({g.team_short_name})</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="flex-1 space-y-1">
              {awayGoals.map((g, i) => (
                <div key={i} className="flex items-center justify-end gap-1.5">
                  <span className="text-[11px] text-[var(--foreground)]/80 leading-tight truncate text-right">
                    {g.player_name ?? '—'}{' '}
                    <span className="text-[var(--foreground)]/40">({g.team_short_name})</span>
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#141414] border border-[#e87425]" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MatchDetailLink>
  );
}

function NextMatchCard({ match }: { match: MatchWithTeams }) {
  const roundLabel = roundLabels[match.round] ?? match.round;
  const dateStr = new Date(match.scheduled_at).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Rome',
  });
  const timeStr = new Date(match.scheduled_at).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  });

  return (
    <MatchDetailLink matchId={match.id} className="block">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:border-[#e87425]/50 transition-colors cursor-pointer">
        <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide mb-4">
          Prossima partita · {roundLabel}
        </p>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 text-center min-w-0">
            <div className="w-5 h-5 rounded-full mx-auto mb-2 bg-[#e87425] border-2 border-[#141414]" />
            <p className="font-bold text-[#e87425]">{match.team_home.name}</p>
          </div>
          <div className="flex-shrink-0 text-center">
            <p className="text-xl font-bold text-[var(--muted)]">vs</p>
          </div>
          <div className="flex-1 text-center min-w-0">
            <div className="w-5 h-5 rounded-full mx-auto mb-2 bg-[#141414] border-2 border-[#e87425]" />
            <p className="font-bold text-[var(--foreground)]">{match.team_away.name}</p>
          </div>
        </div>
        <p className="text-sm text-[var(--muted)] text-center capitalize">
          {dateStr} · {timeStr}
        </p>
      </div>
    </MatchDetailLink>
  );
}

function TeamPodium({ podium }: { podium: PodiumData }) {
  return (
    <div className="flex items-end justify-center gap-3 max-w-xs mx-auto">
      {/* 2nd place */}
      <div className="flex-1 flex flex-col items-center">
        <span className="text-2xl mb-2">🥈</span>
        <div className="w-9 h-9 rounded-full mb-2 ring-1 ring-[var(--border)] bg-[var(--border)]" />
        <p className="text-xs font-bold text-[var(--foreground)] text-center leading-tight px-1 mb-4">
          {podium.second.name}
        </p>
        <div className="w-full h-14 rounded-t-lg bg-[var(--card)] border border-[var(--border)] flex items-center justify-center">
          <span className="text-xs text-[var(--muted)] font-semibold">2°</span>
        </div>
      </div>

      {/* 1st place */}
      <div className="flex-1 flex flex-col items-center">
        <span className="text-3xl mb-2">🏆</span>
        <div className="w-10 h-10 rounded-full mb-2 ring-2 ring-[#e87425]/60 bg-[#e87425]" />
        <p className="text-sm font-extrabold text-[var(--foreground)] text-center leading-tight px-1 mb-1">
          {podium.first.name}
        </p>
        <p className="text-[10px] text-[#e87425] font-bold mb-4">Campioni!</p>
        <div
          className="w-full h-20 rounded-t-lg bg-[#e87425]/15 border border-[#e87425]/40 flex items-center justify-center"
          style={{ animation: 'winner-glow 2s ease-in-out infinite' }}
        >
          <span className="text-xs text-[#e87425] font-bold">1°</span>
        </div>
      </div>

      {/* 3rd place */}
      <div className="flex-1 flex flex-col items-center">
        <span className="text-2xl mb-2">🥉</span>
        <div className="w-9 h-9 rounded-full mb-2 ring-1 ring-[var(--border)] bg-[var(--border)]" />
        <p className="text-xs font-bold text-[var(--foreground)] text-center leading-tight px-1 mb-4">
          {podium.third?.name ?? 'Da definire'}
        </p>
        <div className="w-full h-10 rounded-t-lg bg-[var(--card)] border border-[var(--border)] flex items-center justify-center">
          <span className="text-xs text-[var(--muted)] font-semibold">3°</span>
        </div>
      </div>
    </div>
  );
}

function TopScorers({ scorers }: { scorers: PodiumData['topScorers'] }) {
  if (scorers.length === 0) return null;
  const medals = ['🥇', '🥈', '🥉'] as const;

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">
        Capocannonieri
      </h2>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        {scorers.map((s, i) => (
          <div
            key={s.playerName}
            className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]/50 last:border-0"
          >
            <span className="text-lg w-6 text-center">{medals[i]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)] truncate">{s.playerName}</p>
              <p className="text-xs text-[var(--muted)] truncate mt-0.5">{s.teamName}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <span className={`text-xl font-bold tabular-nums ${i === 0 ? 'text-[#e87425]' : 'text-[var(--foreground)]'}`}>
                {s.goals}
              </span>
              <p className="text-xs text-[var(--muted)]">gol</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const state = await getTournamentState();
  const isFinished = state === 'finished';

  let podiumData: PodiumData | null = null;
  let liveMatches: MatchWithTeams[] = [];
  let liveMatchGoals: LiveGoal[][] = [];
  let todayMatches: MatchWithTeams[] = [];
  let nextMatch: MatchWithTeams | null = null;

  if (isFinished) {
    podiumData = await getPodiumData();
  } else {
    [liveMatches, todayMatches] = await Promise.all([
      getLiveMatches(),
      getMatchesToday(),
    ]);
    liveMatchGoals = await Promise.all(liveMatches.map((m) => getLiveMatchGoals(m.id)));
    if (liveMatches.length === 0) {
      nextMatch = await getNextScheduledMatch();
    }
  }

  const finishedDateStr = podiumData?.finishedAt
    ? new Date(podiumData.finishedAt).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/Rome',
      })
    : null;

  const featuredId = liveMatches[0]?.id ?? null;
  const listMatches = todayMatches.filter((m) => m.id !== featuredId);

  return (
    <div>
      <LiveRefresher enabled={!isFinished} />

      {/* ─── Hero ───────────────────────────────────────────────────── */}
      <section className="-mx-4 -mt-6 px-6 py-14 bg-gradient-to-b from-[var(--background)] to-[var(--card)] text-center border-b border-[var(--border)] mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Ardor Bollate"
          className="h-20 w-auto mx-auto mb-6"
        />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] mb-2 tracking-tight">
          Torneo Andrea Papaleo
        </h1>
        <p className="text-base font-medium text-[#e87425]">
          2ª Edizione · Polisportiva Ardor Bollate · 2026
        </p>
        {isFinished && (
          <div className="mt-5 inline-flex items-center gap-2 bg-[#e87425]/15 border border-[#e87425]/30 px-4 py-1.5 rounded-full">
            <span>🏆</span>
            <span className="text-sm font-semibold text-[#e87425]">
              Torneo concluso{finishedDateStr ? ` · ${finishedDateStr}` : ''}
            </span>
          </div>
        )}
      </section>

      {/* ─── Finished: podium ───────────────────────────────────────── */}
      {isFinished && podiumData && (
        <>
          <section className="-mx-4 px-4 py-10 border-b border-[var(--border)] mb-8">
            <h2 className="text-center text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-8">
              Classifica finale
            </h2>
            <TeamPodium podium={podiumData} />
          </section>

          <TopScorers scorers={podiumData.topScorers} />
        </>
      )}

      {/* ─── Finished: podium data not available ────────────────────── */}
      {isFinished && !podiumData && (
        <div className="text-center py-10 text-[var(--muted)]">
          <p className="text-sm">Dati podio non disponibili.</p>
        </div>
      )}

      {/* ─── In progress: featured match ────────────────────────────── */}
      {!isFinished && (
        <>
          <div className="max-w-lg mx-auto mb-8">
            {liveMatches.length > 0 ? (
              <div className="flex flex-col gap-4">
                {liveMatches.map((m, i) => (
                  <LiveMatchCard key={m.id} match={m} goals={liveMatchGoals[i] ?? []} />
                ))}
              </div>
            ) : nextMatch ? (
              <NextMatchCard match={nextMatch} />
            ) : (
              <div className="text-center py-10 text-[var(--muted)]">
                <p className="text-lg font-medium text-[var(--foreground)] mb-1">Nessuna partita in programma</p>
                <p className="text-sm">Il torneo è terminato o non ancora iniziato.</p>
              </div>
            )}
          </div>

          {listMatches.length > 0 && (
            <div className="max-w-lg mx-auto">
              <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">
                Altre partite oggi
              </h2>
              <div className="flex flex-col gap-2">
                {listMatches.map((m) => (
                  <MatchCard key={m.id} match={m} showGroup />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
