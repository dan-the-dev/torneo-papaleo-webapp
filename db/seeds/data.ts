export interface TeamSeed {
  name: string;
  short_name: string;
  players: Array<{ name: string; number: number | null }>;
}

function placeholderPlayers(): Array<{ name: string; number: number | null }> {
  return Array.from({ length: 5 }, (_, i) => ({
    name: `Giocatore ${i + 1}`,
    number: i + 1,
  }));
}

// 16 official tournament teams. Player names are placeholders — will be updated.
export const TEAMS: TeamSeed[] = [
  { name: "LASSU' FC",                   short_name: 'LSS', players: placeholderPlayers() },
  { name: 'FC INGIOCABILI (FORSE)',       short_name: 'ING', players: placeholderPlayers() },
  { name: 'CRAZY TEAM',                  short_name: 'CRZ', players: placeholderPlayers() },
  { name: 'SQUADRA NERA',                short_name: 'SNR', players: placeholderPlayers() },
  { name: 'F.C. MURETTI',               short_name: 'MUR', players: placeholderPlayers() },
  { name: 'LA CASETTA FC',              short_name: 'CAS', players: placeholderPlayers() },
  { name: "FC. AL LHUNEDI'",             short_name: 'LHU', players: placeholderPlayers() },
  { name: 'F.C. PACHA',                 short_name: 'PAC', players: placeholderPlayers() },
  { name: 'AS SONION',                  short_name: 'SON', players: placeholderPlayers() },
  { name: 'I CRACKS',                   short_name: 'CRK', players: placeholderPlayers() },
  { name: 'BLOCCO-02',                  short_name: 'BLK', players: placeholderPlayers() },
  { name: 'GARPEZ UNITED',              short_name: 'GAR', players: placeholderPlayers() },
  { name: 'TRANCIO SICILIANO',          short_name: 'TRC', players: placeholderPlayers() },
  { name: 'VERDE E GIARDINI MONDELLO',  short_name: 'VGM', players: placeholderPlayers() },
  { name: 'ARCORESE',                   short_name: 'ARC', players: placeholderPlayers() },
  { name: 'LE BUMME',                   short_name: 'BUM', players: placeholderPlayers() },
];

// Real group-stage schedule. Times are Europe/Rome (UTC+2 in summer); stored as UTC via pg.
export const GROUP_MATCHES: Array<{
  home: string;
  away: string;
  scheduledAt: string;
  matchNumber: number;
}> = [
  // Serata 1 — 29 giugno 2025
  { matchNumber:  1, home: "LASSU' FC",               away: 'FC INGIOCABILI (FORSE)',      scheduledAt: '2025-06-29T20:00:00+02:00' },
  { matchNumber:  2, home: 'CRAZY TEAM',               away: 'SQUADRA NERA',                scheduledAt: '2025-06-29T20:30:00+02:00' },
  { matchNumber:  3, home: 'F.C. MURETTI',             away: 'LA CASETTA FC',               scheduledAt: '2025-06-29T21:00:00+02:00' },
  { matchNumber:  4, home: "FC. AL LHUNEDI'",          away: 'CRAZY TEAM',                  scheduledAt: '2025-06-29T21:30:00+02:00' },
  { matchNumber:  5, home: 'LA CASETTA FC',            away: 'FC INGIOCABILI (FORSE)',      scheduledAt: '2025-06-29T22:00:00+02:00' },
  { matchNumber:  6, home: "FC. AL LHUNEDI'",          away: 'F.C. PACHA',                  scheduledAt: '2025-06-29T22:30:00+02:00' },
  // Serata 2 — 1 luglio 2025
  { matchNumber:  7, home: 'AS SONION',                away: 'F.C. PACHA',                  scheduledAt: '2025-07-01T19:30:00+02:00' },
  { matchNumber:  8, home: 'I CRACKS',                 away: 'LA CASETTA FC',               scheduledAt: '2025-07-01T20:00:00+02:00' },
  { matchNumber:  9, home: 'BLOCCO-02',                away: 'GARPEZ UNITED',               scheduledAt: '2025-07-01T20:30:00+02:00' },
  { matchNumber: 10, home: 'TRANCIO SICILIANO',        away: 'VERDE E GIARDINI MONDELLO',   scheduledAt: '2025-07-01T21:00:00+02:00' },
  { matchNumber: 11, home: 'GARPEZ UNITED',            away: "FC. AL LHUNEDI'",             scheduledAt: '2025-07-01T21:30:00+02:00' },
  { matchNumber: 12, home: 'BLOCCO-02',                away: "LASSU' FC",                   scheduledAt: '2025-07-01T22:00:00+02:00' },
  // Serata 3 — 3 luglio 2025
  { matchNumber: 13, home: 'AS SONION',                away: 'TRANCIO SICILIANO',           scheduledAt: '2025-07-03T19:30:00+02:00' },
  { matchNumber: 14, home: 'ARCORESE',                 away: 'GARPEZ UNITED',               scheduledAt: '2025-07-03T20:00:00+02:00' },
  { matchNumber: 15, home: 'LE BUMME',                 away: 'VERDE E GIARDINI MONDELLO',   scheduledAt: '2025-07-03T20:30:00+02:00' },
  { matchNumber: 16, home: 'F.C. MURETTI',             away: 'CRAZY TEAM',                  scheduledAt: '2025-07-03T21:00:00+02:00' },
  { matchNumber: 17, home: 'VERDE E GIARDINI MONDELLO', away: 'BLOCCO-02',                  scheduledAt: '2025-07-03T21:30:00+02:00' },
  { matchNumber: 18, home: 'LE BUMME',                 away: 'F.C. MURETTI',                scheduledAt: '2025-07-03T22:00:00+02:00' },
  // Serata 4 — 6 luglio 2025
  { matchNumber: 19, home: 'ARCORESE',                 away: 'F.C. PACHA',                  scheduledAt: '2025-07-06T19:30:00+02:00' },
  { matchNumber: 20, home: 'SQUADRA NERA',             away: 'I CRACKS',                    scheduledAt: '2025-07-06T20:00:00+02:00' },
  { matchNumber: 21, home: 'LE BUMME',                 away: 'FC INGIOCABILI (FORSE)',      scheduledAt: '2025-07-06T20:30:00+02:00' },
  { matchNumber: 22, home: 'SQUADRA NERA',             away: 'AS SONION',                   scheduledAt: '2025-07-06T21:00:00+02:00' },
  { matchNumber: 23, home: 'ARCORESE',                 away: 'I CRACKS',                    scheduledAt: '2025-07-06T21:30:00+02:00' },
  { matchNumber: 24, home: "LASSU' FC",                away: 'TRANCIO SICILIANO',           scheduledAt: '2025-07-06T22:00:00+02:00' },
];

export function buildKnockoutMatches(): Array<{
  round: 'r16' | 'qf' | 'sf' | '3rd' | 'final';
  matchNumber: number;
  scheduledAt: string;
}> {
  const matches: Array<{
    round: 'r16' | 'qf' | 'sf' | '3rd' | 'final';
    matchNumber: number;
    scheduledAt: string;
  }> = [];

  // R16: July 10 — 8 matches from 17:00, every 30 min
  for (let i = 0; i < 8; i++) {
    const hour = 17 + Math.floor(i / 2);
    const min = i % 2 === 0 ? '00' : '30';
    matches.push({
      round: 'r16',
      matchNumber: i + 1,
      scheduledAt: `2025-07-10T${String(hour).padStart(2, '0')}:${min}:00+02:00`,
    });
  }

  // QF: July 10 — 4 matches from 21:00, every 30 min (provisional scheduling)
  for (let i = 0; i < 4; i++) {
    const hour = 21 + Math.floor(i / 2);
    const min = i % 2 === 0 ? '00' : '30';
    matches.push({
      round: 'qf',
      matchNumber: i + 1,
      scheduledAt: `2025-07-10T${String(hour).padStart(2, '0')}:${min}:00+02:00`,
    });
  }

  // SF: July 11
  matches.push({ round: 'sf',    matchNumber: 1, scheduledAt: '2025-07-11T18:00:00+02:00' });
  matches.push({ round: 'sf',    matchNumber: 2, scheduledAt: '2025-07-11T19:30:00+02:00' });
  // Finals: July 11
  matches.push({ round: '3rd',   matchNumber: 1, scheduledAt: '2025-07-11T21:00:00+02:00' });
  matches.push({ round: 'final', matchNumber: 1, scheduledAt: '2025-07-11T22:00:00+02:00' });

  return matches;
}
