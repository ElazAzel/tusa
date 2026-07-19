CREATE TABLE IF NOT EXISTS platform_schema_version (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton = TRUE),
  version INTEGER NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

INSERT INTO platform_schema_version (singleton, version, applied_at)
VALUES (TRUE, 6, NOW())
ON CONFLICT (singleton) DO UPDATE SET
  version = EXCLUDED.version,
  applied_at = EXCLUDED.applied_at;
