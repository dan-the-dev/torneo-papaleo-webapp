import { config } from 'dotenv';
config({ path: '.env.local' });
import pool from '../client';
import { TEAMS } from './data';

interface TeamRow {
  id: number;
  name: string;
}

interface PlayerRow {
  id: number;
  name: string;
  number: number | null;
}

async function syncRosters() {
  const client = await pool.connect();
  const stats = { added: 0, updated: 0, removed: 0, kept: 0 };

  try {
    await client.query('BEGIN');

    const { rows: teams } = await client.query<TeamRow>('SELECT id, name FROM teams');

    for (const seedTeam of TEAMS) {
      const team = teams.find((t) => t.name === seedTeam.name);
      if (!team) {
        console.warn(`Team not found in DB, skipping: ${seedTeam.name}`);
        continue;
      }

      const { rows: existing } = await client.query<PlayerRow>(
        'SELECT id, name, number FROM players WHERE team_id = $1',
        [team.id]
      );

      const existingByName = new Map(existing.map((p) => [p.name, p]));
      const seedNames = new Set(seedTeam.players.map((p) => p.name));

      for (const seedPlayer of seedTeam.players) {
        const current = existingByName.get(seedPlayer.name);
        if (!current) {
          await client.query(
            'INSERT INTO players (team_id, name, number) VALUES ($1, $2, $3)',
            [team.id, seedPlayer.name, seedPlayer.number]
          );
          stats.added++;
          console.log(`  + ${seedTeam.short_name}: ${seedPlayer.name}`);
          continue;
        }

        if (current.number !== seedPlayer.number) {
          await client.query('UPDATE players SET number = $1 WHERE id = $2', [
            seedPlayer.number,
            current.id,
          ]);
          stats.updated++;
          console.log(`  ~ ${seedTeam.short_name}: ${seedPlayer.name} (number updated)`);
        }
      }

      for (const player of existing) {
        if (seedNames.has(player.name)) continue;

        const { rowCount } = await client.query(
          'SELECT 1 FROM match_events WHERE player_id = $1 LIMIT 1',
          [player.id]
        );
        const hasEvents = (rowCount ?? 0) > 0;

        if (hasEvents) {
          stats.kept++;
          console.warn(
            `  ! ${seedTeam.short_name}: kept ${player.name} (has match events, not in roster)`
          );
          continue;
        }

        await client.query('DELETE FROM players WHERE id = $1', [player.id]);
        stats.removed++;
        console.log(`  - ${seedTeam.short_name}: ${player.name}`);
      }
    }

    await client.query('COMMIT');
    console.log('\nRoster sync complete.');
    console.log(
      `Added: ${stats.added}, updated: ${stats.updated}, removed: ${stats.removed}, kept (with events): ${stats.kept}`
    );
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

syncRosters().catch((err) => {
  console.error(err);
  process.exit(1);
});
