CREATE TABLE IF NOT EXISTS players (
  player_id CHAR(64) PRIMARY KEY,
  username TEXT NOT NULL,
  password_hash CHAR(129) NOT NULL
);
