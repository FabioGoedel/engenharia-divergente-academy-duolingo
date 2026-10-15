-- ====================================================================
-- ENGENHARIA DIVERGENTE ACADEMY — MIGRATION 0002 (FASE 2)
-- Modelagem de CMS, Mídia Centralizada, Banco de Questões,
-- Blocos de Conteúdo P0/P1/P2 e Workflow Editorial de Revisão.
--
-- STATUS: PENDENTE de aplicação (banco de dados real não conectado nesta fase).
-- Quando o Supabase for plugado, executar este script após a 20250325000001_initial_schema.sql.
-- ====================================================================

-- 1. Enumerações da Fase 2
CREATE TYPE media_asset_type AS ENUM ('youtube_video', 'private_video', 'pdf_document', 'audio', 'image');
CREATE TYPE media_storage_provider AS ENUM ('youtube', 'cloudflare_stream', 's3_storage', 'external_url');
CREATE TYPE editorial_status AS ENUM ('draft', 'in_review', 'published', 'archived');
CREATE TYPE question_type AS ENUM (
  'single_choice',
  'multiple_choice',
  'true_false',
  'numeric_response',
  'ordered_steps'
);
CREATE TYPE block_category AS ENUM ('assessment', 'media', 'interaction', 'flow', 'marketing');
CREATE TYPE block_completion_policy AS ENUM ('submitted', 'watched', 'checked', 'manual', 'composite');

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
-- REQUISITO DE SEGURANÇA: private_key_json (gabarito e rubrica protegidos)
-- NUNCA deve ser enviado no payload público do aluno.
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
  options JSONB DEFAULT '[]'::jsonb, -- alternativas sem o gabarito exposto
  private_key_json JSONB NOT NULL, -- GABARITO E RUBRICA PROTEGIDOS (lado servidor apenas)
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

-- 4. Histórico Imutável de Versões de Questões (question_versions)
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
  block_type TEXT NOT NULL, -- single_choice, numeric_response, video_embed, pdf_reader, etc.
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

-- 6. Histórico Imutável de Versões de Blocos (block_versions)
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
  entity_type TEXT NOT NULL, -- 'question' | 'block'
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
-- RLS - Políticas de Acesso
-- ====================================================================

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_track_references ENABLE ROW LEVEL SECURITY;

-- Verificador de permissão editorial (content_editor, admin, super_admin)
CREATE OR REPLACE FUNCTION public.can_edit_content(user_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uid AND role IN ('content_editor', 'admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Regra de exclusão restrita de mídia: não excluir se referenciada por bloco publicado
CREATE OR REPLACE FUNCTION public.check_media_deletion_allowed(media_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.content_blocks cb
    WHERE cb.referenced_media_id = media_uuid
      AND cb.editorial_status = 'published'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.question_bank IS
  'Banco de questões com isolamento estrito de private_key_json (nunca trafega no payload do aluno).';
