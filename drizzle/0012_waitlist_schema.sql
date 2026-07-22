CREATE TABLE IF NOT EXISTS waitlist_settings (
  id TEXT PRIMARY KEY,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  baseline_count INTEGER NOT NULL CHECK (baseline_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS waitlist_applications (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  contact TEXT NOT NULL,
  contact_normalized TEXT NOT NULL UNIQUE,
  beta BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'shortlisted', 'invited', 'rejected')),
  notes TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS waitlist_applications_submitted_at_idx ON waitlist_applications (submitted_at DESC);
--> statement-breakpoint

INSERT INTO waitlist_settings (id, capacity, baseline_count)
VALUES ('primary', 765, 254)
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint

INSERT INTO platform_schema_version (singleton, version, applied_at)
VALUES (TRUE, 12, NOW())
ON CONFLICT (singleton) DO UPDATE SET version = EXCLUDED.version, applied_at = EXCLUDED.applied_at;
