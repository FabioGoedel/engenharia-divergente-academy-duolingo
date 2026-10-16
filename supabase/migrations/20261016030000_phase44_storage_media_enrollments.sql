-- ==============================================================================
-- Engenharia Divergente Academy — Migration Subfase 4.4
-- Gerenciamento de Mídias, Materiais e Matrículas (v0.0.12 -> v0.0.13)
-- ==============================================================================

-- 1. Buckets de Storage
-- Bucket 'media_library': imagens, diagramas e mídias públicas ou de prévia
-- Bucket 'protected_materials': apostilas restritas, PDFs, arquivos de engenharia CAD (SLDPRT, STEP, etc.), simuladores
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('media_library', 'media_library', true, 104857600, NULL),
  ('protected_materials', 'protected_materials', false, 209715200, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- 2. Expandir media_storage_provider se necessário
ALTER TYPE public.media_storage_provider ADD VALUE IF NOT EXISTS 'supabase_storage';
ALTER TYPE public.media_storage_provider ADD VALUE IF NOT EXISTS 'vimeo';

-- 3. Expandir media_asset_type se necessário
ALTER TYPE public.media_asset_type ADD VALUE IF NOT EXISTS 'cad_model';
ALTER TYPE public.media_asset_type ADD VALUE IF NOT EXISTS 'spreadsheet';
ALTER TYPE public.media_asset_type ADD VALUE IF NOT EXISTS 'archive';
ALTER TYPE public.media_asset_type ADD VALUE IF NOT EXISTS 'exercise_file';

-- 4. Adicionar colunas aditivas em public.media_assets
ALTER TABLE public.media_assets 
  ADD COLUMN IF NOT EXISTS storage_bucket text DEFAULT 'protected_materials',
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS file_hash text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS original_filename text,
  ADD COLUMN IF NOT EXISTS file_extension text,
  ADD COLUMN IF NOT EXISTS folder_path text DEFAULT '/',
  ADD COLUMN IF NOT EXISTS category_tag text DEFAULT 'documents',
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_mandatory_reading boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_download boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS root_asset_id uuid;

-- Chave estrangeira para versionamento de mídia
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'media_assets_root_asset_id_fkey'
  ) THEN
    ALTER TABLE public.media_assets
      ADD CONSTRAINT media_assets_root_asset_id_fkey
      FOREIGN KEY (root_asset_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_media_assets_hash ON public.media_assets (file_hash);
CREATE INDEX IF NOT EXISTS idx_media_assets_storage_path ON public.media_assets (storage_bucket, storage_path);
CREATE INDEX IF NOT EXISTS idx_media_assets_folder ON public.media_assets (folder_path);
CREATE INDEX IF NOT EXISTS idx_media_assets_product ON public.media_assets (related_product_id);

-- 5. Tabela de Versões de Mídia (Snapshots imutáveis de recursos de mídia)
CREATE TABLE IF NOT EXISTS public.media_asset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  storage_bucket TEXT NOT NULL,
  storage_path TEXT,
  file_hash TEXT,
  file_size_bytes BIGINT,
  public_url TEXT,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_media_asset_version UNIQUE (asset_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_media_asset_versions_asset ON public.media_asset_versions (asset_id);

-- 6. Tabela de Logs de Acesso a Materiais / Telemetria básica de download e leitura
CREATE TABLE IF NOT EXISTS public.material_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'read_started', 'read_completed', 'download', 'signed_url_generated'
  reading_seconds INTEGER DEFAULT 0,
  page_reached INTEGER DEFAULT 1,
  total_pages INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_material_access_logs_user ON public.material_access_logs (user_id, asset_id);

-- 7. Histórico e Auditoria de Matrículas & Entitlements
CREATE TABLE IF NOT EXISTS public.enrollment_audit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'granted_manual', 'revoked', 'expired', 'subscription_bound', 'tier_check'
  reason TEXT,
  previous_status TEXT,
  new_status TEXT,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrollment_audit_target ON public.enrollment_audit_history (target_user_id);

-- 8. Função de verificação centralizada de acesso a produto/mídia
-- Verifica se o aluno tem direito ativo ao produto vinculado
CREATE OR REPLACE FUNCTION public.check_user_media_access(user_uid UUID, asset_uid UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_asset public.media_assets%ROWTYPE;
  v_is_editor boolean;
BEGIN
  -- 1. Verifica se o usuário é editor/admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uid AND role IN ('content_editor', 'admin', 'super_admin')
  ) INTO v_is_editor;

  IF v_is_editor THEN
    RETURN TRUE;
  END IF;

  -- 2. Carrega o ativo
  SELECT * INTO v_asset FROM public.media_assets WHERE id = asset_uid;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- 3. Se arquivado, aluno não acessa
  IF v_asset.is_archived THEN
    RETURN FALSE;
  END IF;

  -- 4. Se não exige entitlement, é de acesso aberto para qualquer autenticado
  IF NOT COALESCE((v_asset.access_rules->>'requires_entitlement')::boolean, false) THEN
    RETURN TRUE;
  END IF;

  -- 5. Se não tem produto vinculado, mas exige entitlement e não tem restrição explícita, verifica assinatura base
  IF v_asset.related_product_id IS NULL THEN
    -- Verifica se tem qualquer assinatura ativa ou entitlement de base
    RETURN EXISTS (
      SELECT 1 FROM public.entitlements e
      JOIN public.products p ON e.product_id = p.id
      WHERE e.user_id = user_uid 
        AND e.is_active = TRUE 
        AND (e.valid_until IS NULL OR e.valid_until > NOW())
    );
  END IF;

  -- 6. Verifica se o usuário possui entitlement ativo para o produto específico
  RETURN public.has_entitlement(user_uid, v_asset.related_product_id);
END;
$$;

-- 9. RPC Administrativa para Conceder Matrícula & Entitlement com Auditoria
CREATE OR REPLACE FUNCTION public.admin_grant_enrollment(
  p_user_id UUID,
  p_product_id UUID,
  p_valid_until TIMESTAMPTZ DEFAULT NULL,
  p_reason TEXT DEFAULT 'Concessão manual via painel'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_id UUID;
  v_entitlement_id UUID;
  v_enrollment_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF NOT public.is_admin(v_caller_id) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem conceder matrículas.';
  END IF;

  -- 1. Cria ou reativa entitlement
  INSERT INTO public.entitlements (user_id, product_id, valid_from, valid_until, is_active)
  VALUES (p_user_id, p_product_id, NOW(), p_valid_until, TRUE)
  ON CONFLICT (user_id, product_id) DO UPDATE SET
    is_active = TRUE,
    valid_from = NOW(),
    valid_until = EXCLUDED.valid_until
  RETURNING id INTO v_entitlement_id;

  -- 2. Cria ou atualiza enrollment
  INSERT INTO public.enrollments (user_id, product_id, status, started_at)
  VALUES (p_user_id, p_product_id, 'active', NOW())
  ON CONFLICT (user_id, product_id) DO UPDATE SET
    status = 'active'
  RETURNING id INTO v_enrollment_id;

  -- 3. Log de auditoria
  INSERT INTO public.enrollment_audit_history (
    actor_id, target_user_id, product_id, action, reason, new_status, valid_until
  ) VALUES (
    v_caller_id, p_user_id, p_product_id, 'granted_manual', p_reason, 'active', p_valid_until
  );

  RETURN jsonb_build_object(
    'success', true,
    'entitlement_id', v_entitlement_id,
    'enrollment_id', v_enrollment_id,
    'message', 'Matrícula e direito concedidos com sucesso.'
  );
END;
$$;

-- 10. RPC Administrativa para Revogar Matrícula & Entitlement com Justificativa
CREATE OR REPLACE FUNCTION public.admin_revoke_enrollment(
  p_user_id UUID,
  p_product_id UUID,
  p_reason TEXT DEFAULT 'Revogação manual'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF NOT public.is_admin(v_caller_id) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem revogar matrículas.';
  END IF;

  -- 1. Inativa entitlement
  UPDATE public.entitlements
  SET is_active = FALSE,
      valid_until = NOW()
  WHERE user_id = p_user_id AND product_id = p_product_id;

  -- 2. Atualiza enrollment para suspended
  UPDATE public.enrollments
  SET status = 'suspended'
  WHERE user_id = p_user_id AND product_id = p_product_id;

  -- 3. Registra auditoria
  INSERT INTO public.enrollment_audit_history (
    actor_id, target_user_id, product_id, action, reason, previous_status, new_status
  ) VALUES (
    v_caller_id, p_user_id, p_product_id, 'revoked', p_reason, 'active', 'suspended'
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Matrícula revogada e direitos inativados com sucesso.'
  );
END;
$$;

-- 11. RPC para verificar se mídia está em uso antes de deletar
CREATE OR REPLACE FUNCTION public.check_media_deletion_allowed(p_asset_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_published_blocks_count INTEGER := 0;
  v_referencing_block_title TEXT;
BEGIN
  SELECT COUNT(*), MAX(title) INTO v_published_blocks_count, v_referencing_block_title
  FROM public.content_blocks
  WHERE referenced_media_id = p_asset_id AND editorial_status = 'published';

  IF v_published_blocks_count > 0 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', format('Mídia bloqueada para exclusão: em uso pelo bloco publicado "%s". Desvincule ou arquive primeiro.', v_referencing_block_title)
    );
  END IF;

  RETURN jsonb_build_object('allowed', true);
END;
$$;

-- 12. RLS em tabelas novas e atualizadas
ALTER TABLE public.media_asset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_audit_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_asset_versions_select" ON public.media_asset_versions;
CREATE POLICY "media_asset_versions_select" ON public.media_asset_versions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "media_asset_versions_edit" ON public.media_asset_versions;
CREATE POLICY "media_asset_versions_edit" ON public.media_asset_versions
  FOR ALL TO authenticated
  USING (public.can_edit_content(auth.uid()))
  WITH CHECK (public.can_edit_content(auth.uid()));

DROP POLICY IF EXISTS "material_access_logs_select" ON public.material_access_logs;
CREATE POLICY "material_access_logs_select" ON public.material_access_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "material_access_logs_insert" ON public.material_access_logs;
CREATE POLICY "material_access_logs_insert" ON public.material_access_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "enrollment_audit_history_select" ON public.enrollment_audit_history;
CREATE POLICY "enrollment_audit_history_select" ON public.enrollment_audit_history
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR auth.uid() = target_user_id);

-- 13. Políticas de Storage (storage.objects)
-- Media Library pública: upload/delete apenas por editores/admins; select aberto
DROP POLICY IF EXISTS "media_library_public_select" ON storage.objects;
CREATE POLICY "media_library_public_select" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'media_library');

DROP POLICY IF EXISTS "media_library_editor_insert" ON storage.objects;
CREATE POLICY "media_library_editor_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media_library' AND public.can_edit_content(auth.uid()));

DROP POLICY IF EXISTS "media_library_editor_update" ON storage.objects;
CREATE POLICY "media_library_editor_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media_library' AND public.can_edit_content(auth.uid()));

DROP POLICY IF EXISTS "media_library_editor_delete" ON storage.objects;
CREATE POLICY "media_library_editor_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media_library' AND public.can_edit_content(auth.uid()));

-- Protected Materials: bucket privado. 
-- Leitura e gerenciamento direto apenas para editores e admins.
-- Alunos acessam estritamente por URLs assinadas emitidas após autorização verificada.
DROP POLICY IF EXISTS "protected_materials_admin_all" ON storage.objects;
CREATE POLICY "protected_materials_admin_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'protected_materials' AND public.can_edit_content(auth.uid()))
  WITH CHECK (bucket_id = 'protected_materials' AND public.can_edit_content(auth.uid()));
