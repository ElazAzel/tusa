ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint

INSERT INTO party_pass_seasons (id, name, start_date, end_date, tiers, active)
VALUES (
  'beta-2026-s1',
  'Beta Season 1',
  '2026-07-19',
  '2026-12-31',
  '[{"tier":1,"xpRequired":25,"rewards":[{"type":"milestone","value":"Starter"}]},{"tier":2,"xpRequired":75,"rewards":[{"type":"milestone","value":"Team Player"}]},{"tier":3,"xpRequired":150,"rewards":[{"type":"milestone","value":"Party Regular"}]},{"tier":4,"xpRequired":300,"rewards":[{"type":"milestone","value":"Game Host"}]},{"tier":5,"xpRequired":500,"rewards":[{"type":"milestone","value":"TUSA Legend"}]}]'::jsonb,
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  tiers = EXCLUDED.tiers,
  active = EXCLUDED.active;
