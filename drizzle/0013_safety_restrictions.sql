CREATE TABLE IF NOT EXISTS safety_user_restrictions (
  user_id TEXT PRIMARY KEY,
  restriction TEXT NOT NULL CHECK (restriction IN ('warn', 'suspended')),
  reason TEXT NOT NULL DEFAULT '',
  expires_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS safety_user_restrictions_expiry_idx ON safety_user_restrictions (expires_at);
--> statement-breakpoint

ALTER TABLE moderation_actions DROP CONSTRAINT IF EXISTS moderation_actions_action_check;
--> statement-breakpoint

ALTER TABLE moderation_actions ADD CONSTRAINT moderation_actions_action_check CHECK (action IN ('review', 'dismiss', 'remove_content', 'warn', 'suspend', 'restore'));
--> statement-breakpoint

INSERT INTO platform_schema_version (singleton, version, applied_at)
VALUES (TRUE, 13, NOW())
ON CONFLICT (singleton) DO UPDATE SET version = EXCLUDED.version, applied_at = EXCLUDED.applied_at;
