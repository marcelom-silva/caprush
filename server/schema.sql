-- CapRush – schema.sql
-- Banco SQLite local. Execute: sqlite3 caprush.db < schema.sql

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- Jogadores
CREATE TABLE IF NOT EXISTS players (
  id          TEXT PRIMARY KEY,          -- UUID ou Google sub
  username    TEXT NOT NULL,
  auth_method TEXT NOT NULL DEFAULT 'google',  -- 'google' | 'tiplink' | 'phantom'
  wallet_addr TEXT,
  cr_balance  INTEGER NOT NULL DEFAULT 0,
  xp          INTEGER NOT NULL DEFAULT 0,
  level       INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tampinhas (NFT ou padrão)
CREATE TABLE IF NOT EXISTS caps (
  id            TEXT PRIMARY KEY,
  owner_id      TEXT NOT NULL REFERENCES players(id),
  nft_mint_addr TEXT,                    -- NULL se não mintada
  name          TEXT NOT NULL DEFAULT 'Tampinha Padrão',
  rarity        TEXT NOT NULL DEFAULT 'COMMON',
  power         REAL NOT NULL DEFAULT 1.0,
  precision     REAL NOT NULL DEFAULT 1.0,
  friction_res  REAL NOT NULL DEFAULT 1.0,
  durability    REAL NOT NULL DEFAULT 100.0,
  equipped      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Partidas
CREATE TABLE IF NOT EXISTS races (
  id          TEXT PRIMARY KEY,
  player_id   TEXT NOT NULL REFERENCES players(id),
  char_id     TEXT NOT NULL,
  track_id    TEXT NOT NULL DEFAULT 'test',
  laps        INTEGER NOT NULL DEFAULT 2,
  launches    INTEGER NOT NULL DEFAULT 0,
  race_time_s REAL NOT NULL DEFAULT 0,
  cr_earned   INTEGER NOT NULL DEFAULT 0,
  xp_earned   INTEGER NOT NULL DEFAULT 0,
  rating      INTEGER NOT NULL DEFAULT 1,   -- 1-3 estrelas
  finished    INTEGER NOT NULL DEFAULT 0,
  played_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ranking por temporada
CREATE TABLE IF NOT EXISTS season_ranking (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  season      INTEGER NOT NULL DEFAULT 1,
  player_id   TEXT NOT NULL REFERENCES players(id),
  total_cr    INTEGER NOT NULL DEFAULT 0,
  wins        INTEGER NOT NULL DEFAULT 0,
  best_time_s REAL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(season, player_id)
);

-- Inventário de upgrades/NFTs
CREATE TABLE IF NOT EXISTS inventory (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id   TEXT NOT NULL REFERENCES players(id),
  item_type   TEXT NOT NULL,   -- 'NFT_UPGRADE' | 'COSMETIC' | 'BOOST'
  item_id     TEXT NOT NULL,
  item_name   TEXT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  nft_mint    TEXT,
  acquired_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Conquistas / Badges
CREATE TABLE IF NOT EXISTS achievements (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id    TEXT NOT NULL REFERENCES players(id),
  badge_id     TEXT NOT NULL,
  badge_name   TEXT NOT NULL,
  cr_reward    INTEGER NOT NULL DEFAULT 0,
  unlocked_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(player_id, badge_id)
);

-- Views úteis
CREATE VIEW IF NOT EXISTS vw_leaderboard AS
SELECT
  sr.season,
  p.username,
  p.wallet_addr,
  sr.total_cr,
  sr.wins,
  sr.best_time_s,
  p.level,
  sr.updated_at
FROM season_ranking sr
JOIN players p ON p.id = sr.player_id
ORDER BY sr.total_cr DESC;
