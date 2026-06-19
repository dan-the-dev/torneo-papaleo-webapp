export interface TeamSeed {
  name: string;
  short_name: string;
  color_primary: string;
  color_secondary: string;
  group: 'A' | 'B' | 'C' | 'D';
  players: Array<{ name: string; number: number | null }>;
}

export const TEAMS: TeamSeed[] = [
  {
    name: 'Falchi Rossi',
    short_name: 'FAL',
    color_primary: '#E63946',
    color_secondary: '#FFFFFF',
    group: 'A',
    players: [
      { name: 'Marco Rossi', number: 1 },
      { name: 'Luca Bianchi', number: 5 },
      { name: 'Giovanni Ferrari', number: 7 },
      { name: 'Andrea Ricci', number: 9 },
      { name: 'Stefano Marino', number: 10 },
      { name: 'Paolo Greco', number: 11 },
      { name: 'Francesco Bruno', number: 3 },
    ],
  },
  {
    name: 'Aquile Blu',
    short_name: 'AQU',
    color_primary: '#1D3557',
    color_secondary: '#A8DADC',
    group: 'A',
    players: [
      { name: 'Alberto Costa', number: 1 },
      { name: 'Roberto Gallo', number: 4 },
      { name: 'Davide Conti', number: 8 },
      { name: 'Matteo Mancini', number: 10 },
      { name: 'Simone Vitale', number: 6 },
      { name: 'Claudio Leone', number: 7 },
      { name: 'Emanuele Serra', number: 2 },
    ],
  },
  {
    name: 'Lupi Verdi',
    short_name: 'LUP',
    color_primary: '#2D6A4F',
    color_secondary: '#B7E4C7',
    group: 'A',
    players: [
      { name: 'Nicola Martini', number: 1 },
      { name: 'Daniele Russo', number: 5 },
      { name: 'Salvatore De Luca', number: 9 },
      { name: 'Tommaso Esposito', number: 7 },
      { name: 'Vincenzo Romano', number: 11 },
      { name: 'Antonio Ferrara', number: 3 },
      { name: 'Riccardo Lombardi', number: 6 },
    ],
  },
  {
    name: 'Tigri Nere',
    short_name: 'TIG',
    color_primary: '#333333',
    color_secondary: '#FFD700',
    group: 'A',
    players: [
      { name: 'Massimo Rizzi', number: 1 },
      { name: 'Luigi Caruso', number: 4 },
      { name: 'Fabio Palumbo', number: 8 },
      { name: 'Diego Moretti', number: 10 },
      { name: 'Cristian Marini', number: 6 },
      { name: 'Edoardo Fiore', number: 7 },
      { name: 'Filippo Neri', number: 2 },
    ],
  },
  {
    name: 'Leoni Dorati',
    short_name: 'LEO',
    color_primary: '#F4A261',
    color_secondary: '#1A1A2E',
    group: 'B',
    players: [
      { name: 'Sergio Barbieri', number: 1 },
      { name: 'Giorgio Amato', number: 5 },
      { name: 'Piero Battaglia', number: 9 },
      { name: 'Dario Fontana', number: 10 },
      { name: 'Bruno Pellegrini', number: 7 },
      { name: 'Carlo Fabbri', number: 3 },
      { name: 'Arnaldo Marchetti', number: 6 },
    ],
  },
  {
    name: 'Pantere Viola',
    short_name: 'PAN',
    color_primary: '#7B2FBE',
    color_secondary: '#FFFFFF',
    group: 'B',
    players: [
      { name: 'Ugo Santoro', number: 1 },
      { name: 'Franco Basile', number: 4 },
      { name: 'Gianluca Riva', number: 8 },
      { name: 'Renato Testa', number: 10 },
      { name: 'Oscar Giuliani', number: 6 },
      { name: 'Walter Gentile', number: 11 },
      { name: 'Ivan Carbone', number: 2 },
    ],
  },
  {
    name: 'Delfini Celesti',
    short_name: 'DEL',
    color_primary: '#00B4D8',
    color_secondary: '#FFFFFF',
    group: 'B',
    players: [
      { name: 'Aldo Ferri', number: 1 },
      { name: 'Pietro Montanari', number: 5 },
      { name: 'Cesare Cattaneo', number: 9 },
      { name: 'Enrico Bianco', number: 7 },
      { name: 'Silvano Negri', number: 10 },
      { name: 'Ruggero Sala', number: 3 },
      { name: 'Ettore Pavan', number: 6 },
    ],
  },
  {
    name: 'Orsi Bruni',
    short_name: 'ORS',
    color_primary: '#6D4C41',
    color_secondary: '#FFE0B2',
    group: 'B',
    players: [
      { name: 'Vito Gennaro', number: 1 },
      { name: 'Ciro Napolitano', number: 4 },
      { name: 'Biagio Sorrentino', number: 8 },
      { name: 'Nunzio Capasso', number: 10 },
      { name: 'Pasquale Longo', number: 6 },
      { name: 'Gaetano Trotta', number: 7 },
      { name: 'Raffaele Esposito', number: 2 },
    ],
  },
  {
    name: 'Serpenti Gialli',
    short_name: 'SER',
    color_primary: '#F9C74F',
    color_secondary: '#1A1A1A',
    group: 'C',
    players: [
      { name: 'Enzo Piazza', number: 1 },
      { name: 'Toni Damiano', number: 5 },
      { name: 'Gianni Piras', number: 9 },
      { name: 'Mauro Sanna', number: 7 },
      { name: 'Sandro Puddu', number: 10 },
      { name: 'Tonino Carta', number: 3 },
      { name: 'Gigi Murru', number: 6 },
    ],
  },
  {
    name: 'Squali Bianchi',
    short_name: 'SQU',
    color_primary: '#EEEEEE',
    color_secondary: '#0077B6',
    group: 'C',
    players: [
      { name: 'Nino Messina', number: 1 },
      { name: 'Pino Alaimo', number: 4 },
      { name: 'Totò Greco', number: 8 },
      { name: 'Mimmo Catalano', number: 10 },
      { name: 'Turiddu Arena', number: 6 },
      { name: 'Pippo Russo', number: 7 },
      { name: 'Calogero Meli', number: 2 },
    ],
  },
  {
    name: 'Tori Arancioni',
    short_name: 'TOR',
    color_primary: '#F77F00',
    color_secondary: '#FFFFFF',
    group: 'C',
    players: [
      { name: 'Amedeo Conti', number: 1 },
      { name: 'Dino Lisi', number: 5 },
      { name: 'Rino Fava', number: 9 },
      { name: 'Leo Marchi', number: 7 },
      { name: 'Max Pini', number: 10 },
      { name: 'Ken Rizzi', number: 3 },
      { name: 'Alex Neri', number: 6 },
    ],
  },
  {
    name: 'Corvi Argento',
    short_name: 'COR',
    color_primary: '#9E9E9E',
    color_secondary: '#1A1A1A',
    group: 'C',
    players: [
      { name: 'Eugenio Poli', number: 1 },
      { name: 'Umberto Sala', number: 4 },
      { name: 'Guido Turchi', number: 8 },
      { name: 'Nereo Valli', number: 10 },
      { name: 'Olindo Bruni', number: 6 },
      { name: 'Plinio Zorzi', number: 7 },
      { name: 'Quirino Boschi', number: 2 },
    ],
  },
  {
    name: 'Lupi Azzurri',
    short_name: 'LAZ',
    color_primary: '#4361EE',
    color_secondary: '#FFFFFF',
    group: 'D',
    players: [
      { name: 'Rodolfo Cantu', number: 1 },
      { name: 'Silvio Coppola', number: 5 },
      { name: 'Tiziano Moro', number: 9 },
      { name: 'Ubaldo Penna', number: 7 },
      { name: 'Virgilio Croce', number: 10 },
      { name: 'Zeno Palma', number: 3 },
      { name: 'Adelmo Riva', number: 6 },
    ],
  },
  {
    name: 'Volpi Rosse',
    short_name: 'VOL',
    color_primary: '#C1121F',
    color_secondary: '#FDF0D5',
    group: 'D',
    players: [
      { name: 'Benito Gallo', number: 1 },
      { name: 'Camillo Torre', number: 4 },
      { name: 'Dante Marino', number: 8 },
      { name: 'Emilio Lanza', number: 10 },
      { name: 'Furio Tosi', number: 6 },
      { name: 'Giulio Pace', number: 7 },
      { name: 'Ireneo Cava', number: 2 },
    ],
  },
  {
    name: 'Gabbiani Bianchi',
    short_name: 'GAB',
    color_primary: '#FFFFFF',
    color_secondary: '#023E8A',
    group: 'D',
    players: [
      { name: 'Lamberto Nova', number: 1 },
      { name: 'Manlio Ferro', number: 5 },
      { name: 'Nerino Polo', number: 9 },
      { name: 'Ottavio Gori', number: 7 },
      { name: 'Primo Osti', number: 10 },
      { name: 'Quirino Merlo', number: 3 },
      { name: 'Renzo Capi', number: 6 },
    ],
  },
  {
    name: 'Draghi Rossi',
    short_name: 'DRA',
    color_primary: '#9B2335',
    color_secondary: '#F5F5F5',
    group: 'D',
    players: [
      { name: 'Serafino Curti', number: 1 },
      { name: 'Teodoro Galli', number: 4 },
      { name: 'Ugo Boni', number: 8 },
      { name: 'Valentino Masi', number: 10 },
      { name: 'Wainer Forti', number: 6 },
      { name: 'Xeno Davi', number: 7 },
      { name: 'Yuri Nani', number: 2 },
    ],
  },
];

// Tournament dates: group stage July 4-6 2026, knockout July 11 2026
export const TOURNAMENT_START = new Date('2026-07-04T09:00:00+02:00');

// Group stage schedule: 24 matches (4 groups × 6 matches)
// Each group plays 3 rounds of 2 matches each
export function buildGroupMatches(): Array<{
  group: 'A' | 'B' | 'C' | 'D';
  home: string;
  away: string;
  scheduledAt: string;
  matchNumber: number;
}> {
  const schedule: Array<{
    group: 'A' | 'B' | 'C' | 'D';
    home: string;
    away: string;
    scheduledAt: string;
    matchNumber: number;
  }> = [];

  const groupMatchups: Record<'A' | 'B' | 'C' | 'D', Array<[number, number]>> = {
    A: [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]],
    B: [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]],
    C: [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]],
    D: [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]],
  };

  const groupTeams = {
    A: TEAMS.filter((t) => t.group === 'A').map((t) => t.name),
    B: TEAMS.filter((t) => t.group === 'B').map((t) => t.name),
    C: TEAMS.filter((t) => t.group === 'C').map((t) => t.name),
    D: TEAMS.filter((t) => t.group === 'D').map((t) => t.name),
  };

  // Day 1: July 4 — round 1 (match 1-2 of each group), Day 2: July 5 — round 2, Day 3: July 6 — round 3
  const rounds = [
    { day: '2026-07-04', matches: [0, 1] },
    { day: '2026-07-05', matches: [2, 3] },
    { day: '2026-07-06', matches: [4, 5] },
  ];

  const groups: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
  let matchNumber = 1;

  for (const { day, matches: matchIndices } of rounds) {
    let slotIndex = 0;
    for (const group of groups) {
      for (const idx of matchIndices) {
        const matchup = groupMatchups[group][idx];
        if (!matchup) continue;
        const [hi, ai] = matchup;
        const homeTeam = groupTeams[group][hi];
        const awayTeam = groupTeams[group][ai];
        if (!homeTeam || !awayTeam) continue;

        const hour = 9 + slotIndex * 1;
        const scheduledAt = `${day}T${String(hour).padStart(2, '0')}:00:00+02:00`;
        schedule.push({ group, home: homeTeam, away: awayTeam, scheduledAt, matchNumber });
        matchNumber++;
        slotIndex++;
      }
    }
  }

  return schedule;
}

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

  let mn = 25;
  // R16: July 11 — 8 matches
  for (let i = 0; i < 8; i++) {
    const hour = 9 + i;
    matches.push({ round: 'r16', matchNumber: mn++, scheduledAt: `2026-07-11T${String(hour).padStart(2, '0')}:00:00+02:00` });
  }
  // QF: July 12 — 4 matches
  for (let i = 0; i < 4; i++) {
    const hour = 9 + i * 2;
    matches.push({ round: 'qf', matchNumber: mn++, scheduledAt: `2026-07-12T${String(hour).padStart(2, '0')}:00:00+02:00` });
  }
  // SF: July 18 — 2 matches
  for (let i = 0; i < 2; i++) {
    const hour = 10 + i * 3;
    matches.push({ round: 'sf', matchNumber: mn++, scheduledAt: `2026-07-18T${String(hour).padStart(2, '0')}:00:00+02:00` });
  }
  // 3rd place + Final: July 19
  matches.push({ round: '3rd', matchNumber: mn++, scheduledAt: '2026-07-19T15:00:00+02:00' });
  matches.push({ round: 'final', matchNumber: mn++, scheduledAt: '2026-07-19T17:00:00+02:00' });

  return matches;
}
