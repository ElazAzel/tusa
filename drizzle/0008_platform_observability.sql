CREATE TABLE IF NOT EXISTS platform_error_events (
  id UUID PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('server', 'client', 'worker')),
  fingerprint TEXT NOT NULL,
  route TEXT NOT NULL DEFAULT '',
  method TEXT NOT NULL DEFAULT '',
  error_name TEXT NOT NULL DEFAULT 'Error',
  message TEXT NOT NULL DEFAULT '',
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  environment TEXT NOT NULL DEFAULT 'development',
  release TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS platform_error_created_idx ON platform_error_events (created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS platform_error_fingerprint_idx ON platform_error_events (fingerprint, created_at DESC);
--> statement-breakpoint
INSERT INTO platform_schema_version (singleton, version, applied_at)
VALUES (TRUE, 8, NOW())
ON CONFLICT (singleton) DO UPDATE SET version = EXCLUDED.version, applied_at = EXCLUDED.applied_at;
