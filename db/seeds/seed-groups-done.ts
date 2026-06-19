import { config } from 'dotenv';
config({ path: '.env.local' });
import pool from '../client';
import { execSync } from 'child_process';
import { join } from 'path';

// Group stage results — each group: 6 matches with scores
const GROUP_RESULTS: Array<{
  matchNumber: number;
  scoreHome: number;
  scoreAway: number;
  goalEvents: Array<{ teamSide: 'home' | 'away'; playerIndex: number; minute: number }>;
  assistEvents: Array<{ teamSide: 'home' | 'away'; playerIndex: number; minute: number }>;
}> = [
  // Group A matches (1-6)
  { matchNumber: 1, scoreHome: 3, scoreAway: 1, goalEvents: [{ teamSide: 'home', playerIndex: 3, minute: 5 }, { teamSide: 'home', playerIndex: 4, minute: 12 }, { teamSide: 'away', playerIndex: 3, minute: 18 }, { teamSide: 'home', playerIndex: 2, minute: 25 }], assistEvents: [{ teamSide: 'home', playerIndex: 1, minute: 5 }, { teamSide: 'home', playerIndex: 2, minute: 12 }] },
  { matchNumber: 2, scoreHome: 2, scoreAway: 2, goalEvents: [{ teamSide: 'home', playerIndex: 2, minute: 8 }, { teamSide: 'away', playerIndex: 3, minute: 14 }, { teamSide: 'away', playerIndex: 4, minute: 22 }, { teamSide: 'home', playerIndex: 4, minute: 28 }], assistEvents: [{ teamSide: 'away', playerIndex: 1, minute: 14 }] },
  { matchNumber: 3, scoreHome: 4, scoreAway: 0, goalEvents: [{ teamSide: 'home', playerIndex: 3, minute: 4 }, { teamSide: 'home', playerIndex: 3, minute: 11 }, { teamSide: 'home', playerIndex: 4, minute: 19 }, { teamSide: 'home', playerIndex: 2, minute: 27 }], assistEvents: [{ teamSide: 'home', playerIndex: 4, minute: 4 }, { teamSide: 'home', playerIndex: 1, minute: 11 }] },
  { matchNumber: 4, scoreHome: 1, scoreAway: 3, goalEvents: [{ teamSide: 'home', playerIndex: 3, minute: 7 }, { teamSide: 'away', playerIndex: 4, minute: 13 }, { teamSide: 'away', playerIndex: 2, minute: 20 }, { teamSide: 'away', playerIndex: 3, minute: 29 }], assistEvents: [{ teamSide: 'away', playerIndex: 5, minute: 13 }] },
  { matchNumber: 5, scoreHome: 2, scoreAway: 1, goalEvents: [{ teamSide: 'home', playerIndex: 4, minute: 6 }, { teamSide: 'away', playerIndex: 2, minute: 15 }, { teamSide: 'home', playerIndex: 2, minute: 24 }], assistEvents: [{ teamSide: 'home', playerIndex: 3, minute: 6 }] },
  { matchNumber: 6, scoreHome: 0, scoreAway: 2, goalEvents: [{ teamSide: 'away', playerIndex: 3, minute: 10 }, { teamSide: 'away', playerIndex: 4, minute: 26 }], assistEvents: [{ teamSide: 'away', playerIndex: 2, minute: 10 }] },
  // Group B matches (7-12)
  { matchNumber: 7, scoreHome: 2, scoreAway: 0, goalEvents: [{ teamSide: 'home', playerIndex: 3, minute: 8 }, { teamSide: 'home', playerIndex: 4, minute: 22 }], assistEvents: [{ teamSide: 'home', playerIndex: 1, minute: 8 }] },
  { matchNumber: 8, scoreHome: 1, scoreAway: 3, goalEvents: [{ teamSide: 'home', playerIndex: 3, minute: 14 }, { teamSide: 'away', playerIndex: 2, minute: 7 }, { teamSide: 'away', playerIndex: 3, minute: 19 }, { teamSide: 'away', playerIndex: 4, minute: 27 }], assistEvents: [{ teamSide: 'away', playerIndex: 4, minute: 7 }] },
  { matchNumber: 9, scoreHome: 3, scoreAway: 2, goalEvents: [{ teamSide: 'home', playerIndex: 4, minute: 5 }, { teamSide: 'home', playerIndex: 2, minute: 13 }, { teamSide: 'away', playerIndex: 3, minute: 17 }, { teamSide: 'home', playerIndex: 3, minute: 23 }, { teamSide: 'away', playerIndex: 4, minute: 28 }], assistEvents: [{ teamSide: 'home', playerIndex: 3, minute: 5 }] },
  { matchNumber: 10, scoreHome: 0, scoreAway: 1, goalEvents: [{ teamSide: 'away', playerIndex: 3, minute: 20 }], assistEvents: [] },
  { matchNumber: 11, scoreHome: 2, scoreAway: 2, goalEvents: [{ teamSide: 'home', playerIndex: 3, minute: 9 }, { teamSide: 'away', playerIndex: 2, minute: 16 }, { teamSide: 'home', playerIndex: 4, minute: 21 }, { teamSide: 'away', playerIndex: 3, minute: 29 }], assistEvents: [{ teamSide: 'home', playerIndex: 2, minute: 9 }] },
  { matchNumber: 12, scoreHome: 3, scoreAway: 1, goalEvents: [{ teamSide: 'home', playerIndex: 2, minute: 6 }, { teamSide: 'home', playerIndex: 3, minute: 14 }, { teamSide: 'away', playerIndex: 4, minute: 20 }, { teamSide: 'home', playerIndex: 4, minute: 27 }], assistEvents: [] },
  // Group C matches (13-18)
  { matchNumber: 13, scoreHome: 1, scoreAway: 2, goalEvents: [{ teamSide: 'home', playerIndex: 3, minute: 12 }, { teamSide: 'away', playerIndex: 3, minute: 8 }, { teamSide: 'away', playerIndex: 4, minute: 25 }], assistEvents: [{ teamSide: 'away', playerIndex: 2, minute: 8 }] },
  { matchNumber: 14, scoreHome: 4, scoreAway: 1, goalEvents: [{ teamSide: 'home', playerIndex: 4, minute: 3 }, { teamSide: 'home', playerIndex: 2, minute: 10 }, { teamSide: 'home', playerIndex: 3, minute: 18 }, { teamSide: 'away', playerIndex: 3, minute: 22 }, { teamSide: 'home', playerIndex: 4, minute: 28 }], assistEvents: [{ teamSide: 'home', playerIndex: 3, minute: 3 }] },
  { matchNumber: 15, scoreHome: 2, scoreAway: 3, goalEvents: [{ teamSide: 'home', playerIndex: 3, minute: 7 }, { teamSide: 'away', playerIndex: 2, minute: 11 }, { teamSide: 'home', playerIndex: 4, minute: 19 }, { teamSide: 'away', playerIndex: 3, minute: 23 }, { teamSide: 'away', playerIndex: 4, minute: 29 }], assistEvents: [] },
  { matchNumber: 16, scoreHome: 0, scoreAway: 0, goalEvents: [], assistEvents: [] },
  { matchNumber: 17, scoreHome: 3, scoreAway: 0, goalEvents: [{ teamSide: 'home', playerIndex: 3, minute: 5 }, { teamSide: 'home', playerIndex: 4, minute: 15 }, { teamSide: 'home', playerIndex: 2, minute: 26 }], assistEvents: [{ teamSide: 'home', playerIndex: 2, minute: 5 }] },
  { matchNumber: 18, scoreHome: 1, scoreAway: 1, goalEvents: [{ teamSide: 'home', playerIndex: 3, minute: 16 }, { teamSide: 'away', playerIndex: 3, minute: 24 }], assistEvents: [] },
  // Group D matches (19-24)
  { matchNumber: 19, scoreHome: 2, scoreAway: 1, goalEvents: [{ teamSide: 'home', playerIndex: 3, minute: 9 }, { teamSide: 'home', playerIndex: 4, minute: 18 }, { teamSide: 'away', playerIndex: 2, minute: 23 }], assistEvents: [{ teamSide: 'home', playerIndex: 2, minute: 9 }] },
  { matchNumber: 20, scoreHome: 3, scoreAway: 3, goalEvents: [{ teamSide: 'home', playerIndex: 3, minute: 4 }, { teamSide: 'away', playerIndex: 3, minute: 10 }, { teamSide: 'home', playerIndex: 4, minute: 17 }, { teamSide: 'away', playerIndex: 4, minute: 21 }, { teamSide: 'home', playerIndex: 2, minute: 26 }, { teamSide: 'away', playerIndex: 2, minute: 30 }], assistEvents: [] },
  { matchNumber: 21, scoreHome: 1, scoreAway: 0, goalEvents: [{ teamSide: 'home', playerIndex: 3, minute: 20 }], assistEvents: [{ teamSide: 'home', playerIndex: 4, minute: 20 }] },
  { matchNumber: 22, scoreHome: 2, scoreAway: 4, goalEvents: [{ teamSide: 'home', playerIndex: 3, minute: 6 }, { teamSide: 'away', playerIndex: 2, minute: 11 }, { teamSide: 'away', playerIndex: 3, minute: 15 }, { teamSide: 'home', playerIndex: 4, minute: 22 }, { teamSide: 'away', playerIndex: 4, minute: 25 }, { teamSide: 'away', playerIndex: 3, minute: 29 }], assistEvents: [] },
  { matchNumber: 23, scoreHome: 2, scoreAway: 2, goalEvents: [{ teamSide: 'home', playerIndex: 4, minute: 8 }, { teamSide: 'away', playerIndex: 3, minute: 14 }, { teamSide: 'home', playerIndex: 3, minute: 23 }, { teamSide: 'away', playerIndex: 2, minute: 28 }], assistEvents: [] },
  { matchNumber: 24, scoreHome: 1, scoreAway: 3, goalEvents: [{ teamSide: 'home', playerIndex: 3, minute: 13 }, { teamSide: 'away', playerIndex: 3, minute: 7 }, { teamSide: 'away', playerIndex: 4, minute: 19 }, { teamSide: 'away', playerIndex: 2, minute: 27 }], assistEvents: [{ teamSide: 'away', playerIndex: 5, minute: 7 }] },
];

async function seed() {
  // First run base seed
  console.log('Running base seed...');
  execSync(`npx tsx ${join(__dirname, 'seed-base.ts')}`, { stdio: 'inherit', env: process.env });

  // Get a new pool since base seed ends the pool
  const { default: pool2 } = await import('../client');
  const client = await pool2.connect();

  try {
    await client.query('BEGIN');

    // Fetch all matches with teams + players
    interface MatchRow {
      id: number;
      match_number: number;
      team_home_id: number;
      team_away_id: number;
    }
    const { rows: matches } = await client.query<MatchRow>(
      "SELECT id, match_number, team_home_id, team_away_id FROM matches WHERE round = 'group' ORDER BY match_number"
    );

    interface PlayerRow {
      id: number;
      team_id: number;
    }
    const { rows: players } = await client.query<PlayerRow>('SELECT id, team_id FROM players ORDER BY id');

    const playersByTeam = new Map<number, number[]>();
    for (const p of players) {
      const arr = playersByTeam.get(p.team_id) ?? [];
      arr.push(p.id);
      playersByTeam.set(p.team_id, arr);
    }

    for (const result of GROUP_RESULTS) {
      const match = matches.find((m) => m.match_number === result.matchNumber);
      if (!match) {
        console.warn(`Match ${result.matchNumber} not found`);
        continue;
      }

      await client.query(
        "UPDATE matches SET status = 'finished', score_home = $1, score_away = $2 WHERE id = $3",
        [result.scoreHome, result.scoreAway, match.id]
      );

      const homePlayers = playersByTeam.get(match.team_home_id) ?? [];
      const awayPlayers = playersByTeam.get(match.team_away_id) ?? [];

      for (const ev of result.goalEvents) {
        const teamId = ev.teamSide === 'home' ? match.team_home_id : match.team_away_id;
        const teamPlayers = ev.teamSide === 'home' ? homePlayers : awayPlayers;
        const playerId = teamPlayers[ev.playerIndex] ?? teamPlayers[0] ?? null;
        await client.query(
          'INSERT INTO match_events (match_id, player_id, team_id, type, minute) VALUES ($1,$2,$3,$4,$5)',
          [match.id, playerId, teamId, 'goal', ev.minute]
        );
      }

      for (const ev of result.assistEvents) {
        const teamId = ev.teamSide === 'home' ? match.team_home_id : match.team_away_id;
        const teamPlayers = ev.teamSide === 'home' ? homePlayers : awayPlayers;
        const playerId = teamPlayers[ev.playerIndex] ?? teamPlayers[0] ?? null;
        await client.query(
          'INSERT INTO match_events (match_id, player_id, team_id, type, minute) VALUES ($1,$2,$3,$4,$5)',
          [match.id, playerId, teamId, 'assist', ev.minute]
        );
      }
    }

    await client.query('COMMIT');
    console.log('Groups-done seed complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool2.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
