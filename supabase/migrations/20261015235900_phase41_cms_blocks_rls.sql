-- ====================================================================
-- ENGENHARIA DIVERGENTE ACADEMY — MIGRATION 20261015235900
-- Fase 4.1: CMS, Multimídia, Questões e Referências com RLS
-- ====================================================================

-- 1. Enumerações da Fase 2
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_asset_type') THEN
    CREATE TYPE media_asset_type AS ENUM ('youtube_video', 'private_video', 'pdf_document', 'audio', 'image');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_storage_provider') THEN
    CREATE TYPE media_storage_provider AS ENUM ('youtube', 'cloudflare_stream', 's3_storage', 'external_url');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'editorial_status') THEN
    CREATE TYPE editorial_status AS ENUM ('draft', 'in_review', 'published', 'archived');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
    CREATE TYPE question_type AS ENUM (
      'single_choice',
      'multiple_choice',
      'true_false',
      'numeric_response',
      'ordered_steps'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'block_category') THEN
    CREATE TYPE block_category AS ENUM ('assessment', 'media', 'interaction', 'flow', 'marketing');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'block_completion_policy') THEN
    CREATE TYPE block_completion_policy AS ENUM ('submitted', 'watched', 'checked', 'manual', 'composite');
  END IF;
END $$;

-- 2. Tabela Central de Mídia (media_assets)
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  asset_type media_asset_type NOT NULL,
  provider media_storage_provider NOT NULL DEFAULT 'youtube',
  external_id TEXT NOT NULL,
  public_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  transcript_text TEXT,
  license_info TEXT DEFAULT 'Uso exclusivo Engenharia Divergente Academy',
  access_rules JSONB DEFAULT '{"requires_entitlement": true}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  related_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  file_size_bytes BIGINT,
  is_pending_storage BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Banco de Questões Editável (question_bank)
CREATE TABLE IF NOT EXISTS public.question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  question_type question_type NOT NULL,
  subject_area TEXT NOT NULL,
  competency_code TEXT NOT NULL,
  prerequisites TEXT[] DEFAULT ARRAY[]::TEXT[],
  authoring_level INTEGER NOT NULL CHECK (authoring_level BETWEEN 1 AND 5),
  prompt_markdown TEXT NOT NULL,
  options JSONB DEFAULT '[]'::jsonb,
  private_key_json JSONB NOT NULL,
  hint TEXT,
  explanation_markdown TEXT NOT NULL,
  numeric_unit TEXT,
  numeric_tolerance_abs NUMERIC,
  numeric_tolerance_rel NUMERIC,
  estimated_seconds INTEGER DEFAULT 180 NOT NULL,
  xp_reward INTEGER DEFAULT 15 NOT NULL,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  editorial_status editorial_status DEFAULT 'draft' NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Histórico de Versões de Questões (question_versions)
CREATE TABLE IF NOT EXISTS public.question_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  published_by UUID REFERENCES public.profiles(id),
  published_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_question_version UNIQUE (question_id, version_number)
);

-- 5. Biblioteca de Blocos de Conteúdo (content_blocks)
CREATE TABLE IF NOT EXISTS public.content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_type TEXT NOT NULL,
  category block_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  editorial_status editorial_status DEFAULT 'draft' NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,
  config_json JSONB NOT NULL,
  completion_policy block_completion_policy NOT NULL DEFAULT 'submitted',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  referenced_media_id UUID REFERENCES public.media_assets(id) ON DELETE RESTRICT,
  referenced_question_id UUID REFERENCES public.question_bank(id) ON DELETE RESTRICT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Histórico de Versões de Blocos (block_versions)
CREATE TABLE IF NOT EXISTS public.block_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES public.content_blocks(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  published_by UUID REFERENCES public.profiles(id),
  published_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_block_version UNIQUE (block_id, version_number)
);

-- 7. Fila de Revisão Editorial (editorial_review_queue)
CREATE TABLE IF NOT EXISTS public.editorial_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  current_status editorial_status NOT NULL,
  requested_by UUID REFERENCES public.profiles(id),
  assigned_reviewer UUID REFERENCES public.profiles(id),
  decision_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  decided_at TIMESTAMPTZ
);

-- 8. Referências de Uso (impede exclusão de mídias e questões vinculadas)
CREATE TABLE IF NOT EXISTS public.block_track_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES public.content_blocks(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_block_track_ref UNIQUE (block_id, product_id, module_id)
);

-- 9. Índices para performance editorial
CREATE INDEX IF NOT EXISTS idx_media_assets_tags ON public.media_assets USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_question_bank_tags ON public.question_bank USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_content_blocks_tags ON public.content_blocks USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_question_bank_status ON public.question_bank(editorial_status);
CREATE INDEX IF NOT EXISTS idx_content_blocks_status ON public.content_blocks(editorial_status);

-- ====================================================================
-- RLS POLICIES PARA CMS
-- ====================================================================

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_track_references ENABLE ROW LEVEL SECURITY;

-- media_assets: visualização para autenticados; edição por can_edit_content
DROP POLICY IF EXISTS "media_assets_select" ON public.media_assets;
CREATE POLICY "media_assets_select" ON public.media_assets
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "media_assets_edit" ON public.media_assets;
CREATE POLICY "media_assets_edit" ON public.media_assets
  FOR ALL TO authenticated
  USING (public.can_edit_content(auth.uid()))
  WITH CHECK (public.can_edit_content(auth.uid()));

-- question_bank: visualização de published para alunos; rascunhos e edição restritos à equipe editorial
-- NOTA: alunos nunca devem selecionar private_key_json diretamente (protegido por regras de view/função em 4.3)
DROP POLICY IF EXISTS "question_bank_select" ON public.question_bank;
CREATE POLICY "question_bank_select" ON public.question_bank
  FOR SELECT TO authenticated
  USING (editorial_status = 'published' OR public.can_edit_content(auth.uid()));

DROP POLICY IF EXISTS "question_bank_edit" ON public.question_bank;
CREATE POLICY "question_bank_edit" ON public.question_bank
  FOR ALL TO authenticated
  USING (public.can_edit_content(auth.uid()))
  WITH CHECK (public.can_edit_content(auth.uid()));

-- content_blocks: visualização de published para autenticados; edição por equipe editorial
DROP POLICY IF EXISTS "content_blocks_select" ON public.content_blocks;
CREATE POLICY "content_blocks_select" ON public.content_blocks
  FOR SELECT TO authenticated
  USING (editorial_status = 'published' OR public.can_edit_content(auth.uid()));

DROP POLICY IF EXISTS "content_blocks_edit" ON public.content_blocks;
CREATE POLICY "content_blocks_edit" ON public.content_blocks
  FOR ALL TO authenticated
  USING (public.can_edit_content(auth.uid()))
  WITH CHECK (public.can_edit_content(auth.uid()));

-- question_versions e block_versions: leitura para editorial, escrita apenas via funções/sistema
DROP POLICY IF EXISTS "question_versions_select" ON public.question_versions;
CREATE POLICY "question_versions_select" ON public.question_versions
  FOR SELECT TO authenticated
  USING (public.can_edit_content(auth.uid()));

DROP POLICY IF EXISTS "block_versions_select" ON public.block_versions;
CREATE POLICY "block_versions_select" ON public.block_versions
  FOR SELECT TO authenticated
  USING (public.can_edit_content(auth.uid()));

-- editorial_review_queue
DROP POLICY IF EXISTS "editorial_review_queue_all" ON public.editorial_review_queue;
CREATE POLICY "editorial_review_queue_all" ON public.editorial_review_queue
  FOR ALL TO authenticated
  USING (public.can_edit_content(auth.uid()))
  WITH CHECK (public.can_edit_content(auth.uid()));

-- block_track_references
DROP POLICY IF EXISTS "block_track_references_all" ON public.block_track_references;
CREATE POLICY "block_track_references_all" ON public.block_track_references
  FOR ALL TO authenticated
  USING (public.can_edit_content(auth.uid()))
  WITH CHECK (public.can_edit_content(auth.uid()));
