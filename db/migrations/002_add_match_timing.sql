ALTER TABLE matches ADD COLUMN IF NOT EXISTS current_minute integer;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS finished_at timestamptz;
