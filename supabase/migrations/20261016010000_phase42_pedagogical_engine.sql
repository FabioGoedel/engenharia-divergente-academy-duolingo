-- ==============================================================================
-- Engenharia Divergente Academy — Migration Subfase 4.2
-- Motor Pedagógico Persistente, Correção Segura, Gamificação e Ledger Transacional
-- ==============================================================================

-- 1. ENUMS ADICIONAIS DE CICLO PEDAGÓGICO
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attempt_status') THEN
    CREATE TYPE attempt_status AS ENUM ('in_progress', 'completed', 'abandoned');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_interval_state') THEN
    CREATE TYPE review_interval_state AS ENUM ('step_1_day', 'step_3_days', 'step_7_days', 'step_14_days', 'mastered');
  END IF;
END $$;

-- 2. TENTATIVAS DE ATIVIDADE (activity_attempts)
CREATE TABLE IF NOT EXISTS public.activity_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  activity_version INTEGER NOT NULL DEFAULT 1,
  status attempt_status NOT NULL DEFAULT 'in_progress',
  current_exercise_index INTEGER NOT NULL DEFAULT 0,
  active_time_seconds INTEGER NOT NULL DEFAULT 0,
  hints_used_total INTEGER NOT NULL DEFAULT 0,
  total_xp_awarded INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_activity_attempts_user_mission 
  ON public.activity_attempts(user_id, mission_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_started_at 
  ON public.activity_attempts(started_at DESC);

-- 3. RESPOSTAS DAS TENTATIVAS (attempt_answers)
CREATE TABLE IF NOT EXISTS public.attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.activity_attempts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  exercise_version INTEGER NOT NULL DEFAULT 1,
  question_id UUID REFERENCES public.question_bank(id) ON DELETE SET NULL,
  student_answer JSONB NOT NULL,
  is_correct BOOLEAN NOT NULL,
  score_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  hints_used_count INTEGER NOT NULL DEFAULT 0,
  perceived_difficulty INTEGER CHECK (perceived_difficulty BETWEEN 1 AND 5),
  guessed BOOLEAN NOT NULL DEFAULT FALSE,
  active_seconds INTEGER NOT NULL DEFAULT 0,
  formula_was_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  assistance_degree TEXT NOT NULL DEFAULT 'none',
  competency_code TEXT,
  grade_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_attempt_exercise UNIQUE (attempt_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_attempt_answers_user_comp 
  ON public.attempt_answers(user_id, competency_code);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt 
  ON public.attempt_answers(attempt_id);

-- 4. EVENTOS DE TELEMETRIA DA TENTATIVA (attempt_events)
CREATE TABLE IF NOT EXISTS public.attempt_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.activity_attempts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  exercise_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attempt_events_attempt 
  ON public.attempt_events(attempt_id, created_at ASC);

-- 5. LEDGER IMUTÁVEL DE XP (xp_ledger)
CREATE TABLE IF NOT EXISTS public.xp_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_attempt_id UUID REFERENCES public.activity_attempts(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  xp_amount INTEGER NOT NULL CHECK (xp_amount >= 0),
  policy_code TEXT NOT NULL DEFAULT 'exercise_completion',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_attempt_reason UNIQUE (source_attempt_id, reason)
);

CREATE INDEX IF NOT EXISTS idx_xp_ledger_user ON public.xp_ledger(user_id, created_at DESC);

-- 6. PROGRESSO CONSOLIDADO POR ATIVIDADE/MISSÃO (student_activity_progress)
CREATE TABLE IF NOT EXISTS public.student_activity_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  last_attempt_id UUID REFERENCES public.activity_attempts(id) ON DELETE SET NULL,
  total_attempts_count INTEGER NOT NULL DEFAULT 1,
  completed_attempts_count INTEGER NOT NULL DEFAULT 0,
  best_score_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_xp_earned INTEGER NOT NULL DEFAULT 0,
  total_active_seconds INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  first_completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_student_activity UNIQUE (user_id, mission_id)
);

CREATE INDEX IF NOT EXISTS idx_student_activity_user ON public.student_activity_progress(user_id);

-- 7. PROGRESSO POR COMPETÊNCIA TÉCNICA (student_competency_progress)
CREATE TABLE IF NOT EXISTS public.student_competency_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  competency_code TEXT NOT NULL,
  total_questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_questions_count INTEGER NOT NULL DEFAULT 0,
  autonomous_correct_count INTEGER NOT NULL DEFAULT 0,
  guessed_count INTEGER NOT NULL DEFAULT 0,
  hints_used_total INTEGER NOT NULL DEFAULT 0,
  mastery_score_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_student_competency UNIQUE (user_id, competency_code)
);

CREATE INDEX IF NOT EXISTS idx_student_competency_user ON public.student_competency_progress(user_id);

-- 8. AGENDAMENTO DE REVISÃO ESPAÇADA (review_schedule)
CREATE TABLE IF NOT EXISTS public.review_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  competency_code TEXT,
  state review_interval_state NOT NULL DEFAULT 'step_1_day',
  interval_days INTEGER NOT NULL DEFAULT 1,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day'),
  reviewed_at TIMESTAMPTZ,
  is_pending BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_exercise_review UNIQUE (user_id, mission_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_review_schedule_pending 
  ON public.review_schedule(user_id, is_pending, scheduled_for ASC);

-- 9. FEEDBACK DE DIFICULDADE PERCEBIDA (activity_difficulty_feedback)
CREATE TABLE IF NOT EXISTS public.activity_difficulty_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.activity_attempts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  perceived_difficulty INTEGER NOT NULL CHECK (perceived_difficulty BETWEEN 1 AND 5),
  guessed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_attempt_difficulty UNIQUE (attempt_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_difficulty_feedback_ex 
  ON public.activity_difficulty_feedback(exercise_id, perceived_difficulty);

-- 10. POLÍTICAS RLS
ALTER TABLE public.activity_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_competency_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_difficulty_feedback ENABLE ROW LEVEL SECURITY;

-- activity_attempts
DROP POLICY IF EXISTS "attempts_student_select" ON public.activity_attempts;
CREATE POLICY "attempts_student_select" ON public.activity_attempts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "attempts_student_insert" ON public.activity_attempts;
CREATE POLICY "attempts_student_insert" ON public.activity_attempts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "attempts_student_update" ON public.activity_attempts;
CREATE POLICY "attempts_student_update" ON public.activity_attempts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- attempt_answers (apenas leitura do aluno)
DROP POLICY IF EXISTS "attempt_answers_student_select" ON public.attempt_answers;
CREATE POLICY "attempt_answers_student_select" ON public.attempt_answers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- attempt_events (aluno insere eventos da sua própria sessão)
DROP POLICY IF EXISTS "attempt_events_student_select" ON public.attempt_events;
CREATE POLICY "attempt_events_student_select" ON public.attempt_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "attempt_events_student_insert" ON public.attempt_events;
CREATE POLICY "attempt_events_student_insert" ON public.attempt_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- xp_ledger (IMUTÁVEL: Aluno NUNCA insere ou altera diretamente)
DROP POLICY IF EXISTS "xp_ledger_student_select" ON public.xp_ledger;
CREATE POLICY "xp_ledger_student_select" ON public.xp_ledger
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- student_activity_progress (apenas leitura pelo aluno)
DROP POLICY IF EXISTS "student_activity_progress_select" ON public.student_activity_progress;
CREATE POLICY "student_activity_progress_select" ON public.student_activity_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- student_competency_progress (apenas leitura pelo aluno)
DROP POLICY IF EXISTS "student_competency_progress_select" ON public.student_competency_progress;
CREATE POLICY "student_competency_progress_select" ON public.student_competency_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- review_schedule (aluno pode ver suas revisões e marcar como revisado)
DROP POLICY IF EXISTS "review_schedule_select" ON public.review_schedule;
CREATE POLICY "review_schedule_select" ON public.review_schedule
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "review_schedule_update" ON public.review_schedule;
CREATE POLICY "review_schedule_update" ON public.review_schedule
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- activity_difficulty_feedback
DROP POLICY IF EXISTS "difficulty_feedback_select" ON public.activity_difficulty_feedback;
CREATE POLICY "difficulty_feedback_select" ON public.activity_difficulty_feedback
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "difficulty_feedback_insert" ON public.activity_difficulty_feedback;
CREATE POLICY "difficulty_feedback_insert" ON public.activity_difficulty_feedback
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 11. FUNÇÃO TRANSACIONAL ATÔMICA DE ATRIBUIÇÃO DE XP E PROGRESSO (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.record_exercise_evaluation(
  p_attempt_id UUID,
  p_exercise_id TEXT,
  p_exercise_version INTEGER,
  p_student_answer JSONB,
  p_is_correct BOOLEAN,
  p_score_percent NUMERIC,
  p_hints_used_count INTEGER,
  p_perceived_difficulty INTEGER,
  p_guessed BOOLEAN,
  p_active_seconds INTEGER,
  p_formula_was_hidden BOOLEAN,
  p_assistance_degree TEXT,
  p_competency_code TEXT,
  p_grade_result JSONB,
  p_xp_to_award INTEGER,
  p_xp_reason TEXT,
  p_is_mission_completed BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_mission_id TEXT;
  v_xp_awarded_now INTEGER := 0;
  v_existing_xp INTEGER;
  v_new_total_xp INTEGER;
  v_res JSONB;
BEGIN
  -- 1. Verifica tentativa existente
  SELECT user_id, mission_id INTO v_user_id, v_mission_id
  FROM public.activity_attempts
  WHERE id = p_attempt_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Tentativa % não encontrada.', p_attempt_id;
  END IF;

  -- Garante que apenas o próprio aluno ou admin execute a gravação
  IF auth.uid() IS NOT NULL AND auth.uid() <> v_user_id AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Operação não autorizada para este usuário.';
  END IF;

  -- 2. Upsert idempotente na tabela attempt_answers
  INSERT INTO public.attempt_answers (
    attempt_id,
    user_id,
    exercise_id,
    exercise_version,
    student_answer,
    is_correct,
    score_percent,
    hints_used_count,
    perceived_difficulty,
    guessed,
    active_seconds,
    formula_was_hidden,
    assistance_degree,
    competency_code,
    grade_result,
    answered_at
  ) VALUES (
    p_attempt_id,
    v_user_id,
    p_exercise_id,
    p_exercise_version,
    p_student_answer,
    p_is_correct,
    p_score_percent,
    p_hints_used_count,
    p_perceived_difficulty,
    p_guessed,
    p_active_seconds,
    p_formula_was_hidden,
    p_assistance_degree,
    p_competency_code,
    p_grade_result,
    NOW()
  )
  ON CONFLICT (attempt_id, exercise_id) DO UPDATE SET
    student_answer = EXCLUDED.student_answer,
    is_correct = EXCLUDED.is_correct,
    score_percent = EXCLUDED.score_percent,
    hints_used_count = EXCLUDED.hints_used_count,
    perceived_difficulty = COALESCE(EXCLUDED.perceived_difficulty, attempt_answers.perceived_difficulty),
    guessed = EXCLUDED.guessed,
    active_seconds = attempt_answers.active_seconds + EXCLUDED.active_seconds,
    formula_was_hidden = EXCLUDED.formula_was_hidden,
    assistance_degree = EXCLUDED.assistance_degree,
    grade_result = EXCLUDED.grade_result,
    answered_at = NOW();

  -- 3. Idempotência estrita no ledger de XP: se já foi concedido para (p_attempt_id, p_xp_reason), NÃO duplica
  IF p_is_correct AND p_xp_to_award > 0 AND p_xp_reason IS NOT NULL THEN
    SELECT xp_amount INTO v_existing_xp
    FROM public.xp_ledger
    WHERE source_attempt_id = p_attempt_id AND reason = p_xp_reason;

    IF v_existing_xp IS NULL THEN
      INSERT INTO public.xp_ledger (
        user_id,
        source_attempt_id,
        reason,
        xp_amount,
        policy_code,
        metadata
      ) VALUES (
        v_user_id,
        p_attempt_id,
        p_xp_reason,
        p_xp_to_award,
        'exercise_completion',
        jsonb_build_object('exercise_id', p_exercise_id, 'hints_used', p_hints_used_count)
      )
      ON CONFLICT (source_attempt_id, reason) DO NOTHING;

      IF FOUND THEN
        v_xp_awarded_now := p_xp_to_award;

        -- Atualiza perfil do usuário
        UPDATE public.profiles
        SET total_xp = total_xp + v_xp_awarded_now,
            updated_at = NOW()
        WHERE id = v_user_id;

        -- Atualiza total da tentativa
        UPDATE public.activity_attempts
        SET total_xp_awarded = total_xp_awarded + v_xp_awarded_now
        WHERE id = p_attempt_id;
      END IF;
    END IF;
  END IF;

  -- 4. Atualiza tempo ativo e status da tentativa
  UPDATE public.activity_attempts
  SET active_time_seconds = active_time_seconds + GREATEST(p_active_seconds, 0),
      hints_used_total = hints_used_total + GREATEST(p_hints_used_count, 0),
      status = CASE WHEN p_is_mission_completed THEN 'completed'::attempt_status ELSE status END,
      completed_at = CASE WHEN p_is_mission_completed THEN NOW() ELSE completed_at END
  WHERE id = p_attempt_id;

  -- 5. Atualiza feedback de dificuldade se fornecido
  IF p_perceived_difficulty IS NOT NULL THEN
    INSERT INTO public.activity_difficulty_feedback (
      attempt_id,
      user_id,
      exercise_id,
      perceived_difficulty,
      guessed
    ) VALUES (
      p_attempt_id,
      v_user_id,
      p_exercise_id,
      p_perceived_difficulty,
      p_guessed
    )
    ON CONFLICT (attempt_id, exercise_id) DO UPDATE SET
      perceived_difficulty = EXCLUDED.perceived_difficulty,
      guessed = EXCLUDED.guessed;
  END IF;

  -- 6. Atualiza progresso acumulado da atividade (student_activity_progress)
  INSERT INTO public.student_activity_progress (
    user_id,
    mission_id,
    last_attempt_id,
    total_attempts_count,
    completed_attempts_count,
    best_score_percent,
    total_xp_earned,
    total_active_seconds,
    is_completed,
    first_completed_at,
    last_activity_at
  ) VALUES (
    v_user_id,
    v_mission_id,
    p_attempt_id,
    1,
    CASE WHEN p_is_mission_completed THEN 1 ELSE 0 END,
    p_score_percent,
    v_xp_awarded_now,
    GREATEST(p_active_seconds, 0),
    p_is_mission_completed,
    CASE WHEN p_is_mission_completed THEN NOW() ELSE NULL END,
    NOW()
  )
  ON CONFLICT (user_id, mission_id) DO UPDATE SET
    last_attempt_id = EXCLUDED.last_attempt_id,
    completed_attempts_count = student_activity_progress.completed_attempts_count + (CASE WHEN p_is_mission_completed AND NOT student_activity_progress.is_completed THEN 1 ELSE 0 END),
    best_score_percent = GREATEST(student_activity_progress.best_score_percent, EXCLUDED.best_score_percent),
    total_xp_earned = student_activity_progress.total_xp_earned + v_xp_awarded_now,
    total_active_seconds = student_activity_progress.total_active_seconds + GREATEST(p_active_seconds, 0),
    is_completed = student_activity_progress.is_completed OR p_is_mission_completed,
    first_completed_at = COALESCE(student_activity_progress.first_completed_at, (CASE WHEN p_is_mission_completed THEN NOW() ELSE NULL END)),
    last_activity_at = NOW();

  -- 7. Atualiza progresso por competência técnica (student_competency_progress)
  IF p_competency_code IS NOT NULL AND p_competency_code <> '' THEN
    INSERT INTO public.student_competency_progress (
      user_id,
      competency_code,
      total_questions_answered,
      correct_questions_count,
      autonomous_correct_count,
      guessed_count,
      hints_used_total,
      mastery_score_percent,
      last_assessed_at
    ) VALUES (
      v_user_id,
      p_competency_code,
      1,
      CASE WHEN p_is_correct THEN 1 ELSE 0 END,
      CASE WHEN p_is_correct AND p_hints_used_count = 0 AND NOT p_formula_was_hidden THEN 1 ELSE 0 END,
      CASE WHEN p_guessed THEN 1 ELSE 0 END,
      p_hints_used_count,
      CASE WHEN p_is_correct THEN 100 ELSE 0 END,
      NOW()
    )
    ON CONFLICT (user_id, competency_code) DO UPDATE SET
      total_questions_answered = student_competency_progress.total_questions_answered + 1,
      correct_questions_count = student_competency_progress.correct_questions_count + (CASE WHEN p_is_correct THEN 1 ELSE 0 END),
      autonomous_correct_count = student_competency_progress.autonomous_correct_count + (CASE WHEN p_is_correct AND p_hints_used_count = 0 AND NOT p_formula_was_hidden THEN 1 ELSE 0 END),
      guessed_count = student_competency_progress.guessed_count + (CASE WHEN p_guessed THEN 1 ELSE 0 END),
      hints_used_total = student_competency_progress.hints_used_total + p_hints_used_count,
      mastery_score_percent = ROUND(
        ((student_competency_progress.correct_questions_count + (CASE WHEN p_is_correct THEN 1 ELSE 0 END))::numeric /
        (student_competency_progress.total_questions_answered + 1)::numeric) * 100, 2
      ),
      last_assessed_at = NOW();
  END IF;

  -- 8. Agendamento de repetição espaçada
  IF p_is_correct THEN
    INSERT INTO public.review_schedule (
      user_id,
      mission_id,
      exercise_id,
      competency_code,
      state,
      interval_days,
      scheduled_for,
      is_pending
    ) VALUES (
      v_user_id,
      v_mission_id,
      p_exercise_id,
      p_competency_code,
      'step_1_day',
      1,
      NOW() + INTERVAL '1 day',
      TRUE
    )
    ON CONFLICT (user_id, mission_id, exercise_id) DO UPDATE SET
      state = CASE 
        WHEN review_schedule.state = 'step_1_day' THEN 'step_3_days'::review_interval_state
        WHEN review_schedule.state = 'step_3_days' THEN 'step_7_days'::review_interval_state
        WHEN review_schedule.state = 'step_7_days' THEN 'step_14_days'::review_interval_state
        ELSE 'mastered'::review_interval_state
      END,
      interval_days = CASE 
        WHEN review_schedule.state = 'step_1_day' THEN 3
        WHEN review_schedule.state = 'step_3_days' THEN 7
        WHEN review_schedule.state = 'step_7_days' THEN 14
        ELSE 30
      END,
      scheduled_for = NOW() + (
        CASE 
          WHEN review_schedule.state = 'step_1_day' THEN INTERVAL '3 days'
          WHEN review_schedule.state = 'step_3_days' THEN INTERVAL '7 days'
          WHEN review_schedule.state = 'step_7_days' THEN INTERVAL '14 days'
          ELSE INTERVAL '30 days'
        END
      ),
      is_pending = TRUE;
  END IF;

  SELECT total_xp INTO v_new_total_xp FROM public.profiles WHERE id = v_user_id;

  v_res := jsonb_build_object(
    'success', true,
    'attempt_id', p_attempt_id,
    'user_id', v_user_id,
    'exercise_id', p_exercise_id,
    'is_correct', p_is_correct,
    'xp_awarded_in_action', v_xp_awarded_now,
    'user_total_xp', v_new_total_xp,
    'is_mission_completed', p_is_mission_completed
  );

  RETURN v_res;
END;
$$;

-- 12. VIEW PÚBLICA SEGURA DO BANCO DE QUESTÕES (NUNCA EXPÕE GABARITO OU CHAVES PRIVADAS)
DROP VIEW IF EXISTS public.view_student_question_bank;
CREATE OR REPLACE VIEW public.view_student_question_bank AS
SELECT
  id,
  external_id,
  title,
  question_type,
  subject_area,
  competency_code,
  prompt_markdown,
  options,
  hint,
  numeric_unit,
  estimated_seconds,
  xp_reward,
  tags,
  version
FROM public.question_bank
WHERE editorial_status = 'published';

GRANT SELECT ON public.view_student_question_bank TO authenticated;

-- 13. SEED DOS EXERCÍCIOS CANÔNICOS DA MISSÃO MDZAM (Flexão de Vigas) NO QUESTION_BANK
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM public.profiles WHERE email = 'fgoedel@gmail.com' LIMIT 1;
  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM public.profiles LIMIT 1;
  END IF;

  -- 1. ex-bb-01: Questão teórica de Euler-Bernoulli
  INSERT INTO public.question_bank (
    external_id,
    title,
    question_type,
    subject_area,
    competency_code,
    authoring_level,
    prompt_markdown,
    options,
    private_key_json,
    hint,
    explanation_markdown,
    estimated_seconds,
    xp_reward,
    tags,
    editorial_status,
    version,
    created_by
  ) VALUES (
    'RESMAT-FLEX-01-CONC',
    '1. Hipótese de Navier e Distribuição de Tensões na Seção',
    'single_choice',
    'Resistência dos Materiais',
    'COMP-RESMAT-NAVIER',
    2,
    'Considere uma viga prismática de material elástico linear, homogêneo e isotrópico submetida a um momento fletor positivo Mz em torno do eixo neutro principal de inércia (hipótese de Euler-Bernoulli).

Pela clássica Fórmula da Flexão de Navier: \sigma_x = -(Mz * y) / Iz.

Qual das afirmações expressa com rigor físico o comportamento das tensões normais e a posição da Linha Neutra (LN) na flexão pura simples?',
    '[
      {"id":"opt-1-a","label":"A","textMarkdown":"A tensão normal varia linearmente com a distância vertical y ao centro de gravidade da seção transversal. Na Linha Neutra (y = 0), a deformação e a tensão normal são estritamente nulas."},
      {"id":"opt-1-b","label":"B","textMarkdown":"A tensão normal máxima ocorre no centroide da seção, onde a taxa de variação do momento fletor com relação ao comprimento é máxima."},
      {"id":"opt-1-c","label":"C","textMarkdown":"A Linha Neutra sempre coincide com a base inferior da viga quando a seção transversal não é simétrica."},
      {"id":"opt-1-d","label":"D","textMarkdown":"As fibras acima da Linha Neutra ficam sempre tracionadas sob momento fletor positivo convencional."}
    ]'::jsonb,
    '{
      "correctOptionIds": ["opt-1-a"],
      "explanationMarkdown": "**Resolução Comentada:** Pela hipótese cinemática de Bernoulli-Navier para vigas delgadas, a distribuição de deformações e tensões elásticas é linear anulando-se no centro geométrico de gravidade (CG).",
      "distractorRationales": {
        "opt-1-a": "CORRETA: A distribuição de deformações e tensões elásticas é estritamente linear em função de y, anulando-se na Linha Neutra centroidal.",
        "opt-1-b": "INCORRETA: No centroide a tensão normal é zero. O que é máximo no centroide é a tensão de cisalhamento tau.",
        "opt-1-c": "INCORRETA: A Linha Neutra passa sempre pelo CG da seção, jamais pela borda inferior.",
        "opt-1-d": "INCORRETA: Sob momento positivo, as fibras superiores sofrem compressão."
      }
    }'::jsonb,
    'Lembre-se da hipótese cinemática de seções planas.',
    'Resolução Comentada de Euler-Bernoulli',
    180,
    25,
    ARRAY['resmat', 'flexao', 'navier'],
    'published',
    1,
    v_admin_id
  )
  ON CONFLICT (external_id) DO UPDATE SET
    options = EXCLUDED.options,
    private_key_json = EXCLUDED.private_key_json,
    editorial_status = 'published';

  -- 2. ex-bb-02: Numérica de dimensionamento elástico W
  INSERT INTO public.question_bank (
    external_id,
    title,
    question_type,
    subject_area,
    competency_code,
    authoring_level,
    prompt_markdown,
    options,
    private_key_json,
    hint,
    explanation_markdown,
    numeric_unit,
    numeric_tolerance_abs,
    numeric_tolerance_rel,
    estimated_seconds,
    xp_reward,
    tags,
    editorial_status,
    version,
    created_by
  ) VALUES (
    'RESMAT-FLEX-02-NUM',
    '2. Dimensionamento Elástico e Módulo Resistente (W)',
    'numeric_response',
    'Resistência dos Materiais',
    'COMP-RESMAT-SECTION-MOD',
    2,
    'Uma viga de ponte rolante de seção retangular de madeira laminada com largura b = 120 mm e altura h = 300 mm está submetida a um momento fletor solicitante máximo de projeto Msd = 45 kN.m. Calcule a tensão normal máxima atuante em Megapascais (MPa).',
    '[]'::jsonb,
    '{
      "numericExpectedValue": 25.0,
      "numericToleranceAbs": 0.5,
      "numericToleranceRel": 2.0,
      "numericUnit": "MPa",
      "explanationMarkdown": "**Passo a passo do cálculo:** W = (120 * 300^2)/6 = 1.800.000 mm^3. M = 45 * 10^6 N.mm. sigma = 45*10^6 / 1.8*10^6 = 25.0 MPa.",
      "rubricNotes": "Resultado esperado: 25,0 MPa. Tolerância absoluta aceita: ±0,5 MPa."
    }'::jsonb,
    'Atenção às unidades: 1 kN.m = 10^6 N.mm.',
    'Cálculo passo a passo de Wz e tensão normal.',
    'MPa',
    0.5,
    2.0,
    240,
    30,
    ARRAY['resmat', 'numerico', 'tensao'],
    'published',
    1,
    v_admin_id
  )
  ON CONFLICT (external_id) DO UPDATE SET
    private_key_json = EXCLUDED.private_key_json,
    numeric_unit = EXCLUDED.numeric_unit,
    numeric_tolerance_abs = EXCLUDED.numeric_tolerance_abs,
    editorial_status = 'published';

  -- 3. ex-bb-03: Flecha máxima
  INSERT INTO public.question_bank (
    external_id,
    title,
    question_type,
    subject_area,
    competency_code,
    authoring_level,
    prompt_markdown,
    options,
    private_key_json,
    hint,
    explanation_markdown,
    numeric_unit,
    numeric_tolerance_abs,
    numeric_tolerance_rel,
    estimated_seconds,
    xp_reward,
    tags,
    editorial_status,
    version,
    created_by
  ) VALUES (
    'RESMAT-FLEX-03-DEF',
    '3. Flecha Máxima em Viga Biapoiada sob Carga Uniforme',
    'numeric_response',
    'Resistência dos Materiais',
    'COMP-RESMAT-DEFLECTION',
    3,
    'Uma viga de piso simplesmente apoiada de aço estrutural ASTM A36 possui vão teórico L = 6 m e q = 12 kN/m. E = 200.000 MPa, Iz = 5.400 cm^4. Calcule a flecha máxima em milímetros (mm).',
    '[]'::jsonb,
    '{
      "numericExpectedValue": 18.75,
      "numericToleranceAbs": 0.4,
      "numericToleranceRel": 2.0,
      "numericUnit": "mm",
      "explanationMarkdown": "delta_max = (5 * q * L^4) / (384 * E * Iz) = 18,75 mm.",
      "rubricNotes": "Resultado esperado: 18,75 mm. Tolerância aceita: ±0,4 mm."
    }'::jsonb,
    'Fórmula da flecha: delta = (5 * q * L^4)/(384 * E * I).',
    'Memorial de cálculo de flecha biapoiada.',
    'mm',
    0.4,
    2.0,
    300,
    35,
    ARRAY['resmat', 'flecha', 'els'],
    'published',
    1,
    v_admin_id
  )
  ON CONFLICT (external_id) DO UPDATE SET
    private_key_json = EXCLUDED.private_key_json,
    numeric_unit = EXCLUDED.numeric_unit,
    numeric_tolerance_abs = EXCLUDED.numeric_tolerance_abs,
    editorial_status = 'published';

  -- 4. ex-bb-04: Diagrama momento e balanço
  INSERT INTO public.question_bank (
    external_id,
    title,
    question_type,
    subject_area,
    competency_code,
    authoring_level,
    prompt_markdown,
    options,
    private_key_json,
    hint,
    explanation_markdown,
    estimated_seconds,
    xp_reward,
    tags,
    editorial_status,
    version,
    created_by
  ) VALUES (
    'RESMAT-FLEX-04-VIS',
    '4. Interpretação Estrutural de Viga com Carga Concentrada e Balanço',
    'single_choice',
    'Resistência dos Materiais',
    'COMP-RESMAT-DIAGRAMS',
    2,
    'Qual é o valor e a natureza do Momento Fletor atuante imediatamente sobre o apoio B (x = 8 m) com balanço de 2 m sob carga P = 20 kN?',
    '[
      {"id":"opt-4-a","label":"A","textMarkdown":"Momento fletor negativo MB = -40 kN.m, com tração na fibra SUPERIOR e compressão na fibra INFERIOR da viga."},
      {"id":"opt-4-b","label":"B","textMarkdown":"Momento fletor positivo MB = +40 kN.m, com tração na fibra INFERIOR da viga."},
      {"id":"opt-4-c","label":"C","textMarkdown":"Momento fletor nulo (MB = 0)."},
      {"id":"opt-4-d","label":"D","textMarkdown":"Momento fletor negativo MB = -20 kN.m."}
    ]'::jsonb,
    '{
      "correctOptionIds": ["opt-4-a"],
      "explanationMarkdown": "M(B) = -20 kN * 2 m = -40 kN.m, tracionando a fibra superior.",
      "distractorRationales": {
        "opt-4-a": "CORRETA: Balanço de 2 m sob 20 kN gera -40 kN.m.",
        "opt-4-b": "INCORRETA: O momento é negativo.",
        "opt-4-c": "INCORRETA: Apoio não anula o momento em viga contínua.",
        "opt-4-d": "INCORRETA: Erro no braço de alavanca."
      }
    }'::jsonb,
    'Isole a extremidade em balanço de 2 m.',
    'Análise de equilíbrio estático.',
    240,
    35,
    ARRAY['resmat', 'balanco', 'diagramas'],
    'published',
    1,
    v_admin_id
  )
  ON CONFLICT (external_id) DO UPDATE SET
    options = EXCLUDED.options,
    private_key_json = EXCLUDED.private_key_json,
    editorial_status = 'published';

  -- 5. ex-bb-05: Decisão de projeto
  INSERT INTO public.question_bank (
    external_id,
    title,
    question_type,
    subject_area,
    competency_code,
    authoring_level,
    prompt_markdown,
    options,
    private_key_json,
    hint,
    explanation_markdown,
    estimated_seconds,
    xp_reward,
    tags,
    editorial_status,
    version,
    created_by
  ) VALUES (
    'RESMAT-FLEX-05-DEC',
    '5. Julgamento Técnico: Verificação Simultânea de Tensão (ELU) e Flecha (ELS)',
    'single_choice',
    'Resistência dos Materiais',
    'COMP-RESMAT-ENG-DECISION',
    3,
    'Qual é o perfil mais leve e econômico que atende simultaneamente a AMBOS os critérios (ELU e ELS)?',
    '[
      {"id":"opt-5-a","label":"A","textMarkdown":"Perfil B (W 250 x 28,4): Reprovado por tensão."},
      {"id":"opt-5-b","label":"B","textMarkdown":"Perfil B (W 250 x 28,4): Tensão 140 MPa."},
      {"id":"opt-5-c","label":"C","textMarkdown":"Perfil C (W 310 x 32,7): É o único que satisfaz os critérios, pois o Perfil B falha por flecha ou tensão excessiva."},
      {"id":"opt-5-d","label":"D","textMarkdown":"Perfil A (W 200 x 22,5): Mais leve."}
    ]'::jsonb,
    '{
      "correctOptionIds": ["opt-5-c"],
      "explanationMarkdown": "W_min = 425 cm^3, o que reprova A e B. Apenas C atende à tensão com W = 525 cm^3.",
      "distractorRationales": {
        "opt-5-a": "INCORRETA: Perfil B reprova por tensão.",
        "opt-5-b": "INCORRETA: Perfil B tem W = 356 cm³, tensão de 191 MPa.",
        "opt-5-c": "CORRETA: Apenas C atende a ambos.",
        "opt-5-d": "INCORRETA: Perfil A ultrapassa muito a tensão admissível."
      }
    }'::jsonb,
    'Calcule W_min = M / sigma_adm.',
    'Julgamento técnico completo.',
    300,
    45,
    ARRAY['resmat', 'decisao', 'dimensionamento'],
    'published',
    1,
    v_admin_id
  )
  ON CONFLICT (external_id) DO UPDATE SET
    options = EXCLUDED.options,
    private_key_json = EXCLUDED.private_key_json,
    editorial_status = 'published';

END $$;
