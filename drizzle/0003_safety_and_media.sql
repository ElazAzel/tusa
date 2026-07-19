ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'visible';
--> statement-breakpoint

ALTER TABLE party_gallery_photos
  ADD COLUMN IF NOT EXISTS storage_path TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'image/jpeg',
  ADD COLUMN IF NOT EXISTS size_bytes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retention_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'visible';
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS safety_reports (
  id UUID PRIMARY KEY,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('chat_message', 'gallery_photo', 'user')),
  target_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate', 'sexual', 'violence', 'privacy', 'other')),
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'actioned', 'dismissed', 'appealed')),
  assigned_to TEXT NOT NULL DEFAULT '',
  resolution TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (party_id, reporter_id, target_type, target_id)
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS safety_reports_queue_idx
  ON safety_reports (status, created_at ASC);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES safety_reports(id) ON DELETE CASCADE,
  moderator_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('review', 'dismiss', 'remove_content', 'warn', 'suspend')),
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS safety_blocks (
  blocker_id TEXT NOT NULL,
  blocked_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
