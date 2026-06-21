import pool from '../client';

export async function isBracketPublished(): Promise<boolean> {
  const { rows } = await pool.query<{ value: string }>(
    `SELECT value FROM tournament_config WHERE key = 'bracket_published'`,
  );
  return rows[0]?.value === 'true';
}

export async function setBracketPublished(published: boolean): Promise<void> {
  await pool.query(
    `INSERT INTO tournament_config (key, value) VALUES ('bracket_published', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [published ? 'true' : 'false'],
  );
}
