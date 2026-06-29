import { requireAdmin } from '@/lib/auth';
import { getAllMatchesAdmin } from '@/db/queries/matches';
import { AdminPartiteList } from '@/components/admin/AdminPartiteList';
import type { MatchStatus } from '@/types/tournament';

export default async function AdminPartitePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireAdmin();
  const { filter } = await searchParams;
  const all = await getAllMatchesAdmin();

  const validFilters: MatchStatus[] = ['scheduled', 'live', 'finished'];
  const activeFilter = validFilters.find((f) => f === filter) ?? null;

  const matches = activeFilter ? all.filter((m) => m.status === activeFilter) : all;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Partite</h1>
      </div>

      <AdminPartiteList matches={matches} activeFilter={activeFilter} />
    </div>
  );
}
