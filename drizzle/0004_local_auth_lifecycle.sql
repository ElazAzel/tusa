CREATE TABLE IF NOT EXISTS local_accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  session_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

ALTER TABLE local_accounts
  ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES local_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS password_reset_account_idx
  ON password_reset_tokens (account_id, created_at DESC);
