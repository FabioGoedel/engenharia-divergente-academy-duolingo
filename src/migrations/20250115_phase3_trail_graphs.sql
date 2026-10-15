-- ==============================================================================
-- Engenharia Divergente Academy — Migração Aditiva e Não Destrutiva FASE 3
-- Tabelas de Grafo de Trilhas, Versões Imutáveis e Progresso do Aluno
-- ==============================================================================

-- 1. Tabela de Trilhas e Grafos de Domínio (trail_graphs)
CREATE TABLE IF NOT EXISTS public.trail_graphs (
    id TEXT PRIMARY KEY,
    track_id TEXT NOT NULL UNIQUE,
    track_slug TEXT NOT NULL,
    title TEXT NOT NULL,
    headline TEXT DEFAULT '',
    description TEXT DEFAULT '',
    units JSONB DEFAULT '[]'::jsonb,
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    edges JSONB NOT NULL DEFAULT '[]'::jsonb,
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'published', 'archived')),
    published_by TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Snapshots Imutáveis de Versões Publicadas (trail_graph_versions)
CREATE TABLE IF NOT EXISTS public.trail_graph_versions (
    id TEXT PRIMARY KEY,
    track_id TEXT NOT NULL REFERENCES public.trail_graphs(track_id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    graph_json JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'archived')),
    published_by TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    changelog TEXT DEFAULT 'Versão publicada do grafo pedagógico',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_trail_track_version UNIQUE (track_id, version)
);

-- 3. Progresso Individual do Aluno na Trilha (learner_trail_progress)
CREATE TABLE IF NOT EXISTS public.learner_trail_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    track_id TEXT NOT NULL,
    current_active_node_id TEXT,
    nodes_progress JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_xp_earned INTEGER NOT NULL DEFAULT 0,
    unlocked_achievement_node_ids JSONB DEFAULT '[]'::jsonb,
    completed_at TIMESTAMPTZ,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_learner_track UNIQUE (user_id, track_id)
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_trail_graphs_track_slug ON public.trail_graphs(track_slug);
CREATE INDEX IF NOT EXISTS idx_trail_graph_versions_track_id ON public.trail_graph_versions(track_id);
CREATE INDEX IF NOT EXISTS idx_learner_trail_progress_user ON public.learner_trail_progress(user_id, track_id);

-- RLS (Row Level Security) - Preparado para Supabase
ALTER TABLE public.trail_graphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trail_graph_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_trail_progress ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública/Aluno para Trilhas Publicadas
CREATE POLICY "Trilhas publicadas visíveis para alunos autenticados"
ON public.trail_graphs FOR SELECT
USING (status = 'published');

CREATE POLICY "Snapshots de versões visíveis para leitura"
ON public.trail_graph_versions FOR SELECT
USING (true);

-- Alunos acessam e atualizam apenas o próprio progresso
CREATE POLICY "Aluno acessa apenas seu próprio progresso"
ON public.learner_trail_progress FOR ALL
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);
