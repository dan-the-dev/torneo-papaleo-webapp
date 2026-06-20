import pool from '../client';
import type { Group, Team, Match, GroupStanding, MatchWithTeams } from '@/types/tournament';

export async function getAllGroups(): Promise<Group[]> {
  const { rows } = await pool.query<Group>(
    'SELECT * FROM groups ORDER BY name'
  );
  return rows;
}

export async function getGroupStandings(groupId: number): Promise<GroupStanding[]> {
  const { rows: teams } = await pool.query<Team>(
    'SELECT * FROM teams WHERE group_id = $1',
    [groupId]
  );

  const { rows: matches } = await pool.query<Match>(
    `SELECT * FROM matches
     WHERE group_id = $1 AND status IN ('finished', 'live')`,
    [groupId]
  );

  const standings: Map<number, GroupStanding> = new Map();
  for (const team of teams) {
    standings.set(team.id, {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      goal_diff: 0,
      points: 0,
    });
  }

  for (const match of matches) {
    if (match.score_home === null || match.score_away === null) continue;
    const home = standings.get(match.team_home_id);
    const away = standings.get(match.team_away_id);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goals_for += match.score_home;
    home.goals_against += match.score_away;
    away.goals_for += match.score_away;
    away.goals_against += match.score_home;
    home.goal_diff = home.goals_for - home.goals_against;
    away.goal_diff = away.goals_for - away.goals_against;

    if (match.score_home > match.score_away) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (match.score_home < match.score_away) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }
  }

  const result = Array.from(standings.values());

  // Tiebreaker order per regulation: pts → gd → gf → ga (fewer is better) → sorteggio
  result.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_diff !== a.goal_diff) return b.goal_diff - a.goal_diff;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    if (a.goals_against !== b.goals_against) return a.goals_against - b.goals_against;
    return 0; // sorteggio — resolved manually
  });

  return result;
}

export async function getGroupWithMatches(groupId: number): Promise<{
  group: Group;
  standings: GroupStanding[];
  matches: MatchWithTeams[];
  isFinished: boolean;
}> {
  const { rows: groupRows } = await pool.query<Group>(
    'SELECT * FROM groups WHERE id = $1',
    [groupId]
  );
  const group = groupRows[0];
  if (!group) throw new Error(`Group ${groupId} not found`);

  const standings = await getGroupStandings(groupId);

  const { rows: matches } = await pool.query<MatchWithTeams>(
    `SELECT m.*,
       row_to_json(th) AS team_home,
       row_to_json(ta) AS team_away
     FROM matches m
     JOIN teams th ON m.team_home_id = th.id
     JOIN teams ta ON m.team_away_id = ta.id
     WHERE m.group_id = $1
     ORDER BY m.scheduled_at, m.match_number`,
    [groupId]
  );

  const isFinished = matches.length > 0 && matches.every((m) => m.status === 'finished');

  return { group, standings, matches, isFinished };
}
