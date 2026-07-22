CREATE TABLE IF NOT EXISTS admin_members (
  id UUID PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'moderator', 'analyst', 'support')),
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  invited_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS admin_members_status_idx ON admin_members (status, updated_at DESC);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS admin_audit_created_idx ON admin_audit_log (created_at DESC);
--> statement-breakpoint

INSERT INTO platform_schema_version (singleton, version, applied_at)
VALUES (TRUE, 11, NOW())
ON CONFLICT (singleton) DO UPDATE SET version = EXCLUDED.version, applied_at = EXCLUDED.applied_at;
