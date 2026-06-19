import { config } from 'dotenv';
config({ path: '.env.local' });
import pool from '../client';

async function reset() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM match_events');
    await client.query('DELETE FROM knockout_slots');
    await client.query('DELETE FROM matches');
    await client.query('DELETE FROM players');
    await client.query('DELETE FROM teams');
    await client.query('DELETE FROM groups');
    await client.query("DELETE FROM seed_runs WHERE name = 'base'");

    await client.query("SELECT setval(pg_get_serial_sequence('groups', 'id'), 1, false)");
    await client.query("SELECT setval(pg_get_serial_sequence('teams', 'id'), 1, false)");
    await client.query("SELECT setval(pg_get_serial_sequence('players', 'id'), 1, false)");
    await client.query("SELECT setval(pg_get_serial_sequence('matches', 'id'), 1, false)");
    await client.query("SELECT setval(pg_get_serial_sequence('match_events', 'id'), 1, false)");
    await client.query("SELECT setval(pg_get_serial_sequence('knockout_slots', 'id'), 1, false)");

    await client.query('COMMIT');
    console.log('Reset complete — all application data cleared.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

reset().catch((err) => {
  console.error(err);
  process.exit(1);
});
