-- Migration Fase 5 Pacote A: Experiência do Aluno, Gamificação, Motivação e Multimaterial
-- Totalmente ADITIVA e IDEMPOTENTE com RLS completo para proteção de dados de alunos e RBAC administrativo

-- 1. Regras e Níveis de Gamificação (configuráveis por administradores)
CREATE TABLE IF NOT EXISTS public.gamification_levels (
  id text PRIMARY KEY,
  level_number integer NOT NULL UNIQUE,
  title text NOT NULL,
  min_xp integer NOT NULL DEFAULT 0,
  badge_code text,
  perks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Conquistas e Medalhas (Catálogo oficial de insígnias de engenharia)
CREATE TABLE IF NOT EXISTS public.gamification_achievements (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'engagement', -- engagement, technical_mastery, autonomy, streak
  xp_reward integer NOT NULL DEFAULT 50,
  rarity text NOT NULL DEFAULT 'Comum', -- Comum, Especial, Épica, Lendária
  icon_name text NOT NULL DEFAULT 'Award',
  condition_type text NOT NULL, -- first_mission, streak_days, xp_threshold, autonomous_streak, reviews_completed, competency_mastered
  condition_threshold integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Conquistas Desbloqueadas por Aluno (histórico imutável de recompensas)
CREATE TABLE IF NOT EXISTS public.student_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id text NOT NULL REFERENCES public.gamification_achievements(id) ON DELETE CASCADE,
  xp_awarded integer NOT NULL DEFAULT 0,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT unique_student_achievement UNIQUE (user_id, achievement_id)
);

-- 4. Metas Diárias e Telemetria de Tempo Ativo Diário do Aluno
CREATE TABLE IF NOT EXISTS public.student_daily_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_minutes integer NOT NULL DEFAULT 15,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_daily_goal UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.student_daily_study_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  study_date date NOT NULL DEFAULT current_date,
  active_seconds integer NOT NULL DEFAULT 0,
  goal_reached boolean NOT NULL DEFAULT false,
  missions_completed_count integer NOT NULL DEFAULT 0,
  exercises_answered_count integer NOT NULL DEFAULT 0,
  xp_earned_today integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_study_date UNIQUE (user_id, study_date)
);

-- 5. Preferências de Aluno (pedagógicas separadas de comunicações comerciais)
CREATE TABLE IF NOT EXISTS public.student_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'dark', -- dark, light, system
  reduced_motion boolean NOT NULL DEFAULT false,
  daily_goal_minutes integer NOT NULL DEFAULT 15,
  motivational_messages_enabled boolean NOT NULL DEFAULT true,
  motivational_frequency text NOT NULL DEFAULT 'balanced', -- minimal, balanced, frequent
  pedagogical_notifications_enabled boolean NOT NULL DEFAULT true,
  sound_effects_enabled boolean NOT NULL DEFAULT true,
  video_autoplay boolean NOT NULL DEFAULT false,
  video_default_speed numeric NOT NULL DEFAULT 1.0,
  commercial_marketing_opt_in boolean NOT NULL DEFAULT false, -- SEPARADO estritamente do pedagógico
  partner_offers_opt_in boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- 6. Motor de Mensagens Contextuais Pedagógicas
CREATE TABLE IF NOT EXISTS public.pedagogical_messages_config (
  id text PRIMARY KEY,
  trigger_event text NOT NULL, -- first_access, first_mission, goal_reached, streak_milestone, performance_improved, unit_completed, level_up, repeated_difficulty, return_after_inactivity, review_completed, competency_acquired
  title text NOT NULL,
  message_text text NOT NULL,
  tone text NOT NULL DEFAULT 'supportive_technical',
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 1,
  max_impressions_per_user integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_message_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_id text NOT NULL REFERENCES public.pedagogical_messages_config(id) ON DELETE CASCADE,
  trigger_event text NOT NULL,
  shown_at timestamptz NOT NULL DEFAULT now(),
  dismissed_at timestamptz
);

-- 7. Vídeos do Mentor (Fábio Goedel) vinculados a eventos pedagógicos
CREATE TABLE IF NOT EXISTS public.pedagogical_mentor_videos (
  id text PRIMARY KEY,
  trigger_event text NOT NULL, -- first_access, unit_completed, level_up, achievement_unlocked, return_after_inactivity, pedagogical_guidance, track_opened, course_completed
  title text NOT NULL,
  description text,
  support_message text NOT NULL,
  provider text NOT NULL DEFAULT 'youtube', -- youtube, vimeo, cloudflare_stream, supabase_storage
  video_url_or_id text NOT NULL,
  thumbnail_url text,
  duration_seconds integer DEFAULT 0,
  priority integer NOT NULL DEFAULT 1,
  is_mandatory boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  button_label text NOT NULL DEFAULT 'Continuar Estudos',
  related_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  related_node_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_mentor_video_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id text NOT NULL REFERENCES public.pedagogical_mentor_videos(id) ON DELETE CASCADE,
  trigger_event text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  completed boolean NOT NULL DEFAULT false,
  CONSTRAINT unique_student_video_trigger UNIQUE (user_id, video_id, trigger_event)
);

-- 8. Telemetria Mínima e Respeitosa de Privacidade
CREATE TABLE IF NOT EXISTS public.student_telemetry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- dashboard_opened, activity_started, activity_completed, review_started, review_completed, goal_reached, video_viewed, video_completed, achievement_unlocked
  entity_id text,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_student_achievements_user ON public.student_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_student_daily_study_user_date ON public.student_daily_study_logs(user_id, study_date);
CREATE INDEX IF NOT EXISTS idx_student_telemetry_user ON public.student_telemetry_events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_mentor_videos_trigger ON public.pedagogical_mentor_videos(trigger_event, is_active);
CREATE INDEX IF NOT EXISTS idx_pedagogical_messages_trigger ON public.pedagogical_messages_config(trigger_event, is_active);

-- HABILITAR RLS EM TODAS AS TABELAS NOVAS
ALTER TABLE public.gamification_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_daily_study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedagogical_messages_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_message_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedagogical_mentor_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_mentor_video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_telemetry_events ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS IDEMPOTENTES (DROP IF EXISTS antes de CREATE POLICY)

-- 1. gamification_levels: Qualquer usuário autenticado pode ler; apenas admin gerencia
DROP POLICY IF EXISTS "levels_read_all" ON public.gamification_levels;
CREATE POLICY "levels_read_all" ON public.gamification_levels
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "levels_manage_admin" ON public.gamification_levels;
CREATE POLICY "levels_manage_admin" ON public.gamification_levels
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 2. gamification_achievements: Leitura por todos; modificação por admin
DROP POLICY IF EXISTS "achievements_read_all" ON public.gamification_achievements;
CREATE POLICY "achievements_read_all" ON public.gamification_achievements
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "achievements_manage_admin" ON public.gamification_achievements;
CREATE POLICY "achievements_manage_admin" ON public.gamification_achievements
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 3. student_achievements: Aluno lê as suas próprias ou admin lê todas
DROP POLICY IF EXISTS "student_achievements_read" ON public.student_achievements;
CREATE POLICY "student_achievements_read" ON public.student_achievements
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "student_achievements_insert" ON public.student_achievements;
CREATE POLICY "student_achievements_insert" ON public.student_achievements
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 4. student_daily_goals: Aluno gerencia sua meta
DROP POLICY IF EXISTS "daily_goals_read" ON public.student_daily_goals;
CREATE POLICY "daily_goals_read" ON public.student_daily_goals
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "daily_goals_insert" ON public.student_daily_goals;
CREATE POLICY "daily_goals_insert" ON public.student_daily_goals
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "daily_goals_update" ON public.student_daily_goals;
CREATE POLICY "daily_goals_update" ON public.student_daily_goals
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid())) WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 5. student_daily_study_logs: Aluno lê/atualiza seus logs diários
DROP POLICY IF EXISTS "study_logs_read" ON public.student_daily_study_logs;
CREATE POLICY "study_logs_read" ON public.student_daily_study_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "study_logs_insert" ON public.student_daily_study_logs;
CREATE POLICY "study_logs_insert" ON public.student_daily_study_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "study_logs_update" ON public.student_daily_study_logs;
CREATE POLICY "study_logs_update" ON public.student_daily_study_logs
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid())) WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 6. student_preferences: Aluno gerencia suas preferências
DROP POLICY IF EXISTS "preferences_read" ON public.student_preferences;
CREATE POLICY "preferences_read" ON public.student_preferences
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "preferences_insert" ON public.student_preferences;
CREATE POLICY "preferences_insert" ON public.student_preferences
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "preferences_update" ON public.student_preferences;
CREATE POLICY "preferences_update" ON public.student_preferences
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid())) WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 7. pedagogical_messages_config: Todos leem regras ativas; admin gerencia
DROP POLICY IF EXISTS "messages_config_read" ON public.pedagogical_messages_config;
CREATE POLICY "messages_config_read" ON public.pedagogical_messages_config
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "messages_config_manage_admin" ON public.pedagogical_messages_config;
CREATE POLICY "messages_config_manage_admin" ON public.pedagogical_messages_config
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 8. student_message_impressions: Aluno registra suas impressões
DROP POLICY IF EXISTS "message_impressions_read" ON public.student_message_impressions;
CREATE POLICY "message_impressions_read" ON public.student_message_impressions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "message_impressions_insert" ON public.student_message_impressions;
CREATE POLICY "message_impressions_insert" ON public.student_message_impressions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "message_impressions_update" ON public.student_message_impressions;
CREATE POLICY "message_impressions_update" ON public.student_message_impressions
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 9. pedagogical_mentor_videos: Todos leem vídeos ativos; admin gerencia
DROP POLICY IF EXISTS "mentor_videos_read" ON public.pedagogical_mentor_videos;
CREATE POLICY "mentor_videos_read" ON public.pedagogical_mentor_videos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "mentor_videos_manage_admin" ON public.pedagogical_mentor_videos;
CREATE POLICY "mentor_videos_manage_admin" ON public.pedagogical_mentor_videos
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 10. student_mentor_video_views: Aluno visualiza e registra
DROP POLICY IF EXISTS "mentor_video_views_read" ON public.student_mentor_video_views;
CREATE POLICY "mentor_video_views_read" ON public.student_mentor_video_views
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "mentor_video_views_insert" ON public.student_mentor_video_views;
CREATE POLICY "mentor_video_views_insert" ON public.student_mentor_video_views
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "mentor_video_views_update" ON public.student_mentor_video_views;
CREATE POLICY "mentor_video_views_update" ON public.student_mentor_video_views
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 11. student_telemetry_events: Telemetria mínima
DROP POLICY IF EXISTS "telemetry_insert" ON public.student_telemetry_events;
CREATE POLICY "telemetry_insert" ON public.student_telemetry_events
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "telemetry_read_admin" ON public.student_telemetry_events;
CREATE POLICY "telemetry_read_admin" ON public.student_telemetry_events
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));


-- SEED DATA INICIAL IDEMPOTENTE (Níveis, Conquistas, Mensagens e Vídeos Pedagógicos)

-- 1. Níveis Técnicos de Engenharia
INSERT INTO public.gamification_levels (id, level_number, title, min_xp, badge_code, perks)
VALUES
  ('lvl-1', 1, 'Iniciante Divergente', 0, 'badge_divergent_init', 'Acesso ao catálogo e mapa de trilhas'),
  ('lvl-2', 2, 'Praticante de Métodos', 250, 'badge_methods_practitioner', 'Desbloqueio da Calculadora de Engenharia com unidades'),
  ('lvl-3', 3, 'Calculista Assistido', 750, 'badge_assisted_calculator', 'Módulos avançados de flexão e esforço cortante'),
  ('lvl-4', 4, 'Analista Estrutural Jr.', 1500, 'badge_structural_jr', 'Simulação e desafios de formulação fraca'),
  ('lvl-5', 5, 'Especialista em MEF Pleno', 3000, 'badge_fem_specialist', 'Desafios não lineares e dinâmicos'),
  ('lvl-6', 6, 'Engenheiro Divergente Master', 5000, 'badge_divergent_master', 'Projetos autorais e certificação master')
ON CONFLICT (id) DO NOTHING;

-- 2. Conquistas Oficiais Sóbrias de Engenharia
INSERT INTO public.gamification_achievements (id, code, title, description, category, xp_reward, rarity, icon_name, condition_type, condition_threshold)
VALUES
  ('ach-first-mission', 'FIRST_MISSION_SOLVED', 'Primeiro Passo Rigoroso', 'Concluiu a primeira missão interativa validando hipóteses e cálculos.', 'engagement', 50, 'Comum', 'CheckCircle2', 'first_mission', 1),
  ('ach-streak-3', 'STREAK_3_DAYS', 'Frequência Técnica (3 dias)', 'Manteve 3 dias consecutivos de dedicação sem interrupção.', 'streak', 75, 'Comum', 'Flame', 'streak_days', 3),
  ('ach-streak-7', 'STREAK_7_DAYS', 'Constância Metódica (7 dias)', 'Completou uma semana de rotina estruturada de engenharia.', 'streak', 150, 'Especial', 'Flame', 'streak_days', 7),
  ('ach-streak-14', 'STREAK_14_DAYS', 'Hábito Inquebrável (14 dias)', 'Duas semanas ininterruptas de estudo e resolução de casos técnicos.', 'streak', 300, 'Épica', 'Flame', 'streak_days', 14),
  ('ach-xp-1000', 'XP_MILESTONE_1000', 'Marco de 1.000 XP', 'Acumulou 1.000 pontos de experiência através do ledger auditável.', 'engagement', 100, 'Especial', 'Sparkles', 'xp_threshold', 1000),
  ('ach-autonomous-5', 'AUTONOMOUS_RESOLVER_5', 'Raciocínio Independente', 'Resolveu 5 exercícios sem revelar fórmulas ou solicitar dicas.', 'autonomy', 200, 'Épica', 'Crosshair', 'autonomous_streak', 5),
  ('ach-spaced-reviews-3', 'SPACED_REVIEWS_3', 'Memória Consolidada', 'Completou 3 ciclos de revisão espaçada de acordo com o agendamento.', 'technical_mastery', 150, 'Especial', 'RotateCcw', 'reviews_completed', 3),
  ('ach-competency-mastery', 'COMPETENCY_MASTERY_80', 'Domínio de Competência', 'Atingiu 80% ou mais de domínio em uma competência técnica fundamental.', 'technical_mastery', 250, 'Lendária', 'Award', 'competency_mastered', 80)
ON CONFLICT (id) DO NOTHING;

-- 3. Mensagens Pedagógicas Contextuais (Tom: humanizado, técnico, sóbrio; SEM CULPABILIZAR)
INSERT INTO public.pedagogical_messages_config (id, trigger_event, title, message_text, tone, priority, max_impressions_per_user)
VALUES
  ('msg-first-access', 'first_access', 'Bem-vindo à Engenharia Divergente', 'Aqui você não apenas assiste a aulas: você modela, calcula e compreende o comportamento estrutural antes de confiar em qualquer software.', 'supportive_technical', 1, 1),
  ('msg-first-mission', 'first_mission', 'Primeira Missão Superada!', 'Você está desenvolvendo uma habilidade importante: compreender o comportamento estrutural antes de confiar nos resultados.', 'supportive_technical', 1, 2),
  ('msg-daily-goal', 'goal_reached', 'Meta Diária Concluída com Foco', 'Dedicação precisa vale mais do que horas sem absorção. Seu tempo ativo de estudo hoje consolidou bases sólidas.', 'supportive_technical', 2, 100),
  ('msg-streak-milestone', 'streak_milestone', 'Consistência Demonstrada', 'A consistência diária constrói o instinto técnico que separa o engenheiro operacional do engenheiro divergente.', 'supportive_technical', 2, 50),
  ('msg-performance-improved', 'performance_improved', 'Evolução Perceptível', 'Seu desempenho melhorou nas revisões. Continue consolidando essa competência.', 'supportive_technical', 2, 30),
  ('msg-unit-completed', 'unit_completed', 'Módulo Concluído', 'Uma boa análise começa com boas hipóteses. Excelente trabalho concluindo este módulo; vamos ao próximo desafio.', 'supportive_technical', 1, 20),
  ('msg-level-up', 'level_up', 'Novo Nível de Engenharia Desbloqueado', 'Seu repertório analítico está expandindo. Novas responsabilidades e ferramentas foram liberadas no seu ambiente.', 'supportive_technical', 1, 10),
  ('msg-return-after-inactivity', 'return_after_inactivity', 'Que bom ter você de volta', 'O conhecimento em engenharia se constrói em ciclos. Onde paramos é exatamente o ponto ideal para retomar hoje.', 'supportive_technical', 1, 10),
  ('msg-review-completed', 'review_completed', 'Retenção Espaçada Ativa', 'A revisão no momento certo combate a curva do esquecimento e fixa o rigor conceitual na prática.', 'supportive_technical', 2, 50)
ON CONFLICT (id) DO NOTHING;

-- 4. Vídeos do Fábio Goedel Vinculados a Marcos Pedagógicos
INSERT INTO public.pedagogical_mentor_videos (
  id, trigger_event, title, description, support_message, provider, video_url_or_id, thumbnail_url, duration_seconds, priority, is_mandatory, button_label
)
VALUES
  (
    'vid-mentor-welcome',
    'first_access',
    'Como Pensar como um Engenheiro Divergente',
    'Mensagem de boas-vindas do Prof. Fábio Goedel explicando por que não aceitamos resultados cegos de software.',
    'Bem-vindo à Academy! O objetivo aqui não é decorar comandos de botões, mas dominar a física e o critério de projeto.',
    'youtube',
    'dQw4w9WgXcQ',
    'https://img.usecurling.com/p/640/360?q=engineering%20mentor%20welcome',
    210,
    1,
    false,
    'Entrar na Plataforma'
  ),
  (
    'vid-mentor-beam-bending',
    'unit_completed',
    'O Perigo da Tensão Equivalente de von Mises sem Critério',
    'Fábio Goedel comenta armadilhas comuns em modelos 3D ao desconsiderar a teoria clássica de Euler-Bernoulli.',
    'Parabéns por concluir a unidade de flexão! Entender onde a linha neutra se localiza protege você de erros catastróficos em simulações computacionais.',
    'youtube',
    'M7lc1UVf-VE',
    'https://img.usecurling.com/p/640/360?q=finite%20element%20mentor%20advice',
    340,
    1,
    false,
    'Continuar para a Próxima Missão'
  ),
  (
    'vid-mentor-level4',
    'level_up',
    'Transição para Análise Estrutural Crítica',
    'Orientações pedagógicas para quem atingiu o Nível 4: Analista Estrutural Jr.',
    'Você chegou a um patamar onde os problemas deixam de ter resposta única evidente. Pratique hipóteses antes de rodar o solucionador.',
    'youtube',
    'jNQXAC9IVRw',
    'https://img.usecurling.com/p/640/360?q=structural%20engineer%20analysis',
    185,
    2,
    false,
    'Acessar Desafios do Nível'
  ),
  (
    'vid-mentor-welcome-back',
    'return_after_inactivity',
    'Retomando o Ritmo com Foco Técnico',
    'Mensagem de acolhimento do Fábio Goedel sobre como retomar a constância sem cobranças desnecessárias.',
    'Bem-vindo de volta! Um passo de cada vez: 15 minutos focados hoje já reativam seus circuitos conceituais.',
    'youtube',
    'L_LUpnjgPso',
    'https://img.usecurling.com/p/640/360?q=engineering%20welcome%20back',
    160,
    3,
    false,
    'Continuar de Onde Parei'
  )
ON CONFLICT (id) DO NOTHING;
