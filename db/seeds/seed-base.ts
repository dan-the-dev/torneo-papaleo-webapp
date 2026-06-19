import { config } from 'dotenv';
config({ path: '.env.local' });
import pool from '../client';
import { TEAMS, buildGroupMatches, buildKnockoutMatches } from './data';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Guard: skip if already applied
    const { rowCount } = await client.query(
      "SELECT 1 FROM seed_runs WHERE name = 'base'"
    );
    if (rowCount && rowCount > 0) {
      await client.query('ROLLBACK');
      console.log('Base seed already applied, skipping.');
      return;
    }

    // Reset application data
    await client.query('DELETE FROM match_events');
    await client.query('DELETE FROM knockout_slots');
    await client.query('DELETE FROM matches');
    await client.query('DELETE FROM players');
    await client.query('DELETE FROM teams');
    await client.query('DELETE FROM groups');

    // Reset sequences
    await client.query("SELECT setval(pg_get_serial_sequence('groups', 'id'), 1, false)");
    await client.query("SELECT setval(pg_get_serial_sequence('teams', 'id'), 1, false)");
    await client.query("SELECT setval(pg_get_serial_sequence('players', 'id'), 1, false)");
    await client.query("SELECT setval(pg_get_serial_sequence('matches', 'id'), 1, false)");
    await client.query("SELECT setval(pg_get_serial_sequence('match_events', 'id'), 1, false)");
    await client.query("SELECT setval(pg_get_serial_sequence('knockout_slots', 'id'), 1, false)");

    // Insert groups
    const groupIds: Record<string, number> = {};
    for (const g of ['A', 'B', 'C', 'D']) {
      const { rows } = await client.query<{ id: number }>(
        'INSERT INTO groups (name) VALUES ($1) RETURNING id',
        [g]
      );
      if (rows[0]) groupIds[g] = rows[0].id;
    }

    // Insert teams + players
    const teamIds: Record<string, number> = {};
    for (const team of TEAMS) {
      const gid = groupIds[team.group];
      if (!gid) throw new Error(`Group ${team.group} not found`);
      const { rows } = await client.query<{ id: number }>(
        `INSERT INTO teams (name, short_name, color_primary, color_secondary, group_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [team.name, team.short_name, team.color_primary, team.color_secondary, gid]
      );
      const teamId = rows[0]?.id;
      if (!teamId) throw new Error(`Failed to insert team ${team.name}`);
      teamIds[team.name] = teamId;

      for (const player of team.players) {
        await client.query(
          'INSERT INTO players (team_id, name, number) VALUES ($1, $2, $3)',
          [teamId, player.name, player.number]
        );
      }
    }

    // Insert group matches
    const groupMatches = buildGroupMatches();
    for (const m of groupMatches) {
      const gid = groupIds[m.group];
      const homeId = teamIds[m.home];
      const awayId = teamIds[m.away];
      if (!gid || !homeId || !awayId) throw new Error(`Match data missing for ${m.home} vs ${m.away}`);
      await client.query(
        `INSERT INTO matches (group_id, round, match_number, scheduled_at, team_home_id, team_away_id, status)
         VALUES ($1, 'group', $2, $3, $4, $5, 'scheduled')`,
        [gid, m.matchNumber, m.scheduledAt, homeId, awayId]
      );
    }

    // Insert knockout matches (no teams yet)
    const knockoutMatches = buildKnockoutMatches();
    for (const m of knockoutMatches) {
      await client.query(
        `INSERT INTO matches (round, match_number, scheduled_at, status)
         VALUES ($1, $2, $3, 'scheduled')`,
        [m.round, m.matchNumber, m.scheduledAt]
      );
    }

    // Mark seed as applied
    await client.query("INSERT INTO seed_runs (name) VALUES ('base')");

    await client.query('COMMIT');
    console.log('Base seed complete.');
    console.log(`Teams: ${TEAMS.length}, Groups: 4`);
    console.log(`Group matches: ${groupMatches.length}, Knockout matches: ${knockoutMatches.length}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
