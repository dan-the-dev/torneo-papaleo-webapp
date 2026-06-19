import { requireAdmin } from '@/lib/auth';
import { getKnockoutSlots, isGroupStageDone } from '@/db/queries/knockout';
import { getAllTeams } from '@/db/queries/teams';
import { TabelloneAdmin } from './TabelloneAdmin';

export default async function AdminTabellonePage() {
  await requireAdmin();
  const [slots, teams, groupDone] = await Promise.all([
    getKnockoutSlots(),
    getAllTeams(),
    isGroupStageDone(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Gestione tabellone</h1>
      <TabelloneAdmin slots={slots} teams={teams} groupDone={groupDone} />
    </div>
  );
}
