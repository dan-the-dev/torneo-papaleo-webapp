import { getKnockoutSlots } from '@/db/queries/knockout';
import { isBracketPublished } from '@/db/queries/config';
import { getKnockoutPlaceholderLabel } from '@/lib/bracketLabels';
import type { KnockoutSlotWithDetails, Round } from '@/types/tournament';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';

const ROUND_LABELS: Record<Round, string> = {
  r16: 'Ottavi',
  qf: 'Quarti',
  sf: 'Semifinali',
  '3rd': 'Fin. 3°',
  final: 'Finale',
  group: 'Girone',
};

const WAITING_LABEL = '⏳ In attesa del sorteggio';

const DESKTOP_ROUNDS: Round[] = ['r16', 'qf', 'sf', 'final'];
const MOBILE_ROUNDS: Round[] = ['r16', 'qf', 'sf', '3rd', 'final'];
const DESKTOP_PAIR_COUNTS: Partial<Record<Round, number>> = { qf: 4, sf: 2, final: 1 };

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  });
}

// ─── Waiting-for-draw nodes ───────────────────────────────────────────────────

function WaitingDesktopNode() {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-dashed border-[var(--border)] bg-[var(--card)]/60">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)]/50">
        <div className="w-2 h-2 rounded-full flex-shrink-0 bg-[var(--muted)]" />
        <span className="text-xs flex-1 truncate italic text-[var(--muted)]">{WAITING_LABEL}</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="w-2 h-2 rounded-full flex-shrink-0 bg-[var(--muted)]" />
        <span className="text-xs flex-1 truncate italic text-[var(--muted)]">{WAITING_LABEL}</span>
      </div>
    </div>
  );
}

function WaitingMobileCard() {
  return (
    <div className="bg-[var(--card)]/60 border border-dashed border-[var(--border)] rounded-xl p-4 text-center">
      <span className="text-xs italic text-[var(--muted)]">{WAITING_LABEL}</span>
    </div>
  );
}

// ─── Desktop match node ───────────────────────────────────────────────────────

function DesktopMatchNode({
  home, away, homeLabel, awayLabel,
}: {
  home: KnockoutSlotWithDetails | null;
  away: KnockoutSlotWithDetails | null;
  homeLabel?: string | undefined;
  awayLabel?: string | undefined;
}) {
  const match = home?.match ?? away?.match ?? null;
  const isPlayed = match?.status === 'finished' || match?.status === 'live';
  const isLive = match?.status === 'live';
  const sh = match?.score_home ?? null;
  const sa = match?.score_away ?? null;
  const homeWon = isPlayed && sh !== null && sa !== null && sh > sa;
  const awayWon = isPlayed && sh !== null && sa !== null && sa > sh;

  const node = (
    <div className={`w-full rounded-xl overflow-hidden border transition-colors bg-[var(--card)] ${
      isLive ? 'border-[#e87425]/60' : 'border-[var(--border)]'
    } ${match ? 'group-hover:border-[#e87425]/60' : ''}`}>
      {/* Home row */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] ${homeWon ? 'bg-[var(--surface-hover)]' : ''}`}>
        <div className="w-2 h-2 rounded-full flex-shrink-0 bg-[#e87425] border border-[#141414]" />
        <span className={`text-xs flex-1 truncate ${
          home?.team ? 'text-[var(--foreground)] font-medium' : 'italic text-[var(--muted)]'
        }`}>
          {home?.team ? home.team.name : (homeLabel ?? 'Da definire')}
        </span>
        {isPlayed && (
          <span className={`text-sm font-bold tabular-nums flex-shrink-0 ml-1 ${homeWon ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`}>
            {sh ?? 0}
          </span>
        )}
      </div>
      {/* Away row */}
      <div className={`flex items-center gap-2 px-3 py-2 ${awayWon ? 'bg-[var(--surface-hover)]' : ''}`}>
        <div className="w-2 h-2 rounded-full flex-shrink-0 bg-[#141414] border border-[#e87425]" />
        <span className={`text-xs flex-1 truncate ${
          away?.team ? 'text-[var(--foreground)] font-medium' : 'italic text-[var(--muted)]'
        }`}>
          {away?.team ? away.team.name : (awayLabel ?? 'Da definire')}
        </span>
        {isPlayed && (
          <span className={`text-sm font-bold tabular-nums flex-shrink-0 ml-1 ${awayWon ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`}>
            {sa ?? 0}
          </span>
        )}
      </div>
      {/* Status strip — only for live/scheduled */}
      {match && match.status !== 'finished' && (
        <div className="border-t border-[var(--border)] px-3 py-1 flex justify-center">
          <StatusBadge status={match.status} />
        </div>
      )}
    </div>
  );

  if (match) {
    return (
      <Link href={`/gironi/${match.id}`} className="block group cursor-pointer">
        {node}
      </Link>
    );
  }
  return node;
}

// ─── Mobile match card ────────────────────────────────────────────────────────

function MobileMatchCard({
  home, away, homeLabel, awayLabel,
}: {
  home: KnockoutSlotWithDetails | null;
  away: KnockoutSlotWithDetails | null;
  homeLabel?: string | undefined;
  awayLabel?: string | undefined;
}) {
  const match = home?.match ?? away?.match ?? null;
  const isPlayed = match?.status === 'finished' || match?.status === 'live';
  const isLive = match?.status === 'live';
  const sh = match?.score_home ?? null;
  const sa = match?.score_away ?? null;
  const homeWon = isPlayed && sh !== null && sa !== null && sh > sa;
  const awayWon = isPlayed && sh !== null && sa !== null && sa > sh;

  const card = (
    <div className={`bg-[var(--card)] border rounded-xl p-4 transition-colors ${
      isLive ? 'border-[#e87425]/50' : 'border-[var(--border)]'
    } ${match ? 'hover:border-[#e87425]/50 hover:bg-[var(--surface-hover)]' : ''}`}>
      <div className="flex items-center gap-3">
        {/* Home team */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0 bg-[#e87425] border-2 border-[#141414]" />
            {home?.team ? (
              <span className="text-sm font-semibold truncate text-[var(--foreground)]">
                {home.team.name}
              </span>
            ) : (
              <span className="text-xs italic text-[var(--muted)] truncate">{homeLabel ?? 'Da definire'}</span>
            )}
          </div>
        </div>

        {/* Score / time */}
        <div className="flex-shrink-0 text-center min-w-[64px]">
          {isPlayed ? (
            <div className="flex items-center justify-center gap-1.5">
              <span className={`text-xl font-bold tabular-nums ${homeWon ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`}>
                {sh ?? 0}
              </span>
              <span className="text-[var(--muted)] text-sm">–</span>
              <span className={`text-xl font-bold tabular-nums ${awayWon ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`}>
                {sa ?? 0}
              </span>
            </div>
          ) : match ? (
            <span className="text-sm font-medium text-[var(--muted)]">
              {formatTime(match.scheduled_at)}
            </span>
          ) : (
            <span className="text-sm text-[var(--muted)]">vs</span>
          )}
          {match && (
            <div className="mt-1 flex justify-center">
              <StatusBadge status={match.status} />
            </div>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-end gap-2">
            {away?.team ? (
              <span className="text-sm font-semibold truncate text-[var(--foreground)]">
                {away.team.name}
              </span>
            ) : (
              <span className="text-xs italic text-[var(--muted)] truncate">{awayLabel ?? 'Da definire'}</span>
            )}
            <div className="w-3 h-3 rounded-full flex-shrink-0 bg-[#141414] border-2 border-[#e87425]" />
          </div>
        </div>

        {/* Chevron */}
        {match && (
          <span className="text-[var(--muted)] flex-shrink-0 text-base leading-none">›</span>
        )}
      </div>
    </div>
  );

  if (match) {
    return (
      <Link href={`/gironi/${match.id}`} className="block cursor-pointer">
        {card}
      </Link>
    );
  }
  return card;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TabellonePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const published = await isBracketPublished();
  const params = await searchParams;
  const slots = await getKnockoutSlots();

  // Index slots by round → slot_number for O(1) lookup
  const slotsByRound = new Map<Round, Map<number, KnockoutSlotWithDetails>>();
  for (const slot of slots) {
    if (!slotsByRound.has(slot.round)) slotsByRound.set(slot.round, new Map());
    slotsByRound.get(slot.round)!.set(slot.slot_number, slot);
  }

  const r16SlotMap = slotsByRound.get('r16') ?? new Map<number, KnockoutSlotWithDetails>();
  const thirdPlaceMap = slotsByRound.get('3rd') ?? new Map<number, KnockoutSlotWithDetails>();

  // First round that has non-finished matches, defaulting to r16
  const activeRound: Round = (['r16', 'qf', 'sf', 'final'] as Round[]).find((r) => {
    const roundMap = slotsByRound.get(r);
    return roundMap && [...roundMap.values()].some((s) => s.match?.status !== 'finished');
  }) ?? 'r16';

  const rawRoundParam = Array.isArray(params['round']) ? params['round'][0] : params['round'];
  const validMobileRounds = new Set<string>(MOBILE_ROUNDS);
  const selectedRound: Round =
    rawRoundParam !== undefined && validMobileRounds.has(rawRoundParam)
      ? (rawRoundParam as Round)
      : activeRound;

  function getMobilePairs(round: Round): Array<{
    home: KnockoutSlotWithDetails | null;
    away: KnockoutSlotWithDetails | null;
    homeLabel?: string | undefined;
    awayLabel?: string | undefined;
  }> {
    if (round === '3rd') {
      return [{
        home: thirdPlaceMap.get(1) ?? null,
        away: thirdPlaceMap.get(2) ?? null,
        homeLabel: getKnockoutPlaceholderLabel('3rd', 1) ?? undefined,
        awayLabel: getKnockoutPlaceholderLabel('3rd', 2) ?? undefined,
      }];
    }
    const count = round === 'r16' ? 8 : round === 'qf' ? 4 : round === 'sf' ? 2 : 1;
    const roundMap = round === 'r16' ? r16SlotMap : (slotsByRound.get(round) ?? new Map<number, KnockoutSlotWithDetails>());
    return Array.from({ length: count }, (_, i) => ({
      home: roundMap.get(i * 2 + 1) ?? null,
      away: roundMap.get(i * 2 + 2) ?? null,
      homeLabel: getKnockoutPlaceholderLabel(round, i * 2 + 1) ?? undefined,
      awayLabel: getKnockoutPlaceholderLabel(round, i * 2 + 2) ?? undefined,
    }));
  }

  const mobilePairs = getMobilePairs(selectedRound);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">Tabellone</h1>

      {!published && (
        <div className="bg-[#e87425]/10 border border-[#e87425]/40 rounded-xl p-4 mb-6 text-sm text-[#e87425]">
          Il tabellone verrà definito al termine della fase a gironi con un sorteggio ufficiale.
        </div>
      )}

      {/* ─── Mobile: round chips + match cards (hidden on lg+) ─────────── */}
      <div className="lg:hidden">
        <div className="-mx-4 px-4">
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            {MOBILE_ROUNDS.map((r) => (
              <Link
                key={r}
                href={`?round=${r}`}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedRound === r
                    ? 'bg-[#e87425] text-white'
                    : 'bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {ROUND_LABELS[r]}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {mobilePairs.map((pair, i) => (
            published ? (
              <MobileMatchCard
                key={i}
                home={pair.home}
                away={pair.away}
                homeLabel={pair.homeLabel}
                awayLabel={pair.awayLabel}
              />
            ) : (
              <WaitingMobileCard key={i} />
            )
          ))}
        </div>
      </div>

      {/* ─── Desktop: horizontal bracket (shown on lg+) ─────────────────── */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {DESKTOP_ROUNDS.map((round) => {
              const marginTop =
                round === 'qf' ? '3rem'
                : round === 'sf' ? '7rem'
                : round === 'final' ? '11rem'
                : undefined;

              if (round === 'r16') {
                return (
                  <div key={round} className="flex flex-col">
                    <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide text-center mb-3">
                      {ROUND_LABELS[round]}
                    </p>
                    <div className="flex flex-col gap-3">
                      {Array.from({ length: 8 }, (_, i) => (
                        <div key={i} className="w-44">
                          {published ? (
                            <DesktopMatchNode
                              home={r16SlotMap.get(i * 2 + 1) ?? null}
                              away={r16SlotMap.get(i * 2 + 2) ?? null}
                            />
                          ) : (
                            <WaitingDesktopNode />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              const pairCount = DESKTOP_PAIR_COUNTS[round] ?? 1;
              const roundSlotMap = slotsByRound.get(round) ?? new Map<number, KnockoutSlotWithDetails>();

              return (
                <div key={round} className="flex flex-col">
                  <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide text-center mb-3">
                    {ROUND_LABELS[round]}
                  </p>
                  <div className="flex flex-col gap-3" style={{ marginTop }}>
                    {Array.from({ length: pairCount }, (_, i) => (
                      <div key={i} className="w-44">
                        {published ? (
                          <DesktopMatchNode
                            home={roundSlotMap.get(i * 2 + 1) ?? null}
                            away={roundSlotMap.get(i * 2 + 2) ?? null}
                            homeLabel={getKnockoutPlaceholderLabel(round, i * 2 + 1) ?? undefined}
                            awayLabel={getKnockoutPlaceholderLabel(round, i * 2 + 2) ?? undefined}
                          />
                        ) : (
                          <WaitingDesktopNode />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3rd place */}
        <div className="mt-8 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide mb-3">
            Finale 3°/4° posto
          </p>
          <div className="w-44">
            {published ? (
              <DesktopMatchNode
                home={thirdPlaceMap.get(1) ?? null}
                away={thirdPlaceMap.get(2) ?? null}
                homeLabel={getKnockoutPlaceholderLabel('3rd', 1) ?? undefined}
                awayLabel={getKnockoutPlaceholderLabel('3rd', 2) ?? undefined}
              />
            ) : (
              <WaitingDesktopNode />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
