ALTER TABLE game_actions ADD COLUMN IF NOT EXISTS client_mutation_id TEXT;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS game_actions_command_unique
  ON game_actions(session_id, clerk_user_id, client_mutation_id)
  WHERE client_mutation_id IS NOT NULL;
