import pool from '../client';

export interface PodiumTeam {
  name: string;
  short_name: string;
  color_primary: string;
  color_secondary: string;
}

export interface PodiumScorer {
  playerName: string;
  teamName: string;
  teamColorPrimary: string;
  teamColorSecondary: string;
  goals: number;
}

export interface PodiumData {
  first: PodiumTeam;
  second: PodiumTeam;
  third: PodiumTeam | null;
  finishedAt: Date | null;
  topScorers: PodiumScorer[];
}

interface FinalMatchRow {
  score_home: number;
  score_away: number;
  finished_at: Date | null;
  home_name: string;
  home_short: string;
  home_color: string;
  home_color_sec: string;
  away_name: string;
  away_short: string;
  away_color: string;
  away_color_sec: string;
}

function teamFromSide(row: FinalMatchRow, side: 'home' | 'away'): PodiumTeam {
  return side === 'home'
    ? {
        name: row.home_name,
        short_name: row.home_short,
        color_primary: row.home_color,
        color_secondary: row.home_color_sec,
      }
    : {
        name: row.away_name,
        short_name: row.away_short,
        color_primary: row.away_color,
        color_secondary: row.away_color_sec,
      };
}

const TEAM_FIELDS = `
  th.name AS home_name, th.short_name AS home_short,
  th.color_primary AS home_color, th.color_secondary AS home_color_sec,
  ta.name AS away_name, ta.short_name AS away_short,
  ta.color_primary AS away_color, ta.color_secondary AS away_color_sec`;

const TEAMS_JOIN = `
  JOIN teams th ON m.team_home_id = th.id
  JOIN teams ta ON m.team_away_id = ta.id`;

async function queryFinishedMatch(round: string): Promise<FinalMatchRow | null> {
  const { rows } = await pool.query<FinalMatchRow>(
    `SELECT m.score_home, m.score_away, m.finished_at,${TEAM_FIELDS}
     FROM matches m${TEAMS_JOIN}
     WHERE m.round = $1 AND m.status = 'finished'
     LIMIT 1`,
    [round]
  );
  return rows[0] ?? null;
}

export async function getPodiumData(): Promise<PodiumData | null> {
  const finalRow = await queryFinishedMatch('final');
  if (!finalRow) return null;

  const homeWins = finalRow.score_home > finalRow.score_away;
  const first = teamFromSide(finalRow, homeWins ? 'home' : 'away');
  const second = teamFromSide(finalRow, homeWins ? 'away' : 'home');

  const thirdRow = await queryFinishedMatch('3rd');
  let third: PodiumTeam | null = null;
  if (thirdRow) {
    const thirdHomeWins = thirdRow.score_home > thirdRow.score_away;
    third = teamFromSide(thirdRow, thirdHomeWins ? 'home' : 'away');
  }

  interface ScorerRow {
    player_name: string;
    team_name: string;
    team_color_primary: string;
    team_color_secondary: string;
    goals: string;
  }
  const { rows: scorerRows } = await pool.query<ScorerRow>(
    `SELECT
       p.name AS player_name,
       t.name AS team_name,
       t.color_primary AS team_color_primary,
       t.color_secondary AS team_color_secondary,
       COUNT(*)::text AS goals
     FROM match_events me
     JOIN players p ON me.player_id = p.id
     JOIN teams t ON p.team_id = t.id
     WHERE me.type = 'goal' AND me.player_id IS NOT NULL
     GROUP BY p.id, p.name, t.name, t.color_primary, t.color_secondary
     ORDER BY COUNT(*) DESC, p.name
     LIMIT 3`
  );

  const topScorers: PodiumScorer[] = scorerRows.map((r) => ({
    playerName: r.player_name,
    teamName: r.team_name,
    teamColorPrimary: r.team_color_primary,
    teamColorSecondary: r.team_color_secondary,
    goals: parseInt(r.goals, 10),
  }));

  return { first, second, third, finishedAt: finalRow.finished_at, topScorers };
}
