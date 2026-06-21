CREATE TABLE IF NOT EXISTS tournament_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO tournament_config (key, value)
VALUES ('bracket_published', 'false')
ON CONFLICT (key) DO NOTHING;
