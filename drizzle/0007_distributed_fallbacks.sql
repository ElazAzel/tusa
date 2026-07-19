CREATE TABLE IF NOT EXISTS rate_limit_windows (
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (key, window_start)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS rate_limit_expiry_idx ON rate_limit_windows (expires_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS live_events (
  id UUID PRIMARY KEY,
  channel TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS live_events_channel_idx ON live_events (channel, created_at DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS platform_schema_version (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton = TRUE),
  version INTEGER NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint
INSERT INTO platform_schema_version (singleton, version, applied_at)
VALUES (TRUE, 7, NOW())
ON CONFLICT (singleton) DO UPDATE SET version = EXCLUDED.version, applied_at = EXCLUDED.applied_at;
