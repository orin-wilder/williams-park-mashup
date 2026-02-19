-- ════════════════════════════════════════════════════════════════════
-- Williams Park Idea Mashup — Supabase Schema
-- Project: williams-park-mashup
-- Shared database: Community Play Tools (nzcogxjcihgtevjiuipf)
-- ════════════════════════════════════════════════════════════════════

-- One row per starred/submitted idea mashup
CREATE TABLE IF NOT EXISTS mashup_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project TEXT NOT NULL DEFAULT 'williams-park-mashup',
  term1 TEXT NOT NULL,
  term2 TEXT NOT NULL,
  ai_description TEXT NOT NULL,
  user_comment TEXT DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE mashup_ideas IS 'Williams Park community idea mashups — starred ideas submitted by users';
COMMENT ON COLUMN mashup_ideas.project IS 'CPT project identifier for multi-tool filtering';
COMMENT ON COLUMN mashup_ideas.term1 IS 'First mashup input term';
COMMENT ON COLUMN mashup_ideas.term2 IS 'Second mashup input term';
COMMENT ON COLUMN mashup_ideas.ai_description IS 'AI-generated program description';
COMMENT ON COLUMN mashup_ideas.user_comment IS 'Optional user-added comment or elaboration';

-- Card sort results (one row per completed sort session)
CREATE TABLE IF NOT EXISTS cardsort_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project TEXT NOT NULL DEFAULT 'williams-park-mashup',
  scores JSONB NOT NULL,       -- { "idea label": score, ... }
  rounds_played INTEGER NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE cardsort_results IS 'Williams Park card sort prioritization results';
COMMENT ON COLUMN cardsort_results.scores IS 'JSON map of idea label to total points won';

-- ── Row Level Security ────────────────────────────────────────────
ALTER TABLE mashup_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardsort_results ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public-facing engagement tool)
CREATE POLICY "allow_anon_insert_mashup"
  ON mashup_ideas FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "allow_anon_insert_cardsort"
  ON cardsort_results FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated reads (for dashboard/reporting)
CREATE POLICY "allow_auth_select_mashup"
  ON mashup_ideas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_auth_select_cardsort"
  ON cardsort_results FOR SELECT
  TO authenticated
  USING (true);
