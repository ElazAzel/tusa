CREATE EXTENSION IF NOT EXISTS vector;

DO $$ BEGIN
  CREATE TYPE knowledge_visibility AS ENUM ('public', 'admin', 'engineering');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY, locale TEXT NOT NULL, visibility knowledge_visibility NOT NULL,
  source_type TEXT NOT NULL, title TEXT NOT NULL, canonical_url TEXT,
  version TEXT NOT NULL, checksum TEXT NOT NULL, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY, document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, content TEXT NOT NULL, token_count INTEGER NOT NULL,
  search_text TEXT NOT NULL, embedding vector(1536), metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(document_id, position)
);

CREATE TABLE IF NOT EXISTS rag_jobs (
  id UUID PRIMARY KEY, status TEXT NOT NULL, visibility knowledge_visibility NOT NULL,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb, error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS knowledge_documents_visibility_locale_idx ON knowledge_documents(visibility, locale);
CREATE INDEX IF NOT EXISTS knowledge_chunks_document_idx ON knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS knowledge_chunks_search_idx ON knowledge_chunks USING GIN (to_tsvector('simple', search_text));
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);

DO $$ BEGIN
  IF to_regclass('public.party_members') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS party_members_party_user_idx ON party_members(party_id, clerk_user_id);
    CREATE INDEX IF NOT EXISTS party_members_user_created_idx ON party_members(clerk_user_id, created_at DESC);
  END IF;
  IF to_regclass('public.game_sessions') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS game_sessions_party_status_created_idx ON game_sessions(party_id, status, created_at DESC);
  END IF;
  IF to_regclass('public.game_actions') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS game_actions_session_created_idx ON game_actions(session_id, created_at ASC);
  END IF;
  IF to_regclass('public.chat_messages') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS chat_messages_party_created_idx ON chat_messages(party_id, created_at DESC);
  END IF;
  IF to_regclass('public.analytics_events') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS analytics_events_action_created_idx ON analytics_events(action, created_at DESC);
  END IF;
END $$;
