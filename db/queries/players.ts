import pool from '../client';
import type { Player, TopScorer, Team } from '@/types/tournament';

export async function getPlayersByTeam(teamId: number): Promise<Player[]> {
  const { rows } = await pool.query<Player>(
    'SELECT * FROM players WHERE team_id = $1 ORDER BY number NULLS LAST, name',
    [teamId]
  );
  return rows;
}

export async function getAllPlayers(): Promise<(Player & { team: Team })[]> {
  interface Row extends Player {
    team: Team;
  }
  const { rows } = await pool.query<Row>(
    `SELECT p.*, row_to_json(t) AS team
     FROM players p
     JOIN teams t ON p.team_id = t.id
     ORDER BY t.name, p.name`
  );
  return rows;
}

export async function getTopScorers(): Promise<TopScorer[]> {
  interface Row {
    player: Player;
    team: Team;
    goals: string;
    assists: string;
  }
  const { rows } = await pool.query<Row>(
    `SELECT
       row_to_json(p) AS player,
       row_to_json(t) AS team,
       COUNT(*) FILTER (WHERE me.type = 'goal')::text AS goals,
       COUNT(*) FILTER (WHERE me.type = 'assist')::text AS assists
     FROM match_events me
     JOIN players p ON me.player_id = p.id
     JOIN teams t ON p.team_id = t.id
     WHERE me.type IN ('goal', 'assist') AND me.player_id IS NOT NULL
     GROUP BY p.id, p.team_id, p.name, p.number, t.id, t.name, t.short_name, t.color_primary, t.color_secondary, t.group_id
     HAVING COUNT(*) FILTER (WHERE me.type = 'goal') > 0
     ORDER BY COUNT(*) FILTER (WHERE me.type = 'goal') DESC,
              COUNT(*) FILTER (WHERE me.type = 'assist') DESC,
              p.name`
  );

  return rows.map((r) => ({
    player: r.player,
    team: r.team,
    goals: parseInt(r.goals, 10),
    assists: parseInt(r.assists, 10),
  }));
}

export async function getTopAssisters(): Promise<TopScorer[]> {
  interface Row {
    player: Player;
    team: Team;
    goals: string;
    assists: string;
  }
  const { rows } = await pool.query<Row>(
    `SELECT
       row_to_json(p) AS player,
       row_to_json(t) AS team,
       COUNT(*) FILTER (WHERE me.type = 'goal')::text AS goals,
       COUNT(*) FILTER (WHERE me.type = 'assist')::text AS assists
     FROM match_events me
     JOIN players p ON me.player_id = p.id
     JOIN teams t ON p.team_id = t.id
     WHERE me.type IN ('goal', 'assist') AND me.player_id IS NOT NULL
     GROUP BY p.id, p.team_id, p.name, p.number, t.id, t.name, t.short_name, t.color_primary, t.color_secondary, t.group_id
     HAVING COUNT(*) FILTER (WHERE me.type = 'assist') > 0
     ORDER BY COUNT(*) FILTER (WHERE me.type = 'assist') DESC,
              COUNT(*) FILTER (WHERE me.type = 'goal') DESC,
              p.name`
  );

  return rows.map((r) => ({
    player: r.player,
    team: r.team,
    goals: parseInt(r.goals, 10),
    assists: parseInt(r.assists, 10),
  }));
}
