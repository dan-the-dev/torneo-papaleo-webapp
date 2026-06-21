import { requireAdmin } from '@/lib/auth';
import { getAllTeams } from '@/db/queries/teams';
import { getKnockoutSlots, getR16MatchSlots } from '@/db/queries/knockout';
import { isBracketPublished } from '@/db/queries/config';
import { TabelloneAdmin } from './TabelloneAdmin';

export default async function AdminTabellonePage() {
  await requireAdmin();

  const [teams, r16Matches, slots, published] = await Promise.all([
    getAllTeams(),
    getR16MatchSlots(),
    getKnockoutSlots(),
    isBracketPublished(),
  ]);

  const qfSlots = slots.filter((s) => s.round === 'qf');
  const sfSlots = slots.filter((s) => s.round === 'sf');
  const finalSlots = slots.filter((s) => s.round === 'final');
  const thirdSlots = slots.filter((s) => s.round === '3rd');

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Tabellone</h1>
      <TabelloneAdmin
        teams={teams}
        r16Matches={r16Matches}
        qfSlots={qfSlots}
        sfSlots={sfSlots}
        finalSlots={finalSlots}
        thirdSlots={thirdSlots}
        initialPublished={published}
      />
    </div>
  );
}
