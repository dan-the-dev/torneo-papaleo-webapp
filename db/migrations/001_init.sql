CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name CHAR(1) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  short_name CHAR(3) NOT NULL,
  color_primary CHAR(7) NOT NULL,
  color_secondary CHAR(7) NOT NULL,
  group_id INTEGER NOT NULL REFERENCES groups(id)
);

CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id),
  name TEXT NOT NULL,
  number INTEGER
);

CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id),
  round TEXT NOT NULL CHECK (round IN ('group', 'r16', 'qf', 'sf', '3rd', 'final')),
  match_number INTEGER NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  team_home_id INTEGER REFERENCES teams(id),
  team_away_id INTEGER REFERENCES teams(id),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
  score_home INTEGER,
  score_away INTEGER,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS match_events (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players(id),
  team_id INTEGER NOT NULL REFERENCES teams(id),
  type TEXT NOT NULL CHECK (type IN ('goal', 'assist', 'red_card')),
  minute INTEGER
);

CREATE TABLE IF NOT EXISTS knockout_slots (
  id SERIAL PRIMARY KEY,
  round TEXT NOT NULL CHECK (round IN ('r16', 'qf', 'sf', '3rd', 'final')),
  slot_number INTEGER NOT NULL,
  team_id INTEGER REFERENCES teams(id),
  match_id INTEGER REFERENCES matches(id),
  UNIQUE (round, slot_number)
);

CREATE INDEX IF NOT EXISTS idx_matches_scheduled_at ON matches(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
