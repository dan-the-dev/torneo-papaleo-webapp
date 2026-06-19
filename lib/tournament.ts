import pool from '@/db/client';

export async function getTournamentState(): Promise<'not_started' | 'in_progress' | 'finished'> {
  const { rows } = await pool.query<{ finished_finals: string; any_played: string }>(
    `SELECT
       COUNT(*) FILTER (WHERE round = 'final' AND status = 'finished')::text AS finished_finals,
       COUNT(*) FILTER (WHERE status != 'scheduled')::text AS any_played
     FROM matches`
  );
  const r = rows[0];
  if (!r) return 'not_started';
  if (parseInt(r.finished_finals, 10) > 0) return 'finished';
  if (parseInt(r.any_played, 10) > 0) return 'in_progress';
  return 'not_started';
}
