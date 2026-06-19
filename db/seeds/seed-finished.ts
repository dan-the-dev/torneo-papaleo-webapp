/**
 * Complete tournament seed — all 40 matches played, Falchi Rossi champions.
 *
 * Group standings (computed from GROUP_SCORES):
 *   A: 1st Falchi Rossi · 2nd Lupi Verdi · 3rd Tigri Nere · 4th Aquile Blu
 *   B: 1st Leoni Dorati · 2nd Orsi Bruni · 3rd Pantere Viola · 4th Delfini Celesti
 *   C: 1st Tori Arancioni · 2nd Squali Bianchi · 3rd Serpenti Gialli · 4th Corvi Argento
 *   D: 1st Draghi Rossi · 2nd Gabbiani Bianchi · 3rd Lupi Azzurri · 4th Volpi Rosse
 *
 * Bracket path (via R16_SEEDING slot assignments):
 *   R16:  FAL-ORS, TOR-GAB, LEO-LUP, DRA-SQU(SQU wins), TIG-DEL, SER-VOL, PAN-AQU, LAZ-COR(GAB wins)
 *   QF:   FAL-TOR, LEO-SQU, TIG-SER, PAN-GAB
 *   SF:   FAL-LEO, TIG-PAN
 *   3rd:  LEO-PAN → LEO wins bronze
 *   Final: FAL-TIG → FAL wins 🏆
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { Pool, type PoolClient } from 'pg';
import { TEAMS, buildGroupMatches, buildKnockoutMatches } from './data';

// Local copy of the old seeding (kept here for seed accuracy — separate from
// the live automatic seeding in lib/bracket.ts)
const R16_SEEDING: Array<{ slot: number; group: string; position: number }[]> = [
  [{ slot: 1, group: 'A', position: 1 }, { slot: 2, group: 'B', position: 2 }],
  [{ slot: 3, group: 'C', position: 1 }, { slot: 4, group: 'D', position: 2 }],
  [{ slot: 5, group: 'B', position: 1 }, { slot: 6, group: 'A', position: 2 }],
  [{ slot: 7, group: 'D', position: 1 }, { slot: 8, group: 'C', position: 2 }],
  [{ slot: 9, group: 'A', position: 3 }, { slot: 10, group: 'B', position: 4 }],
  [{ slot: 11, group: 'C', position: 3 }, { slot: 12, group: 'D', position: 4 }],
  [{ slot: 13, group: 'B', position: 3 }, { slot: 14, group: 'A', position: 4 }],
  [{ slot: 15, group: 'D', position: 3 }, { slot: 16, group: 'C', position: 4 }],
];

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });

// ─── Group results ────────────────────────────────────────────────────────────
// matchNumber → [scoreHome, scoreAway]
const GROUP_SCORES: Record<number, [number, number]> = {
  // Round 1 – Jul 4
  1: [3, 1], 2: [2, 2], 3: [4, 0], 4: [1, 3],
  5: [1, 2], 6: [4, 1], 7: [2, 0], 8: [1, 3],
  // Round 2 – Jul 5
  9: [3, 2], 10: [0, 1], 11: [3, 2], 12: [0, 1],
  13: [2, 3], 14: [4, 1], 15: [1, 0], 16: [2, 4],
  // Round 3 – Jul 6
  17: [2, 1], 18: [0, 2], 19: [2, 2], 20: [3, 1],
  21: [3, 0], 22: [1, 1], 23: [2, 2], 24: [1, 3],
};

// ─── Knockout results ─────────────────────────────────────────────────────────
// matchNumber → [scoreHome, scoreAway, homeSide wins? (true=home)]
interface KOResult { home: number; away: number }
const KO_SCORES: Record<number, KOResult> = {
  // R16 – Jul 11
  25: { home: 3, away: 1 }, // FAL beat ORS
  26: { home: 2, away: 1 }, // TOR beat GAB
  27: { home: 2, away: 0 }, // LEO beat LUP
  28: { home: 1, away: 2 }, // DRA lost to SQU (upset)
  29: { home: 3, away: 2 }, // TIG beat DEL
  30: { home: 4, away: 0 }, // SER beat VOL
  31: { home: 2, away: 0 }, // PAN beat AQU
  32: { home: 1, away: 0 }, // GAB beat COR
  // QF – Jul 12
  33: { home: 2, away: 0 }, // FAL beat TOR
  34: { home: 3, away: 1 }, // LEO beat SQU
  35: { home: 1, away: 0 }, // TIG beat SER
  36: { home: 2, away: 1 }, // PAN beat GAB
  // SF – Jul 18
  37: { home: 2, away: 1 }, // FAL beat LEO
  38: { home: 1, away: 0 }, // TIG beat PAN
  // 3rd place – Jul 19
  39: { home: 3, away: 2 }, // LEO beat PAN → LEO bronze
  // Final – Jul 19
  40: { home: 2, away: 0 }, // FAL beat TIG → FALCHI ROSSI CHAMPIONS 🏆
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function resetData(c: PoolClient): Promise<void> {
  await c.query('DELETE FROM match_events');
  await c.query('DELETE FROM knockout_slots');
  await c.query('DELETE FROM matches');
  await c.query('DELETE FROM players');
  await c.query('DELETE FROM teams');
  await c.query('DELETE FROM groups');
  for (const tbl of ['groups', 'teams', 'players', 'matches', 'match_events', 'knockout_slots']) {
    await c.query(`SELECT setval(pg_get_serial_sequence('${tbl}', 'id'), 1, false)`);
  }
}

async function insertBaseData(c: PoolClient): Promise<{
  groupIds: Record<string, number>;
  teamIds: Record<string, number>;
  playerIdsByTeam: Record<number, number[]>;
}> {
  const groupIds: Record<string, number> = {};
  for (const g of ['A', 'B', 'C', 'D']) {
    const { rows } = await c.query<{ id: number }>(
      'INSERT INTO groups (name) VALUES ($1) RETURNING id', [g]
    );
    if (rows[0]) groupIds[g] = rows[0].id;
  }

  const teamIds: Record<string, number> = {};
  const playerIdsByTeam: Record<number, number[]> = {};

  for (const team of TEAMS) {
    const gid = groupIds[team.group];
    if (!gid) throw new Error(`Group ${team.group} missing`);
    const { rows } = await c.query<{ id: number }>(
      `INSERT INTO teams (name, short_name, color_primary, color_secondary, group_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [team.name, team.short_name, team.color_primary, team.color_secondary, gid]
    );
    const tid = rows[0]?.id;
    if (!tid) throw new Error(`Team insert failed: ${team.name}`);
    teamIds[team.name] = tid;
    playerIdsByTeam[tid] = [];
    for (const p of team.players) {
      const { rows: pr } = await c.query<{ id: number }>(
        'INSERT INTO players (team_id, name, number) VALUES ($1,$2,$3) RETURNING id',
        [tid, p.name, p.number]
      );
      if (pr[0]) playerIdsByTeam[tid]?.push(pr[0].id);
    }
  }
  return { groupIds, teamIds, playerIdsByTeam };
}

async function insertMatches(
  c: PoolClient,
  groupIds: Record<string, number>,
  teamIds: Record<string, number>
): Promise<Record<number, number>> {
  const matchDbIds: Record<number, number> = {};

  for (const m of buildGroupMatches()) {
    const gid = groupIds[m.group];
    const hid = teamIds[m.home];
    const aid = teamIds[m.away];
    if (!gid || !hid || !aid) throw new Error(`Match data missing: ${m.home} vs ${m.away}`);
    const { rows } = await c.query<{ id: number }>(
      `INSERT INTO matches (group_id, round, match_number, scheduled_at, team_home_id, team_away_id, status)
       VALUES ($1,'group',$2,$3,$4,$5,'scheduled') RETURNING id`,
      [gid, m.matchNumber, m.scheduledAt, hid, aid]
    );
    if (rows[0]) matchDbIds[m.matchNumber] = rows[0].id;
  }

  for (const m of buildKnockoutMatches()) {
    const { rows } = await c.query<{ id: number }>(
      `INSERT INTO matches (round, match_number, scheduled_at, status)
       VALUES ($1,$2,$3,'scheduled') RETURNING id`,
      [m.round, m.matchNumber, m.scheduledAt]
    );
    if (rows[0]) matchDbIds[m.matchNumber] = rows[0].id;
  }

  return matchDbIds;
}

async function addGoals(
  c: PoolClient,
  matchId: number,
  teamId: number,
  players: number[],
  count: number,
  startMinute: number
): Promise<void> {
  for (let i = 0; i < count; i++) {
    const pid = players[i % players.length] ?? null;
    await c.query(
      'INSERT INTO match_events (match_id, player_id, team_id, type, minute) VALUES ($1,$2,$3,$4,$5)',
      [matchId, pid, teamId, 'goal', startMinute + i * 4]
    );
    // Add assist for most goals
    if (i % 2 === 0 && players.length > 1) {
      const assistPid = players[(i + 1) % players.length] ?? null;
      await c.query(
        'INSERT INTO match_events (match_id, player_id, team_id, type, minute) VALUES ($1,$2,$3,$4,$5)',
        [matchId, assistPid, teamId, 'assist', startMinute + i * 4]
      );
    }
  }
}

async function applyGroupResults(
  c: PoolClient,
  matchDbIds: Record<number, number>,
  playerIdsByTeam: Record<number, number[]>
): Promise<void> {
  interface MatchRow {
    id: number;
    match_number: number;
    team_home_id: number;
    team_away_id: number;
  }
  const { rows: groupMatches } = await c.query<MatchRow>(
    "SELECT id, match_number, team_home_id, team_away_id FROM matches WHERE round='group' ORDER BY match_number"
  );

  for (const [mnStr, score] of Object.entries(GROUP_SCORES)) {
    const mn = parseInt(mnStr, 10);
    const match = groupMatches.find((m) => m.match_number === mn);
    if (!match) { console.warn(`Group match ${mn} not found`); continue; }
    const [sh, sa] = score;

    await c.query(
      "UPDATE matches SET status='finished', score_home=$1, score_away=$2 WHERE id=$3",
      [sh, sa, match.id]
    );

    const hPlayers = playerIdsByTeam[match.team_home_id] ?? [];
    const aPlayers = playerIdsByTeam[match.team_away_id] ?? [];
    await addGoals(c, match.id, match.team_home_id, hPlayers, sh, 5);
    await addGoals(c, match.id, match.team_away_id, aPlayers, sa, 8);
  }
}

// Returns group standings: array of team_ids in order 1st→4th
async function getGroupStandings(c: PoolClient, groupId: number): Promise<number[]> {
  interface StandingRow {
    team_id: number;
    pts: number;
    gd: number;
    gf: number;
  }
  const { rows: teams } = await c.query<{ id: number }>(
    'SELECT id FROM teams WHERE group_id=$1', [groupId]
  );

  const standings = new Map<number, { pts: number; gf: number; ga: number; gd: number }>();
  for (const t of teams) standings.set(t.id, { pts: 0, gf: 0, ga: 0, gd: 0 });

  const { rows: matches } = await c.query<{
    team_home_id: number; team_away_id: number; score_home: number; score_away: number;
  }>(`SELECT team_home_id, team_away_id, score_home, score_away
      FROM matches WHERE group_id=$1 AND status='finished'`, [groupId]);

  for (const m of matches) {
    const h = standings.get(m.team_home_id);
    const a = standings.get(m.team_away_id);
    if (!h || !a) continue;
    h.gf += m.score_home; h.ga += m.score_away; h.gd = h.gf - h.ga;
    a.gf += m.score_away; a.ga += m.score_home; a.gd = a.gf - a.ga;
    if (m.score_home > m.score_away) { h.pts += 3; }
    else if (m.score_home < m.score_away) { a.pts += 3; }
    else { h.pts++; a.pts++; }
  }

  return Array.from(standings.entries())
    .sort(([, a], [, b]) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    .map(([id]) => id);
}

async function generateR16Slots(
  c: PoolClient,
  groupIds: Record<string, number>
): Promise<Record<number, number>> {
  // slot number → team_id
  const slotToTeam: Record<number, number> = {};
  const standingsCache = new Map<string, number[]>();

  for (const group of Object.keys(groupIds)) {
    const gid = groupIds[group];
    if (gid !== undefined) {
      standingsCache.set(group, await getGroupStandings(c, gid));
    }
  }

  for (const pair of R16_SEEDING) {
    for (const entry of pair) {
      const standings = standingsCache.get(entry.group) ?? [];
      const teamId = standings[entry.position - 1];
      if (teamId !== undefined) {
        slotToTeam[entry.slot] = teamId;
        await c.query(
          `INSERT INTO knockout_slots (round, slot_number, team_id)
           VALUES ('r16',$1,$2)
           ON CONFLICT (round, slot_number) DO UPDATE SET team_id=EXCLUDED.team_id`,
          [entry.slot, teamId]
        );
      }
    }
  }
  return slotToTeam;
}

interface MatchRow {
  id: number;
  match_number: number;
  team_home_id: number | null;
  team_away_id: number | null;
}

async function getKOMatches(c: PoolClient): Promise<MatchRow[]> {
  const { rows } = await c.query<MatchRow>(
    "SELECT id, match_number, team_home_id, team_away_id FROM matches WHERE round!='group' ORDER BY match_number"
  );
  return rows;
}

async function applyKOMatch(
  c: PoolClient,
  matchId: number,
  homeTeamId: number,
  awayTeamId: number,
  score: KOResult,
  playerIdsByTeam: Record<number, number[]>
): Promise<{ winnerId: number; loserId: number }> {
  await c.query(
    "UPDATE matches SET team_home_id=$1, team_away_id=$2, status='finished', score_home=$3, score_away=$4 WHERE id=$5",
    [homeTeamId, awayTeamId, score.home, score.away, matchId]
  );

  const hPlayers = playerIdsByTeam[homeTeamId] ?? [];
  const aPlayers = playerIdsByTeam[awayTeamId] ?? [];
  await addGoals(c, matchId, homeTeamId, hPlayers, score.home, 3);
  await addGoals(c, matchId, awayTeamId, aPlayers, score.away, 6);

  const winnerId = score.home >= score.away ? homeTeamId : awayTeamId;
  const loserId = score.home >= score.away ? awayTeamId : homeTeamId;
  return { winnerId, loserId };
}

async function upsertSlot(c: PoolClient, round: string, slotNumber: number, teamId: number): Promise<void> {
  await c.query(
    `INSERT INTO knockout_slots (round, slot_number, team_id)
     VALUES ($1,$2,$3)
     ON CONFLICT (round, slot_number) DO UPDATE SET team_id=EXCLUDED.team_id`,
    [round, slotNumber, teamId]
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Resetting data...');
    await resetData(client);

    console.log('Inserting teams, groups, players...');
    const { groupIds, teamIds, playerIdsByTeam } = await insertBaseData(client);

    console.log('Inserting match schedule...');
    const matchDbIds = await insertMatches(client, groupIds, teamIds);

    console.log('Applying group stage results...');
    await applyGroupResults(client, matchDbIds, playerIdsByTeam);

    console.log('Generating R16 bracket from standings...');
    const r16Slots = await generateR16Slots(client, groupIds);
    // r16Slots: slot_number → team_id (slots 1-16)

    const koMatches = await getKOMatches(client);
    const matchByNum = new Map(koMatches.map((m) => [m.match_number, m]));

    // ── R16 (matches 25-32) ──
    // Each pair of consecutive slots forms one match: (1,2)→25, (3,4)→26, ...
    console.log('R16...');
    const qfSlots: Record<number, number> = {}; // qf slot → winner team_id
    let qfSlotCounter = 1;

    for (let i = 0; i < 8; i++) {
      const matchNum = 25 + i;
      const homeSlot = i * 2 + 1;
      const awaySlot = i * 2 + 2;
      const homeTeam = r16Slots[homeSlot];
      const awayTeam = r16Slots[awaySlot];
      const match = matchByNum.get(matchNum);
      const score = KO_SCORES[matchNum];
      if (!match || !homeTeam || !awayTeam || !score) {
        console.warn(`R16 match ${matchNum} data missing`); continue;
      }

      const { winnerId } = await applyKOMatch(
        client, match.id, homeTeam, awayTeam, score, playerIdsByTeam
      );
      qfSlots[qfSlotCounter++] = winnerId;
    }

    // ── QF (matches 33-36) ──
    console.log('QF...');
    const sfSlots: Record<number, number> = {};
    let sfSlotCounter = 1;

    for (let i = 0; i < 4; i++) {
      const matchNum = 33 + i;
      const homeSlot = i * 2 + 1;
      const awaySlot = i * 2 + 2;
      const homeTeam = qfSlots[homeSlot];
      const awayTeam = qfSlots[awaySlot];
      const match = matchByNum.get(matchNum);
      const score = KO_SCORES[matchNum];
      if (!match || !homeTeam || !awayTeam || !score) {
        console.warn(`QF match ${matchNum} data missing`); continue;
      }

      await upsertSlot(client, 'qf', homeSlot, homeTeam);
      await upsertSlot(client, 'qf', awaySlot, awayTeam);

      const { winnerId } = await applyKOMatch(
        client, match.id, homeTeam, awayTeam, score, playerIdsByTeam
      );
      sfSlots[sfSlotCounter++] = winnerId;
    }

    // ── SF (matches 37-38) ──
    console.log('SF...');
    const finalSlots: Record<number, number> = {};
    const thirdSlots: Record<number, number> = {};

    for (let i = 0; i < 2; i++) {
      const matchNum = 37 + i;
      const homeSlot = i * 2 + 1;
      const awaySlot = i * 2 + 2;
      const homeTeam = sfSlots[homeSlot];
      const awayTeam = sfSlots[awaySlot];
      const match = matchByNum.get(matchNum);
      const score = KO_SCORES[matchNum];
      if (!match || !homeTeam || !awayTeam || !score) {
        console.warn(`SF match ${matchNum} data missing`); continue;
      }

      await upsertSlot(client, 'sf', homeSlot, homeTeam);
      await upsertSlot(client, 'sf', awaySlot, awayTeam);

      const { winnerId, loserId } = await applyKOMatch(
        client, match.id, homeTeam, awayTeam, score, playerIdsByTeam
      );
      finalSlots[i + 1] = winnerId;
      thirdSlots[i + 1] = loserId;
    }

    // ── 3rd place (match 39) ──
    console.log('3rd place...');
    {
      const homeTeam = thirdSlots[1];
      const awayTeam = thirdSlots[2];
      const match = matchByNum.get(39);
      const score = KO_SCORES[39];
      if (match && homeTeam && awayTeam && score) {
        await upsertSlot(client, '3rd', 1, homeTeam);
        await upsertSlot(client, '3rd', 2, awayTeam);
        await applyKOMatch(client, match.id, homeTeam, awayTeam, score, playerIdsByTeam);
      }
    }

    // ── Final (match 40) ──
    console.log('Final...');
    {
      const homeTeam = finalSlots[1];
      const awayTeam = finalSlots[2];
      const match = matchByNum.get(40);
      const score = KO_SCORES[40];
      if (match && homeTeam && awayTeam && score) {
        await upsertSlot(client, 'final', 1, homeTeam);
        await upsertSlot(client, 'final', 2, awayTeam);
        await applyKOMatch(client, match.id, homeTeam, awayTeam, score, playerIdsByTeam);
      }
    }

    await client.query('COMMIT');

    // ── Summary ──
    interface SummaryRow { name: string }
    const { rows: champ } = await client.query<SummaryRow>(
      `SELECT t.name FROM matches m
       JOIN teams t ON t.id = CASE WHEN m.score_home > m.score_away THEN m.team_home_id ELSE m.team_away_id END
       WHERE m.round = 'final' AND m.status = 'finished'`
    );
    interface StatRow { total: string; finished: string; goals: string }
    const { rows: stats } = await client.query<StatRow>(
      `SELECT COUNT(*)::text AS total,
              COUNT(*) FILTER (WHERE status='finished')::text AS finished,
              (SELECT COUNT(*)::text FROM match_events WHERE type='goal') AS goals
       FROM matches`
    );

    console.log('\n✅ Complete tournament seed done.');
    console.log(`   Matches: ${stats[0]?.finished ?? '?'}/${stats[0]?.total ?? '?'} played`);
    console.log(`   Goals recorded: ${stats[0]?.goals ?? '?'}`);
    console.log(`   🏆 Champion: ${champ[0]?.name ?? '?'}`);
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
