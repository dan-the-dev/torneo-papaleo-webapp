import { getKnockoutSlots, isGroupStageDone } from '@/db/queries/knockout';
import type { KnockoutSlotWithDetails, Round } from '@/types/tournament';
import Link from 'next/link';

const ROUND_ORDER: Round[] = ['r16', 'qf', 'sf', 'final'];
const ROUND_LABELS: Record<Round, string> = {
  r16: 'Ottavi',
  qf: 'Quarti',
  sf: 'Semifinali',
  '3rd': 'Fin. 3°',
  final: 'Finale',
  group: 'Girone',
};

function SlotCard({ slot }: { slot: KnockoutSlotWithDetails }) {
  const content = slot.team ? (
    <div className="flex items-center gap-2">
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: slot.team.color_primary }}
      />
      <span className="text-xs font-medium text-white truncate">{slot.team.name}</span>
    </div>
  ) : (
    <span className="text-xs text-[var(--muted)]">Da definire</span>
  );

  if (slot.match_id) {
    return (
      <Link href={`/gironi/${slot.match_id}`}>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 hover:border-[#e87425]/50 transition-colors">
          {content}
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2">
      {content}
    </div>
  );
}

function MatchSlotPair({
  home,
  away,
}: {
  home: KnockoutSlotWithDetails | undefined;
  away: KnockoutSlotWithDetails | undefined;
}) {
  return (
    <div className="flex flex-col gap-1">
      {home ? <SlotCard slot={home} /> : <div className="h-9 bg-[var(--card)] border border-[var(--border)] rounded-lg" />}
      {away ? <SlotCard slot={away} /> : <div className="h-9 bg-[var(--card)] border border-[var(--border)] rounded-lg" />}
    </div>
  );
}

export default async function TabellonePage() {
  const slots = await getKnockoutSlots();
  const groupDone = await isGroupStageDone();

  const slotsByRound = new Map<Round, KnockoutSlotWithDetails[]>();
  for (const slot of slots) {
    const arr = slotsByRound.get(slot.round) ?? [];
    arr.push(slot);
    slotsByRound.set(slot.round, arr);
  }

  const thirdPlace = slotsByRound.get('3rd') ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-4">Tabellone</h1>

      {!groupDone && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 text-sm text-yellow-400">
          ⏳ Il tabellone si aggiornerà al termine della fase a gironi.
        </div>
      )}

      {/* Main bracket */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {ROUND_ORDER.map((round) => {
            const roundSlots = (slotsByRound.get(round) ?? []).sort(
              (a, b) => a.slot_number - b.slot_number
            );

            const pairs: Array<[KnockoutSlotWithDetails | undefined, KnockoutSlotWithDetails | undefined]> = [];
            for (let i = 0; i < roundSlots.length; i += 2) {
              pairs.push([roundSlots[i], roundSlots[i + 1]]);
            }

            return (
              <div key={round} className="flex flex-col">
                <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide text-center mb-3">
                  {ROUND_LABELS[round]}
                </p>
                <div
                  className="flex flex-col gap-3"
                  style={{
                    justifyContent: round === 'final' ? 'center' : undefined,
                    flex: round === 'final' ? '1' : undefined,
                    marginTop: round === 'qf' ? '3rem' : round === 'sf' ? '7rem' : round === 'final' ? '11rem' : undefined,
                  }}
                >
                  {pairs.length > 0 ? (
                    pairs.map((pair, i) => (
                      <div key={i} className="w-40">
                        <MatchSlotPair home={pair[0]} away={pair[1]} />
                      </div>
                    ))
                  ) : (
                    <div className="w-40">
                      <MatchSlotPair home={undefined} away={undefined} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3rd place */}
      {(thirdPlace.length > 0 || groupDone) && (
        <div className="mt-8 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide mb-3">
            Finale 3°/4° posto
          </p>
          <div className="w-40">
            <MatchSlotPair home={thirdPlace[0]} away={thirdPlace[1]} />
          </div>
        </div>
      )}
    </div>
  );
}
