-- MIGRATION: 20261016020000_phase43_content_trails_import_persistence.sql
-- SUBFASE 4.3: Persistência Real de Trilhas, Biblioteca Universal de Conteúdos,
-- Snapshots Imutáveis, Controle de Concorrência e Importação em Massa.
-- Idempotente e estritamente aditiva.

-- 1. TABELAS DE TRILHAS E GRAFOS PEDAGÓGICOS

CREATE TABLE IF NOT EXISTS public.trail_graphs (
  id text PRIMARY KEY,
  track_id text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  track_slug text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  revision integer NOT NULL DEFAULT 1, -- Optimistic locking counter
  status public.editorial_status NOT NULL DEFAULT 'draft'::public.editorial_status,
  nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  edges jsonb NOT NULL DEFAULT '[]'::jsonb,
  unit_id text DEFAULT 'unit-1',
  published_version integer,
  published_at timestamptz,
  published_by text,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trail_graphs_track_id ON public.trail_graphs(track_id);
CREATE INDEX IF NOT EXISTS idx_trail_graphs_status ON public.trail_graphs(status);

-- Snapshots imutáveis de versões publicadas de trilha
CREATE TABLE IF NOT EXISTS public.trail_graph_versions (
  id text PRIMARY KEY,
  track_id text NOT NULL,
  version integer NOT NULL,
  title text NOT NULL,
  graph_snapshot jsonb NOT NULL,
  nodes_snapshot jsonb NOT NULL,
  edges_snapshot jsonb NOT NULL,
  block_version_manifest jsonb NOT NULL DEFAULT '{}'::jsonb, -- Manifest exato { [nodeId]: { blockId, blockVersion, questionId, questionVersion } }
  status public.editorial_status NOT NULL DEFAULT 'published'::public.editorial_status,
  changelog text,
  published_by_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_by_name text,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_track_version UNIQUE (track_id, version)
);

CREATE INDEX IF NOT EXISTS idx_trail_graph_versions_track_id ON public.trail_graph_versions(track_id);
CREATE INDEX IF NOT EXISTS idx_trail_graph_versions_version ON public.trail_graph_versions(track_id, version);

-- 2. HISTÓRICO E CONTROLE DE LOTES DE IMPORTAÇÃO EM MASSA
CREATE TABLE IF NOT EXISTS public.content_import_batches (
  id text PRIMARY KEY,
  file_name text NOT NULL,
  file_size_bytes bigint DEFAULT 0,
  format_detected text NOT NULL,
  total_items integer NOT NULL DEFAULT 0,
  imported_blocks_count integer NOT NULL DEFAULT 0,
  imported_questions_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  imported_block_ids _text DEFAULT ARRAY[]::text[],
  imported_question_ids _text DEFAULT ARRAY[]::text[],
  batch_status text NOT NULL DEFAULT 'completed', -- pending | partial | completed | rolled_back
  execution_errors jsonb DEFAULT '[]'::jsonb,
  imported_by_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  imported_by_name text,
  rolled_back boolean NOT NULL DEFAULT false,
  rolled_back_at timestamptz,
  rolled_back_by_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  rolled_back_by_name text,
  rollback_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_import_batches_created ON public.content_import_batches(created_at DESC);

-- 3. ADIÇÕES ÀS TABELAS EXISTENTES DE CMS E PROGRESSO
ALTER TABLE public.content_blocks
  ADD COLUMN IF NOT EXISTS author text,
  ADD COLUMN IF NOT EXISTS subject_area text,
  ADD COLUMN IF NOT EXISTS associated_competencies _text DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS initial_difficulty integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS estimated_minutes integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS media_references jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS revision integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS import_batch_id text;

ALTER TABLE public.question_bank
  ADD COLUMN IF NOT EXISTS revision integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS import_batch_id text;

-- Progresso do aluno por versão específica da trilha
ALTER TABLE public.student_activity_progress
  ADD COLUMN IF NOT EXISTS track_id text,
  ADD COLUMN IF NOT EXISTS track_version integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS node_id text;

ALTER TABLE public.activity_attempts
  ADD COLUMN IF NOT EXISTS track_id text,
  ADD COLUMN IF NOT EXISTS track_version integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS node_id text;

-- 4. POLÍTICAS RLS PARA AS NOVAS TABELAS

-- RLS: trail_graphs
ALTER TABLE public.trail_graphs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trail_graphs_select_public" ON public.trail_graphs;
CREATE POLICY "trail_graphs_select_public" ON public.trail_graphs
  FOR SELECT TO authenticated
  USING (
    status = 'published'::public.editorial_status
    OR public.can_edit_content(auth.uid())
  );

DROP POLICY IF EXISTS "trail_graphs_modify_editor" ON public.trail_graphs;
CREATE POLICY "trail_graphs_modify_editor" ON public.trail_graphs
  FOR ALL TO authenticated
  USING (public.can_edit_content(auth.uid()))
  WITH CHECK (public.can_edit_content(auth.uid()));

-- RLS: trail_graph_versions
ALTER TABLE public.trail_graph_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trail_graph_versions_select" ON public.trail_graph_versions;
CREATE POLICY "trail_graph_versions_select" ON public.trail_graph_versions
  FOR SELECT TO authenticated
  USING (true); -- Alunos podem ler qualquer snapshot de versão publicado de trilha

DROP POLICY IF EXISTS "trail_graph_versions_modify_admin" ON public.trail_graph_versions;
CREATE POLICY "trail_graph_versions_modify_admin" ON public.trail_graph_versions
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- RLS: content_import_batches
ALTER TABLE public.content_import_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_import_batches_select" ON public.content_import_batches;
CREATE POLICY "content_import_batches_select" ON public.content_import_batches
  FOR SELECT TO authenticated
  USING (public.can_edit_content(auth.uid()));

DROP POLICY IF EXISTS "content_import_batches_modify" ON public.content_import_batches;
CREATE POLICY "content_import_batches_modify" ON public.content_import_batches
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 5. RPCs TRANSACIONAIS E VALIDADAS NO BACKEND

-- 5.1 Salvar rascunho de trilha com Optimistic Locking
CREATE OR REPLACE FUNCTION public.rpc_save_trail_graph_draft(
  p_track_id text,
  p_title text,
  p_description text,
  p_track_slug text,
  p_nodes jsonb,
  p_edges jsonb,
  p_expected_revision integer
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing record;
  v_new_revision integer;
BEGIN
  IF NOT public.can_edit_content(v_user_id) THEN
    RAISE EXCEPTION 'Acesso negado: permissão de edição editorial obrigatória.';
  END IF;

  SELECT * INTO v_existing FROM public.trail_graphs WHERE track_id = p_track_id;

  IF FOUND THEN
    -- Verificação de concorrência otimista
    IF p_expected_revision IS NOT NULL AND v_existing.revision != p_expected_revision THEN
      RETURN jsonb_build_object(
        'success', false,
        'conflict', true,
        'current_revision', v_existing.revision,
        'message', 'Conflito de edição detectado: este grafo foi alterado por outro usuário em outra sessão.'
      );
    END IF;

    v_new_revision := v_existing.revision + 1;

    UPDATE public.trail_graphs
    SET
      title = COALESCE(p_title, v_existing.title),
      description = COALESCE(p_description, v_existing.description),
      track_slug = COALESCE(p_track_slug, v_existing.track_slug),
      nodes = p_nodes,
      edges = p_edges,
      revision = v_new_revision,
      updated_at = now()
    WHERE track_id = p_track_id;
  ELSE
    v_new_revision := 1;
    INSERT INTO public.trail_graphs (
      id, track_id, title, description, track_slug,
      version, revision, status, nodes, edges, author_id
    ) VALUES (
      'tg-' || p_track_id, p_track_id, p_title, p_description, p_track_slug,
      1, v_new_revision, 'draft'::public.editorial_status, p_nodes, p_edges, v_user_id
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'conflict', false,
    'revision', v_new_revision,
    'track_id', p_track_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2 Publicação Atômica e Imutável de Trilha (RESTRITA A ADMIN/SUPER_ADMIN)
CREATE OR REPLACE FUNCTION public.rpc_publish_trail_graph(
  p_track_id text,
  p_changelog text,
  p_publisher_name text
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_graph record;
  v_next_version integer;
  v_snapshot_id text;
  v_node_elem jsonb;
  v_block_id text;
  v_manifest jsonb := '{}'::jsonb;
  v_block_row record;
  v_has_start boolean := false;
  v_has_end boolean := false;
BEGIN
  -- 1. Verificação estrita de RBAC no backend: editor NÃO pode publicar
  IF NOT public.is_admin(v_user_id) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem publicar snapshots de trilha.';
  END IF;

  SELECT * INTO v_graph FROM public.trail_graphs WHERE track_id = p_track_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trilha não encontrada para o track_id: %', p_track_id;
  END IF;

  -- 2. Validação canônica estrutural mínima no backend (1 nó start, pelo menos 1 track_end)
  FOR v_node_elem IN SELECT * FROM jsonb_array_elements(v_graph.nodes)
  LOOP
    IF (v_node_elem->'data'->>'nodeType') = 'start' THEN
      v_has_start := true;
    ELSIF (v_node_elem->'data'->>'nodeType') = 'track_end' THEN
      v_has_end := true;
    END IF;

    -- Constrói manifesto imutável de versões dos blocos usados
    v_block_id := v_node_elem->'data'->>'blockId';
    IF v_block_id IS NOT NULL AND v_block_id != '' THEN
      BEGIN
        SELECT id, version, editorial_status INTO v_block_row
        FROM public.content_blocks
        WHERE id = v_block_id::uuid;

        IF FOUND THEN
          v_manifest := jsonb_set(
            v_manifest,
            ARRAY[v_node_elem->>'id'],
            jsonb_build_object(
              'block_id', v_block_row.id,
              'block_version', v_block_row.version,
              'editorial_status', v_block_row.editorial_status
            ),
            true
          );
        END IF;
      EXCEPTION WHEN OTHERS THEN
        v_manifest := jsonb_set(
          v_manifest,
          ARRAY[v_node_elem->>'id'],
          jsonb_build_object(
            'block_id', v_block_id,
            'block_version', COALESCE((v_node_elem->'data'->>'blockVersion')::int, 1)
          ),
          true
        );
      END;
    END IF;
  END LOOP;

  IF NOT v_has_start THEN
    RAISE EXCEPTION 'Publicação bloqueada: o grafo não possui nó inicial de partida.';
  END IF;
  IF NOT v_has_end THEN
    RAISE EXCEPTION 'Publicação bloqueada: o grafo não possui nó final de conclusão.';
  END IF;

  v_next_version := v_graph.version + 1;
  v_snapshot_id := 'tgv-' || p_track_id || '-v' || v_next_version;

  -- 3. Cria snapshot imutável em trail_graph_versions
  INSERT INTO public.trail_graph_versions (
    id, track_id, version, title,
    graph_snapshot, nodes_snapshot, edges_snapshot,
    block_version_manifest, status, changelog,
    published_by_id, published_by_name, published_at
  ) VALUES (
    v_snapshot_id,
    p_track_id,
    v_next_version,
    v_graph.title,
    jsonb_build_object(
      'id', v_graph.id,
      'trackId', v_graph.track_id,
      'title', v_graph.title,
      'version', v_next_version,
      'nodes', v_graph.nodes,
      'edges', v_graph.edges,
      'updatedAt', now()
    ),
    v_graph.nodes,
    v_graph.edges,
    v_manifest,
    'published'::public.editorial_status,
    COALESCE(p_changelog, 'Publicação de snapshot v' || v_next_version),
    v_user_id,
    COALESCE(p_publisher_name, 'Administrador'),
    now()
  );

  -- 4. Atualiza estado da trilha mestra
  UPDATE public.trail_graphs
  SET
    version = v_next_version,
    revision = v_graph.revision + 1,
    status = 'published'::public.editorial_status,
    published_version = v_next_version,
    published_at = now(),
    published_by = COALESCE(p_publisher_name, 'Administrador'),
    updated_at = now()
  WHERE track_id = p_track_id;

  RETURN jsonb_build_object(
    'success', true,
    'version', v_next_version,
    'snapshot_id', v_snapshot_id,
    'published_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.3 Publicação Segura de Questão (RESTRITA A ADMIN, COM VALIDAÇÃO DE GABARITO)
CREATE OR REPLACE FUNCTION public.rpc_publish_question(
  p_question_id uuid,
  p_reviewer_name text
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_q record;
  v_next_version integer;
  v_snapshot jsonb;
BEGIN
  IF NOT public.is_admin(v_user_id) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem aprovar e publicar questões.';
  END IF;

  SELECT * INTO v_q FROM public.question_bank WHERE id = p_question_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Questão não encontrada: %', p_question_id;
  END IF;

  IF v_q.explanation_markdown IS NULL OR length(trim(v_q.explanation_markdown)) < 5 THEN
    RAISE EXCEPTION 'Publicação bloqueada: explicação técnica obrigatória.';
  END IF;

  IF v_q.question_type IN ('single_choice', 'true_false') THEN
    IF jsonb_array_length(COALESCE(v_q.private_key_json->'correctOptionIds', '[]'::jsonb)) != 1 THEN
      RAISE EXCEPTION 'Publicação bloqueada: exatamente 1 alternativa correta deve estar indicada no gabarito privado.';
    END IF;
  ELSIF v_q.question_type = 'numeric_response' THEN
    IF (v_q.private_key_json->>'numericExpectedValue') IS NULL THEN
      RAISE EXCEPTION 'Publicação bloqueada: valor esperado numérico é obrigatório.';
    END IF;
  END IF;

  v_next_version := v_q.version + 1;
  v_snapshot := row_to_json(v_q)::jsonb;

  -- Snapshot em question_versions
  INSERT INTO public.question_versions (
    question_id, version_number, snapshot, published_by, published_at
  ) VALUES (
    v_q.id, v_q.version, v_snapshot, v_user_id, now()
  ) ON CONFLICT (question_id, version_number) DO UPDATE
    SET snapshot = EXCLUDED.snapshot, published_at = now();

  -- Atualiza questão no question_bank
  UPDATE public.question_bank
  SET
    editorial_status = 'published'::public.editorial_status,
    version = v_next_version,
    reviewed_by = v_user_id,
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_question_id;

  RETURN jsonb_build_object(
    'success', true,
    'question_id', p_question_id,
    'version', v_next_version,
    'status', 'published'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.4 Rollback Seguro de Importação em Massa (RESTRITO A ADMIN)
CREATE OR REPLACE FUNCTION public.rpc_rollback_import_batch(
  p_batch_id text,
  p_actor_name text,
  p_reason text
)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_batch record;
  v_item_id text;
  v_rolled_count integer := 0;
  v_archived_count integer := 0;
  v_attempts_exist boolean;
  v_blk_record record;
  v_qst_record record;
BEGIN
  IF NOT public.is_admin(v_user_id) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem reverter importações.';
  END IF;

  SELECT * INTO v_batch FROM public.content_import_batches WHERE id = p_batch_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lote de importação não encontrado: %', p_batch_id;
  END IF;

  IF v_batch.rolled_back THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Este lote já foi revertido anteriormente.',
      'rolled_count', 0
    );
  END IF;

  -- 1. Reversão segura de blocos
  IF v_batch.imported_block_ids IS NOT NULL THEN
    FOREACH v_item_id IN ARRAY v_batch.imported_block_ids
    LOOP
      BEGIN
        SELECT * INTO v_blk_record FROM public.content_blocks WHERE id = v_item_id::uuid;
        IF FOUND THEN
          -- Se publicado, NUNCA exclui fisicamente; arquiva para preservar integridade
          IF v_blk_record.editorial_status = 'published' THEN
            UPDATE public.content_blocks
            SET editorial_status = 'archived'::public.editorial_status, updated_at = now()
            WHERE id = v_blk_record.id;
            v_archived_count := v_archived_count + 1;
          ELSE
            DELETE FROM public.content_blocks WHERE id = v_blk_record.id;
            v_rolled_count := v_rolled_count + 1;
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END LOOP;
  END IF;

  -- 2. Reversão segura de questões
  IF v_batch.imported_question_ids IS NOT NULL THEN
    FOREACH v_item_id IN ARRAY v_batch.imported_question_ids
    LOOP
      BEGIN
        SELECT * INTO v_qst_record FROM public.question_bank WHERE id = v_item_id::uuid;
        IF FOUND THEN
          -- Verifica se algum aluno já respondeu a esta questão em attempt_answers
          SELECT EXISTS(
            SELECT 1 FROM public.attempt_answers WHERE question_id = v_qst_record.id
          ) INTO v_attempts_exist;

          IF v_qst_record.editorial_status = 'published' OR v_attempts_exist THEN
            UPDATE public.question_bank
            SET editorial_status = 'archived'::public.editorial_status, updated_at = now()
            WHERE id = v_qst_record.id;
            v_archived_count := v_archived_count + 1;
          ELSE
            DELETE FROM public.question_bank WHERE id = v_qst_record.id;
            v_rolled_count := v_rolled_count + 1;
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END LOOP;
  END IF;

  -- Atualiza o lote
  UPDATE public.content_import_batches
  SET
    rolled_back = true,
    batch_status = 'rolled_back',
    rolled_back_at = now(),
    rolled_back_by_id = v_user_id,
    rolled_back_by_name = COALESCE(p_actor_name, 'Admin'),
    rollback_reason = p_reason
  WHERE id = p_batch_id;

  RETURN jsonb_build_object(
    'success', true,
    'rolled_deleted_count', v_rolled_count,
    'archived_count', v_archived_count,
    'message', format('Rollback concluído: %s item(ns) removidos e %s item(ns) arquivados com segurança.', v_rolled_count, v_archived_count)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. SEED INICIAL: PERSISTIR TRILHA CANÔNICA DE VIGAS SE NECESSÁRIO
DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  SELECT id INTO v_admin_id FROM public.profiles WHERE email = 'fgoedel@gmail.com' LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM public.trail_graphs WHERE track_id = 'track-mef-01') THEN
    INSERT INTO public.trail_graphs (
      id, track_id, title, description, track_slug,
      version, revision, status,
      nodes, edges, author_id
    ) VALUES (
      'tg-track-mef-01',
      'track-mef-01',
      'Trilha Canônica: Fundamentos de Flexão e MEF',
      'Fluxo estruturado com 9 nós, portão adaptativo de proficiência e branches de revisão ativa.',
      'flexao-vigas-mef',
      1,
      1,
      'published'::public.editorial_status,
      '[]'::jsonb,
      '[]'::jsonb,
      v_admin_id
    );
  END IF;
END $$;
