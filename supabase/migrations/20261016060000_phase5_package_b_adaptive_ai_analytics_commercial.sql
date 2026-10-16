-- ==============================================================================
-- Migration: 20261016060000_phase5_package_b_adaptive_ai_analytics_commercial.sql
-- Descrição: Fase 5 — Pacote B: Aprendizagem Adaptativa, IA Pedagógica, Analytics e Relacionamento Comercial
-- Regras: EXCLUSIVAMENTE ADITIVA, idempotente, RLS ativado, integridade referencial
-- ==============================================================================

-- 1. ENUMS E TIPOS AUXILIARES
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assistance_stage_level') THEN
    CREATE TYPE assistance_stage_level AS ENUM (
      'stage_1_detailed_review',
      'stage_2_assisted_with_formulas',
      'stage_3_retrieval_with_hints',
      'stage_4_independent_application',
      'stage_5_transfer_engineering'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'diagnostic_status') THEN
    CREATE TYPE diagnostic_status AS ENUM (
      'in_progress',
      'completed',
      'abandoned'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commercial_campaign_status') THEN
    CREATE TYPE commercial_campaign_status AS ENUM (
      'draft',
      'active',
      'paused',
      'completed'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tutor_pedagogical_mode') THEN
    CREATE TYPE tutor_pedagogical_mode AS ENUM (
      'study_mode',
      'hint_mode',
      'assessment_mode',
      'post_answer_review'
    );
  END IF;
END $$;

-- 2. TABELA: adaptive_policies (Políticas configuráveis do motor adaptativo)
CREATE TABLE IF NOT EXISTS public.adaptive_policies (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Limiares de progressão
  min_accuracy_to_advance NUMERIC NOT NULL DEFAULT 70.0,
  max_error_rate_to_review NUMERIC NOT NULL DEFAULT 40.0,
  perceived_difficulty_weight NUMERIC NOT NULL DEFAULT 0.25,
  hints_used_penalty_weight NUMERIC NOT NULL DEFAULT 0.20,
  objective_accuracy_weight NUMERIC NOT NULL DEFAULT 0.40,
  uncertainty_frequency_weight NUMERIC NOT NULL DEFAULT 0.15,
  min_attempts_before_decision INTEGER NOT NULL DEFAULT 2,
  allow_student_override_challenge BOOLEAN NOT NULL DEFAULT true,
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA: diagnostic_assessments_config (Configuração de avaliações diagnósticas/nivelamento inicial)
CREATE TABLE IF NOT EXISTS public.diagnostic_assessments_config (
  id TEXT PRIMARY KEY,
  track_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  max_retakes_per_student INTEGER NOT NULL DEFAULT 2,
  retake_cooldown_days INTEGER NOT NULL DEFAULT 14,
  competencies_covered TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  question_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  starting_point_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABELA: student_diagnostic_results (Resultados do nivelamento por competência e ponto de partida)
CREATE TABLE IF NOT EXISTS public.student_diagnostic_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assessment_id TEXT NOT NULL REFERENCES public.diagnostic_assessments_config(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,
  status diagnostic_status NOT NULL DEFAULT 'in_progress',
  competency_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommended_starting_nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_questions INTEGER NOT NULL DEFAULT 0,
  score_percent NUMERIC NOT NULL DEFAULT 0,
  active_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_student_diag_user_track ON public.student_diagnostic_results(user_id, track_id);

-- 5. TABELA: question_calibrations (Calibração editorial de dificuldade, taxa de acerto e assistência)
CREATE TABLE IF NOT EXISTS public.question_calibrations (
  question_id UUID PRIMARY KEY REFERENCES public.question_bank(id) ON DELETE CASCADE,
  competency_code TEXT,
  total_answers_count INTEGER NOT NULL DEFAULT 0,
  correct_answers_count INTEGER NOT NULL DEFAULT 0,
  accuracy_rate NUMERIC NOT NULL DEFAULT 0,
  avg_perceived_difficulty NUMERIC NOT NULL DEFAULT 3.0,
  uncertainty_count INTEGER NOT NULL DEFAULT 0,
  total_hints_used INTEGER NOT NULL DEFAULT 0,
  avg_active_seconds NUMERIC NOT NULL DEFAULT 0,
  current_calibrated_stage assistance_stage_level NOT NULL DEFAULT 'stage_3_retrieval_with_hints',
  is_flagged_for_editorial_review BOOLEAN NOT NULL DEFAULT false,
  editorial_notes TEXT,
  last_calibrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_calib_flagged ON public.question_calibrations(is_flagged_for_editorial_review);

-- 6. TABELA: ai_tutor_config (Configuração central da IA pedagógica pelo Admin)
CREATE TABLE IF NOT EXISTS public.ai_tutor_config (
  id TEXT PRIMARY KEY DEFAULT 'default_tutor_config',
  provider TEXT NOT NULL DEFAULT 'openai',
  model_name TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  max_questions_per_student_per_day INTEGER NOT NULL DEFAULT 30,
  pedagogical_instructions TEXT NOT NULL DEFAULT 'Você é o Tutor de IA da Engenharia Divergente Academy...',
  prohibited_topics TEXT[] NOT NULL DEFAULT ARRAY['revelar_gabarito', 'fornecer_resposta_final', 'inventar_normas']::TEXT[],
  cost_per_1k_tokens_cents INTEGER NOT NULL DEFAULT 2,
  total_tokens_consumed BIGINT NOT NULL DEFAULT 0,
  total_requests_count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABELA: ai_tutor_conversations (Registro de interações pedagógicas, auditoria de tokens e segurança)
CREATE TABLE IF NOT EXISTS public.ai_tutor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id TEXT,
  competency_code TEXT,
  mode tutor_pedagogical_mode NOT NULL DEFAULT 'study_mode',
  prompt_message TEXT NOT NULL,
  response_message TEXT NOT NULL,
  authorized_context_used JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_private_key_redacted BOOLEAN NOT NULL DEFAULT true,
  tokens_prompt INTEGER NOT NULL DEFAULT 0,
  tokens_completion INTEGER NOT NULL DEFAULT 0,
  flagged_for_editorial_review BOOLEAN NOT NULL DEFAULT false,
  user_rating INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_tutor_user_conv ON public.ai_tutor_conversations(user_id, created_at);

-- 8. TABELA: commercial_campaigns (Campanhas comerciais discretas, sem checkout nesta fase)
CREATE TABLE IF NOT EXISTS public.commercial_campaigns (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  target_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  target_product_code TEXT NOT NULL,
  headline TEXT NOT NULL,
  body_text TEXT NOT NULL,
  banner_placement TEXT NOT NULL DEFAULT 'dashboard_contextual',
  cta_label TEXT NOT NULL DEFAULT 'Conhecer Trilha Especializada',
  cta_url TEXT NOT NULL DEFAULT '/app/assinatura',
  status commercial_campaign_status NOT NULL DEFAULT 'active',
  priority INTEGER NOT NULL DEFAULT 1,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  max_impressions_per_student INTEGER NOT NULL DEFAULT 3,
  exclude_if_already_entitled BOOLEAN NOT NULL DEFAULT true,
  required_prerequisite_track_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABELA: commercial_campaign_interactions (Visualizações e cliques para métricas comerciais sem matrícula automática)
CREATE TABLE IF NOT EXISTS public.commercial_campaign_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT NOT NULL REFERENCES public.commercial_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'impression' | 'click' | 'dismiss'
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_interactions_user ON public.commercial_campaign_interactions(user_id, campaign_id);

-- 10. TABELA: adaptive_recommendation_logs (Histórico explicável de decisões do motor determinístico)
CREATE TABLE IF NOT EXISTS public.adaptive_recommendation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,
  current_node_id TEXT,
  competency_code TEXT,
  recommended_action TEXT NOT NULL, -- 'review_prerequisites' | 'equivalent_exercise' | 'advance_difficulty' | 'integrative_mission'
  recommended_node_or_exercise_id TEXT,
  recommendation_reason TEXT NOT NULL,
  decision_factors JSONB NOT NULL DEFAULT '{}'::jsonb,
  student_overrode_choice BOOLEAN NOT NULL DEFAULT false,
  student_chosen_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adaptive_logs_user ON public.adaptive_recommendation_logs(user_id, created_at);

-- ==============================================================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- ==============================================================================

ALTER TABLE public.adaptive_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_assessments_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_calibrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tutor_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tutor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_campaign_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adaptive_recommendation_logs ENABLE ROW LEVEL SECURITY;

-- adaptive_policies: todos autenticados leem; apenas admin modifica
DROP POLICY IF EXISTS "adaptive_policies_select" ON public.adaptive_policies;
CREATE POLICY "adaptive_policies_select" ON public.adaptive_policies
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "adaptive_policies_admin_all" ON public.adaptive_policies;
CREATE POLICY "adaptive_policies_admin_all" ON public.adaptive_policies
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- diagnostic_assessments_config: autenticados leem ativas; admin gerencia
DROP POLICY IF EXISTS "diagnostic_config_select" ON public.diagnostic_assessments_config;
CREATE POLICY "diagnostic_config_select" ON public.diagnostic_assessments_config
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "diagnostic_config_admin_all" ON public.diagnostic_assessments_config;
CREATE POLICY "diagnostic_config_admin_all" ON public.diagnostic_assessments_config
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- student_diagnostic_results: aluno manipula os seus; admin lê todos
DROP POLICY IF EXISTS "student_diagnostic_results_user" ON public.student_diagnostic_results;
CREATE POLICY "student_diagnostic_results_user" ON public.student_diagnostic_results
  FOR ALL TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- question_calibrations: autenticados leem; admin/editor gerencia
DROP POLICY IF EXISTS "question_calibrations_select" ON public.question_calibrations;
CREATE POLICY "question_calibrations_select" ON public.question_calibrations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "question_calibrations_admin_all" ON public.question_calibrations;
CREATE POLICY "question_calibrations_admin_all" ON public.question_calibrations
  FOR ALL TO authenticated USING (public.can_edit_content(auth.uid())) WITH CHECK (public.can_edit_content(auth.uid()));

-- ai_tutor_config: autenticados leem; admin gerencia
DROP POLICY IF EXISTS "ai_tutor_config_select" ON public.ai_tutor_config;
CREATE POLICY "ai_tutor_config_select" ON public.ai_tutor_config
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ai_tutor_config_admin_all" ON public.ai_tutor_config;
CREATE POLICY "ai_tutor_config_admin_all" ON public.ai_tutor_config
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ai_tutor_conversations: aluno lê e insere as suas; admin lê todas
DROP POLICY IF EXISTS "ai_tutor_conversations_user_select" ON public.ai_tutor_conversations;
CREATE POLICY "ai_tutor_conversations_user_select" ON public.ai_tutor_conversations
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "ai_tutor_conversations_user_insert" ON public.ai_tutor_conversations;
CREATE POLICY "ai_tutor_conversations_user_insert" ON public.ai_tutor_conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "ai_tutor_conversations_admin_update" ON public.ai_tutor_conversations;
CREATE POLICY "ai_tutor_conversations_admin_update" ON public.ai_tutor_conversations
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- commercial_campaigns: autenticados leem ativas; admin gerencia
DROP POLICY IF EXISTS "commercial_campaigns_select" ON public.commercial_campaigns;
CREATE POLICY "commercial_campaigns_select" ON public.commercial_campaigns
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "commercial_campaigns_admin_all" ON public.commercial_campaigns;
CREATE POLICY "commercial_campaigns_admin_all" ON public.commercial_campaigns
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- commercial_campaign_interactions: aluno insere suas interações; admin lê todas
DROP POLICY IF EXISTS "campaign_interactions_user_insert" ON public.commercial_campaign_interactions;
CREATE POLICY "campaign_interactions_user_insert" ON public.commercial_campaign_interactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "campaign_interactions_admin_select" ON public.commercial_campaign_interactions;
CREATE POLICY "campaign_interactions_admin_select" ON public.commercial_campaign_interactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- adaptive_recommendation_logs: aluno lê suas recomendações; admin lê todas; inserções permitidas
DROP POLICY IF EXISTS "adaptive_logs_select" ON public.adaptive_recommendation_logs;
CREATE POLICY "adaptive_logs_select" ON public.adaptive_recommendation_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "adaptive_logs_insert" ON public.adaptive_recommendation_logs;
CREATE POLICY "adaptive_logs_insert" ON public.adaptive_recommendation_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "adaptive_logs_update" ON public.adaptive_recommendation_logs;
CREATE POLICY "adaptive_logs_update" ON public.adaptive_recommendation_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ==============================================================================
-- SEED DATA INICIAL IDEMPOTENTE (Fase 5 Pacote B)
-- ==============================================================================

-- 1. Política Adaptativa Padrão
INSERT INTO public.adaptive_policies (
  id, version, title, description, is_active,
  min_accuracy_to_advance, max_error_rate_to_review,
  perceived_difficulty_weight, hints_used_penalty_weight,
  objective_accuracy_weight, uncertainty_frequency_weight,
  min_attempts_before_decision, allow_student_override_challenge
) VALUES (
  'policy_default_v1', 1,
  'Política Determinística Padrão da Engenharia Divergente',
  'Combina acurácia objetiva (40%), esforço percebido (25%), penalidade de dicas (20%) e incerteza (15%). Decisões após no mínimo 2 tentativas.',
  true,
  70.0, 40.0,
  0.25, 0.20,
  0.40, 0.15,
  2, true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  updated_at = NOW();

-- 2. Avaliação Diagnóstica Inicial (Nivelamento) para Flexão e MEF
INSERT INTO public.diagnostic_assessments_config (
  id, track_id, title, description, is_active,
  duration_minutes, max_retakes_per_student, retake_cooldown_days,
  competencies_covered, starting_point_rules
) VALUES (
  'diag-resmat-mef-01',
  'track-resmat-flexao',
  'Diagnóstico de Nivelamento: Resistência dos Materiais e Introdução ao MEF',
  'Avaliação diagnóstica multi-competência para calibrar o ponto de partida na trilha canônica sem exigir repetição de conteúdos já dominados.',
  true,
  35, 3, 7,
  ARRAY['COMP-RESMAT-01', 'COMP-RESMAT-02', 'COMP-MEF-01', 'COMP-MEF-02']::TEXT[],
  '[
    {"competency": "COMP-RESMAT-01", "threshold_high": 75, "start_node": "node-flexao-avancada"},
    {"competency": "COMP-RESMAT-01", "threshold_low": 40, "start_node": "node-fundamentos-flexao"},
    {"competency": "COMP-MEF-01", "threshold_high": 70, "start_node": "node-mef-convergencia"},
    {"competency": "COMP-MEF-01", "threshold_low": 50, "start_node": "node-mef-intro"}
  ]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  updated_at = NOW();

-- 3. Configuração Padrão do Tutor de IA (Desabilitado por padrão se não houver chave real configurada)
INSERT INTO public.ai_tutor_config (
  id, provider, model_name, is_enabled,
  max_questions_per_student_per_day,
  pedagogical_instructions
) VALUES (
  'default_tutor_config', 'openai', 'gpt-4o-mini', false, 25,
  'Você é o Tutor de IA da Engenharia Divergente Academy. Seu papel é EXPLICATIVO e PEDAGÓGICO. Jamais forneça o gabarito final ou a resposta numérica direta de exercícios avaliativos. Oriente o aluno através do método investigativo: indique equações fundamentais da resistência dos materiais (Euler-Bernoulli, Navier, inércia) e alerte sobre hipóteses físicas simplificadoras.'
) ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- 4. Campanhas Comerciais Padrão (Discretas, respeitando regras do usuário)
INSERT INTO public.commercial_campaigns (
  id, title, slug, target_product_code, headline, body_text,
  banner_placement, cta_label, cta_url, status, priority,
  max_impressions_per_student, exclude_if_already_entitled
) VALUES
(
  'camp-mef-mdzam-01',
  'Aprofundamento em Elementos Finitos: Programa MDZAM',
  'oferta-mdzam-mef',
  'PROD-MEF-01',
  'Deseja dominar a formulação de elementos finitos além das equações básicas?',
  'O programa MDZAM da Engenharia Divergente aprofunda matrizes de rigidez, integração numérica e análise não-linear de estruturas.',
  'dashboard_contextual',
  'Conhecer Programa MDZAM',
  '/app/assinatura',
  'active', 1, 3, true
),
(
  'camp-solidworks-simulation-01',
  'Modelagem e Simulação CAE com SOLIDWORKS Simulation',
  'oferta-solidworks-simulation',
  'PROD-CAE-01',
  'Prática deliberada em ferramentas de simulação computacional comercial',
  'Aprenda a configurar malhas, condições de contorno e critérios de escoamento com rigor de engenheiro de cálculo.',
  'dashboard_contextual',
  'Ver Trilha SOLIDWORKS Simulation',
  '/app/assinatura',
  'active', 2, 3, true
),
(
  'camp-estruturas-metalicas-01',
  'Especialização em Estruturas Metálicas e Perfis Formados a Frio',
  'oferta-estruturas-metalicas',
  'PROD-ESTRUT-01',
  'Dimensionamento normativo pelas NBR 8800 e NBR 14762',
  'Da concepção estrutural à estabilidade global de vigas esbeltas e pórticos industriais.',
  'dashboard_contextual',
  'Acessar Ementa de Estruturas',
  '/app/assinatura',
  'active', 3, 3, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  updated_at = NOW();
