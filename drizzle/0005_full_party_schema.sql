-- Generated from ensurePartySchema. Review changes before applying.
CREATE TABLE IF NOT EXISTS user_profiles (
    clerk_user_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    handle TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    cosmetics JSONB NOT NULL DEFAULT '{"cover":"lime","avatarFrame":"none","chatEffect":"none","chatBackground":"paper","nameColor":"#000000","badge":"newcomer","xpMultiplier":1,"betaAccess":false,"unlocked":[]}'::jsonb,
    xp INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
    max_redemptions INTEGER CHECK (max_redemptions IS NULL OR max_redemptions > 0),
    uses_count INTEGER NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
    redemption_mode TEXT NOT NULL DEFAULT 'single' CHECK (redemption_mode IN ('single', 'multi')),
    expires_at TIMESTAMPTZ,
    benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY,
    owner_id TEXT NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    invite_code TEXT NOT NULL UNIQUE,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    venue TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    adult_only BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS party_members (
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'guest')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (party_id, clerk_user_id)
  );
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS promo_redemptions (
    id UUID PRIMARY KEY,
    promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE RESTRICT,
    clerk_user_id TEXT NOT NULL,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (promo_code_id, clerk_user_id),
    UNIQUE (party_id)
  );
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS profile_promo_redemptions (
    id UUID PRIMARY KEY,
    promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE RESTRICT,
    clerk_user_id TEXT NOT NULL,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (promo_code_id, clerk_user_id)
  );
--> statement-breakpoint

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS cosmetics JSONB NOT NULL DEFAULT '{"cover":"lime","avatarFrame":"none","chatEffect":"none","chatBackground":"paper","nameColor":"#000000","badge":"newcomer","xpMultiplier":1,"betaAccess":false,"unlocked":[]}'::jsonb;
--> statement-breakpoint

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS compashka TEXT NOT NULL DEFAULT '';
--> statement-breakpoint

ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS redemption_mode TEXT NOT NULL DEFAULT 'single';
--> statement-breakpoint

ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
--> statement-breakpoint

ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS benefits JSONB NOT NULL DEFAULT '[]'::jsonb;
--> statement-breakpoint

ALTER TABLE promo_redemptions ALTER COLUMN party_id DROP NOT NULL;
--> statement-breakpoint

ALTER TABLE parties ADD COLUMN IF NOT EXISTS adult_only BOOLEAN NOT NULL DEFAULT TRUE;
--> statement-breakpoint

ALTER TABLE party_members ADD COLUMN IF NOT EXISTS rsvp_status TEXT NOT NULL DEFAULT 'going' CHECK (rsvp_status IN ('going', 'maybe', 'pass'));
--> statement-breakpoint

ALTER TABLE party_members DROP CONSTRAINT IF EXISTS party_members_role_check;
--> statement-breakpoint

ALTER TABLE party_members ADD CONSTRAINT party_members_role_check CHECK (role IN ('owner', 'co_host', 'guest'));
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    name_color TEXT NOT NULL DEFAULT '#000000',
    chat_effect TEXT NOT NULL DEFAULT 'none',
    text TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'voice', 'sticker')),
    voice_url TEXT NOT NULL DEFAULT '',
    sticker_id TEXT NOT NULL DEFAULT '',
    reactions JSONB NOT NULL DEFAULT '{}'::jsonb,
    moderation_status TEXT NOT NULL DEFAULT 'visible',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS parties_owner_idx ON parties (owner_id, created_at DESC);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS party_members_user_idx ON party_members (clerk_user_id, joined_at DESC);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS party_shopping_items (
    id UUID PRIMARY KEY,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    text TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'шт.',
    price INTEGER NOT NULL DEFAULT 0,
    purchased BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS party_gallery_photos (
    id UUID PRIMARY KEY,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL DEFAULT '',
    src TEXT NOT NULL,
    storage_path TEXT NOT NULL DEFAULT '',
    content_type TEXT NOT NULL DEFAULT 'image/jpeg',
    size_bytes INTEGER NOT NULL DEFAULT 0,
    consent_at TIMESTAMPTZ,
    retention_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
    moderation_status TEXT NOT NULL DEFAULT 'visible',
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    cover BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
--> statement-breakpoint

ALTER TABLE party_gallery_photos ADD COLUMN IF NOT EXISTS storage_path TEXT NOT NULL DEFAULT '';
--> statement-breakpoint

ALTER TABLE party_gallery_photos ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'image/jpeg';
--> statement-breakpoint

ALTER TABLE party_gallery_photos ADD COLUMN IF NOT EXISTS size_bytes INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint

ALTER TABLE party_gallery_photos ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;
--> statement-breakpoint

ALTER TABLE party_gallery_photos ADD COLUMN IF NOT EXISTS retention_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days');
--> statement-breakpoint

ALTER TABLE party_gallery_photos ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'visible';
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

CREATE INDEX IF NOT EXISTS safety_reports_queue_idx ON safety_reports (status, created_at ASC);
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
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS party_gallery_party_idx ON party_gallery_photos (party_id, created_at DESC);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS party_shopping_party_idx ON party_shopping_items (party_id, created_at ASC);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS chat_messages_party_idx ON chat_messages (party_id, created_at ASC);
--> statement-breakpoint

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'voice', 'sticker'));
--> statement-breakpoint

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS voice_url TEXT NOT NULL DEFAULT '';
--> statement-breakpoint

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sticker_id TEXT NOT NULL DEFAULT '';
--> statement-breakpoint

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reactions JSONB NOT NULL DEFAULT '{}'::jsonb;
--> statement-breakpoint

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'visible';
--> statement-breakpoint

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS client_mutation_id TEXT;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS chat_messages_mutation_idx ON chat_messages (party_id, clerk_user_id, client_mutation_id) WHERE client_mutation_id IS NOT NULL;
--> statement-breakpoint

ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS client_mutation_id TEXT;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS game_scores_mutation_idx ON game_scores (session_id, client_mutation_id) WHERE client_mutation_id IS NOT NULL;
--> statement-breakpoint

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS koins_balance INTEGER NOT NULL DEFAULT 100;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS koins_transactions (
    id UUID PRIMARY KEY,
    clerk_user_id TEXT NOT NULL,
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS koins_tx_user_idx ON koins_transactions (clerk_user_id, created_at DESC);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS party_bets (
    id UUID PRIMARY KEY,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    text TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'settled', 'cancelled')),
    winner TEXT NOT NULL DEFAULT '',
    entries JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS party_bets_party_idx ON party_bets (party_id, created_at DESC);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS engagement_rewards (
    id UUID PRIMARY KEY,
    clerk_user_id TEXT NOT NULL,
    activity TEXT NOT NULL,
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    granted_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS engagement_rewards_idx ON engagement_rewards (clerk_user_id, activity, granted_at);
--> statement-breakpoint

ALTER TABLE party_members ADD COLUMN IF NOT EXISTS custom_role TEXT NOT NULL DEFAULT '';
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS party_notes (
    id UUID PRIMARY KEY,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'note' CHECK (type IN ('note', 'blast')),
    text TEXT NOT NULL,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS party_notes_party_idx ON party_notes (party_id, created_at DESC);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY,
    clerk_user_id TEXT NOT NULL DEFAULT '',
    party_id TEXT NOT NULL DEFAULT '',
    action TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS analytics_action_idx ON analytics_events (action, created_at DESC);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS friend_connections (
    requester_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (requester_id, target_id)
  );
--> statement-breakpoint

ALTER TABLE party_members ADD COLUMN IF NOT EXISTS paid_by TEXT NOT NULL DEFAULT '';
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS friend_connections_target_idx ON friend_connections (target_id, status);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    game TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'active', 'paused', 'completed', 'cancelled')),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
--> statement-breakpoint

ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS participants JSONB NOT NULL DEFAULT '[]'::jsonb;
--> statement-breakpoint

ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT '';
--> statement-breakpoint

ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS game_actions (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS game_actions_session_idx ON game_actions (session_id, created_at ASC);
--> statement-breakpoint

ALTER TABLE game_actions ADD COLUMN IF NOT EXISTS client_mutation_id TEXT;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS game_actions_command_unique ON game_actions(session_id, clerk_user_id, client_mutation_id) WHERE client_mutation_id IS NOT NULL;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS game_scores (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    clerk_user_id TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS party_highlights (id UUID PRIMARY KEY, party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE, session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL, clerk_user_id TEXT NOT NULL, display_name TEXT NOT NULL DEFAULT '', type TEXT NOT NULL DEFAULT 'score' CHECK (type IN ('score','achievement','funny','quote','photo')), data JSONB NOT NULL DEFAULT '{}'::jsonb, thumbnail TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS highlights_party_idx ON party_highlights (party_id, created_at DESC);
--> statement-breakpoint

ALTER TABLE parties ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
--> statement-breakpoint

ALTER TABLE parties ADD COLUMN IF NOT EXISTS theme JSONB NOT NULL DEFAULT '{}'::jsonb;
--> statement-breakpoint

ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS spectators JSONB NOT NULL DEFAULT '[]'::jsonb;
--> statement-breakpoint

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pass_xp INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pass_tier INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pass_season TEXT NOT NULL DEFAULT '';
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS party_pass_seasons (id TEXT PRIMARY KEY, name TEXT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, tiers JSONB NOT NULL DEFAULT '[]'::jsonb, active BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS gratitude_tips (id UUID PRIMARY KEY, party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE, from_user TEXT NOT NULL, to_user TEXT NOT NULL, amount INTEGER NOT NULL CHECK (amount > 0), message TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS gratitude_party_idx ON gratitude_tips (party_id, created_at DESC);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS gratitude_to_idx ON gratitude_tips (to_user, created_at DESC);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS social_quests (id TEXT PRIMARY KEY, title_key TEXT NOT NULL, desc_key TEXT NOT NULL, icon TEXT NOT NULL DEFAULT 'emoji_events', requirements JSONB NOT NULL DEFAULT '{}'::jsonb, reward_koins INTEGER NOT NULL DEFAULT 0, reward_xp INTEGER NOT NULL DEFAULT 0, reward_cosmetic TEXT NOT NULL DEFAULT '', active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS social_quest_progress (id UUID PRIMARY KEY, quest_id TEXT NOT NULL REFERENCES social_quests(id) ON DELETE CASCADE, party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE, clerk_user_id TEXT NOT NULL, progress INTEGER NOT NULL DEFAULT 0, target INTEGER NOT NULL DEFAULT 1, claimed BOOLEAN NOT NULL DEFAULT FALSE, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (quest_id, party_id, clerk_user_id));
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS daily_challenges (id UUID PRIMARY KEY, game TEXT NOT NULL, date DATE NOT NULL DEFAULT CURRENT_DATE, config JSONB NOT NULL DEFAULT '{}'::jsonb, active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (game, date));
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS daily_challenge_scores (id UUID PRIMARY KEY, challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE, clerk_user_id TEXT NOT NULL, score INTEGER NOT NULL DEFAULT 0, played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (challenge_id, clerk_user_id));
--> statement-breakpoint

ALTER TABLE parties ADD COLUMN IF NOT EXISTS owned_themes JSONB NOT NULL DEFAULT '["lime"]'::jsonb;
--> statement-breakpoint

ALTER TABLE parties ADD COLUMN IF NOT EXISTS highlight_count INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS game_actions (id UUID PRIMARY KEY, session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE, clerk_user_id TEXT NOT NULL, action_type TEXT NOT NULL, payload JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
--> statement-breakpoint

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS handle TEXT NOT NULL DEFAULT '';
--> statement-breakpoint

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS name_color TEXT NOT NULL DEFAULT '#000000';
--> statement-breakpoint

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS chat_effect TEXT NOT NULL DEFAULT 'none';
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS friend_lists (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, clerk_user_id TEXT NOT NULL REFERENCES user_profiles(clerk_user_id), name TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS friend_list_members (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, list_id UUID NOT NULL REFERENCES friend_lists(id) ON DELETE CASCADE, friend_id TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(list_id, friend_id));
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS cosmetics_catalogue (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, type TEXT NOT NULL, slug TEXT NOT NULL, name_ru TEXT NOT NULL, name_en TEXT NOT NULL, value TEXT NOT NULL, image_url TEXT NOT NULL DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0, active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(type, slug));
