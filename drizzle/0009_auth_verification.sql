ALTER TABLE local_accounts
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES local_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS email_verification_account_idx ON email_verification_tokens (account_id, created_at DESC);
--> statement-breakpoint
INSERT INTO platform_schema_version (singleton, version, applied_at)
VALUES (TRUE, 9, NOW())
ON CONFLICT (singleton) DO UPDATE SET version = EXCLUDED.version, applied_at = EXCLUDED.applied_at;
