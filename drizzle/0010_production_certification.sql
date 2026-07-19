CREATE TABLE IF NOT EXISTS auth_email_deliveries (
  id UUID PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_message_id TEXT UNIQUE,
  template TEXT NOT NULL,
  recipient_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'complained', 'failed')),
  error_code TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS auth_email_deliveries_status_created_idx
  ON auth_email_deliveries(status, created_at DESC);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS admin_mfa_credentials (
  actor_id TEXT PRIMARY KEY,
  encrypted_secret TEXT NOT NULL,
  enabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS admin_mfa_recovery_codes (
  id UUID PRIMARY KEY,
  actor_id TEXT NOT NULL REFERENCES admin_mfa_credentials(actor_id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL UNIQUE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS admin_mfa_recovery_actor_idx
  ON admin_mfa_recovery_codes(actor_id, used_at);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS platform_operational_events (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  success BOOLEAN NOT NULL DEFAULT TRUE,
  dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  environment TEXT NOT NULL,
  release TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS platform_operational_type_created_idx
  ON platform_operational_events(event_type, created_at DESC);
--> statement-breakpoint

INSERT INTO platform_schema_version (singleton, version, applied_at)
VALUES (TRUE, 10, NOW())
ON CONFLICT (singleton) DO UPDATE SET version = EXCLUDED.version, applied_at = EXCLUDED.applied_at;
