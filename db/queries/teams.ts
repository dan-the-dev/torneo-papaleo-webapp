import pool from '../client';
import type { Team } from '@/types/tournament';

export async function getAllTeams(): Promise<Team[]> {
  const { rows } = await pool.query<Team>('SELECT * FROM teams ORDER BY name');
  return rows;
}

export async function getTeamById(id: number): Promise<Team | null> {
  const { rows } = await pool.query<Team>('SELECT * FROM teams WHERE id = $1', [id]);
  return rows[0] ?? null;
}
