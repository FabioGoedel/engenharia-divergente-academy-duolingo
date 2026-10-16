/**
 * Engenharia Divergente Academy — AdaptiveProgressionService (B1 & B2)
 *
 * Motor adaptativo DETERMINÍSTICO inicial, documentado e auditável.
 * Entradas:
 * - Histórico real de acertos/erros
 * - Dificuldade objetiva da questão
 * - Dificuldade subjetiva percebida (1-5)
 * - Dicas utilizadas e fórmulas disponibilizadas
 * - Incerteza declarada
 * - Retenção e tentativas prévias
 *
 * 5 Estágios de Assistência Progressiva:
 * Stage 1: Revisão com informações detalhadas
 * Stage 2: Resolução assistida com fórmulas visíveis
 * Stage 3: Recuperação de fórmulas com dicas opcionais
 * Stage 4: Aplicação independente sem fórmulas
 * Stage 5: Transferência para situações práticas e decisões de engenharia
 */

import { supabase } from '@/lib/supabase/client'

export type AssistanceStageLevel =
  | 'stage_1_detailed_review'
  | 'stage_2_assisted_with_formulas'
  | 'stage_3_retrieval_with_hints'
  | 'stage_4_independent_application'
  | 'stage_5_transfer_engineering'

export interface AdaptivePolicy {
  id: string
  version: number
  title: string
  description?: string
  isActive: boolean
  minAccuracyToAdvance: number
  maxErrorRateToReview: number
  perceivedDifficultyWeight: number
  hintsUsedPenaltyWeight: number
  objectiveAccuracyWeight: number
  uncertaintyFrequencyWeight: number
  minAttemptsBeforeDecision: number
  allowStudentOverrideChallenge: boolean
  configJson: Record<string, unknown>
}

export interface DiagnosticAssessmentConfig {
  id: string
  trackId: string
  title: string
  description?: string
  isActive: boolean
  durationMinutes: number
  maxRetakesPerStudent: number
  retakeCooldownDays: number
  competenciesCovered: string[]
  questionIds: string[]
  startingPointRules: Array<{
    competency: string
    threshold_high?: number
    threshold_low?: number
    start_node: string
  }>
}

export interface StudentDiagnosticResult {
  id?: string
  userId: string
  assessmentId: string
  trackId: string
  status: 'in_progress' | 'completed' | 'abandoned'
  competencyScores: Record<string, number>
  recommendedStartingNodes: Array<{
    competency: string
    recommendedNodeId: string
    masteryScore: number
    level: 'basico' | 'intermediario' | 'avancado'
  }>
  totalQuestions: number
  correctQuestions: number
  scorePercent: number
  activeSeconds: number
  completedAt?: string
}

export interface AdaptiveRecommendation {
  action:
    | 'review_prerequisites'
    | 'equivalent_exercise'
    | 'advance_difficulty'
    | 'integrative_mission'
  title: string
  explanation: string
  recommendedStage: AssistanceStageLevel
  recommendedNodeOrExerciseId?: string
  competencyCode?: string
  metricsConsidered: {
    accuracyRate: number
    avgPerceivedDifficulty: number
    hintsUsedCount: number
    uncertaintyCount: number
    attemptsCount: number
    compositeProficiencyScore: number
  }
}

export interface QuestionCalibrationData {
  questionId: string
  competencyCode?: string
  totalAnswersCount: number
  correctAnswersCount: number
  accuracyRate: number
  avgPerceivedDifficulty: number
  uncertaintyCount: number
  totalHintsUsed: number
  avgActiveSeconds: number
  currentCalibratedStage: AssistanceStageLevel
  isFlaggedForEditorialReview: boolean
  editorialNotes?: string
}

export const STAGE_DESCRIPTIONS: Record<
  AssistanceStageLevel,
  { number: number; label: string; desc: string }
> = {
  stage_1_detailed_review: {
    number: 1,
    label: 'Estágio 1: Revisão Teórica Detalhada',
    desc: 'Passo a passo expositivo, deduções completas e embasamento conceitual prévio.',
  },
  stage_2_assisted_with_formulas: {
    number: 2,
    label: 'Estágio 2: Resolução Assistida com Fórmulas',
    desc: 'Formulação matemática e equações de dimensionamento visíveis no cabeçalho.',
  },
  stage_3_retrieval_with_hints: {
    number: 3,
    label: 'Estágio 3: Recuperação Ativa com Dicas Opcionais',
    desc: 'Fórmulas ocultas por padrão com dicas progressivas disponíveis sob demanda.',
  },
  stage_4_independent_application: {
    number: 4,
    label: 'Estágio 4: Aplicação Independente',
    desc: 'Resolução direta sem assistência ou pistas, consolidando a autonomia do aluno.',
  },
  stage_5_transfer_engineering: {
    number: 5,
    label: 'Estágio 5: Transferência e Julgamento Técnico',
    desc: 'Casos práticos de engenharia, análise de falhas, normas NBR e trade-offs de projeto.',
  },
}

export const AdaptiveProgressionService = {
  /**
   * Obtém a política adaptativa ativa
   */
  async getActivePolicy(): Promise<AdaptivePolicy> {
    const { data, error } = await (supabase as any)
      .from('adaptive_policies')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      return {
        id: 'policy_default_v1',
        version: 1,
        title: 'Política Determinística Padrão da Engenharia Divergente',
        isActive: true,
        minAccuracyToAdvance: 70.0,
        maxErrorRateToReview: 40.0,
        perceivedDifficultyWeight: 0.25,
        hintsUsedPenaltyWeight: 0.2,
        objectiveAccuracyWeight: 0.4,
        uncertaintyFrequencyWeight: 0.15,
        minAttemptsBeforeDecision: 2,
        allowStudentOverrideChallenge: true,
        configJson: {},
      }
    }

    return {
      id: data.id,
      version: data.version,
      title: data.title,
      description: data.description,
      isActive: data.is_active,
      minAccuracyToAdvance: Number(data.min_accuracy_to_advance) || 70,
      maxErrorRateToReview: Number(data.max_error_rate_to_review) || 40,
      perceivedDifficultyWeight: Number(data.perceived_difficulty_weight) || 0.25,
      hintsUsedPenaltyWeight: Number(data.hints_used_penalty_weight) || 0.2,
      objectiveAccuracyWeight: Number(data.objective_accuracy_weight) || 0.4,
      uncertaintyFrequencyWeight: Number(data.uncertainty_frequency_weight) || 0.15,
      minAttemptsBeforeDecision: data.min_attempts_before_decision || 2,
      allowStudentOverrideChallenge: Boolean(data.allow_student_override_challenge),
      configJson: data.config_json || {},
    }
  },

  /**
   * Salva configurações da política adaptativa (Admin)
   */
  async adminSavePolicy(policy: Partial<AdaptivePolicy>): Promise<void> {
    const payload: Record<string, unknown> = {
      id: policy.id || 'policy_default_v1',
      version: (policy.version || 1) + 1,
      title: policy.title,
      description: policy.description,
      is_active: policy.isActive ?? true,
      min_accuracy_to_advance: policy.minAccuracyToAdvance,
      max_error_rate_to_review: policy.maxErrorRateToReview,
      perceived_difficulty_weight: policy.perceivedDifficultyWeight,
      hints_used_penalty_weight: policy.hintsUsedPenaltyWeight,
      objective_accuracy_weight: policy.objectiveAccuracyWeight,
      uncertainty_frequency_weight: policy.uncertaintyFrequencyWeight,
      min_attempts_before_decision: policy.minAttemptsBeforeDecision,
      allow_student_override_challenge: policy.allowStudentOverrideChallenge,
      updated_at: new Date().toISOString(),
    }

    const { error } = await (supabase as any)
      .from('adaptive_policies')
      .upsert(payload, { onConflict: 'id' })

    if (error) throw error
  },

  /**
   * Avalia determinísticamente a próxima recomendação para o aluno
   */
  async computeAdaptiveRecommendation(
    userId: string,
    trackId: string,
    competencyCode?: string,
  ): Promise<AdaptiveRecommendation> {
    const policy = await this.getActivePolicy()

    // 1. Coleta histórico de respostas do aluno para a trilha ou competência
    let query = (supabase as any)
      .from('attempt_answers')
      .select(
        'is_correct, perceived_difficulty, hints_used_count, guessed, active_seconds, competency_code',
      )
      .eq('user_id', userId)

    if (competencyCode) {
      query = query.eq('competency_code', competencyCode)
    }

    const { data: answers } = await query.order('answered_at', { ascending: false }).limit(20)

    const total = answers?.length || 0

    // Se aluno tem poucas tentativas, inicia com estágio assistido padrão
    if (total < policy.minAttemptsBeforeDecision) {
      return {
        action: 'equivalent_exercise',
        title: 'Fixação de Conceitos Básicos',
        explanation:
          'Você está no início deste módulo. Recomendamos prosseguir com exercícios que trazem formulação e suporte estruturado.',
        recommendedStage: 'stage_2_assisted_with_formulas',
        competencyCode: competencyCode || 'COMP-RESMAT-01',
        metricsConsidered: {
          accuracyRate: 100,
          avgPerceivedDifficulty: 3,
          hintsUsedCount: 0,
          uncertaintyCount: 0,
          attemptsCount: total,
          compositeProficiencyScore: 50,
        },
      }
    }

    const correctCount = answers.filter((a: any) => a.is_correct).length
    const accuracyRate = (correctCount / total) * 100

    const ratedAnswers = answers.filter((a: any) => a.perceived_difficulty)
    const avgPerceivedDifficulty =
      ratedAnswers.length > 0
        ? ratedAnswers.reduce((acc: number, curr: any) => acc + curr.perceived_difficulty, 0) /
          ratedAnswers.length
        : 3.0

    const hintsCount = answers.reduce(
      (acc: number, curr: any) => acc + (curr.hints_used_count || 0),
      0,
    )
    const uncertaintyCount = answers.filter((a: any) => a.guessed).length

    // Fórmula determinística do Score de Proficiência:
    // Proficiência = (Acurácia * W_acc) + ((5 - DifPercebida)/4 * 100 * W_dif) - (PenalidadeDicas * W_dicas) - (Incerteza * W_inc)
    const normDifficulty = Math.max(0, Math.min(100, ((5 - avgPerceivedDifficulty) / 4) * 100))
    const normHintsPenalty = Math.min(100, (hintsCount / total) * 25)
    const normUncertaintyPenalty = Math.min(100, (uncertaintyCount / total) * 50)

    const compositeScore = Math.round(
      accuracyRate * policy.objectiveAccuracyWeight +
        normDifficulty * policy.perceivedDifficultyWeight -
        normHintsPenalty * policy.hintsUsedPenaltyWeight -
        normUncertaintyPenalty * policy.uncertaintyFrequencyWeight,
    )

    let action: AdaptiveRecommendation['action']
    let title: string
    let explanation: string
    let recommendedStage: AssistanceStageLevel

    if (compositeScore >= 80 && accuracyRate >= policy.minAccuracyToAdvance) {
      action = 'advance_difficulty'
      title = 'Avanço de Complexidade & Autonomia'
      explanation = `Seu domínio demonstrado (${compositeScore} pts com ${accuracyRate.toFixed(0)}% de acertos) indica prontidão para resolver problemas independentes sem fórmulas de apoio.`
      recommendedStage = 'stage_4_independent_application'
    } else if (compositeScore >= 60) {
      action = 'equivalent_exercise'
      title = 'Prática Deliberada Equivalente'
      explanation = `Bom rendimento com suporte pontual. Recomendamos um exercício no mesmo grau com desmame de dicas para fortalecer a retenção.`
      recommendedStage = 'stage_3_retrieval_with_hints'
    } else if (accuracyRate <= policy.maxErrorRateToReview || avgPerceivedDifficulty >= 4.2) {
      action = 'review_prerequisites'
      title = 'Reforço de Pré-Requisitos e Teoria'
      explanation = `Identificamos esforço elevado (${avgPerceivedDifficulty.toFixed(1)}/5) e taxa de erro acima do limiar. Sugerimos revisar as deduções fundamentais com fórmulas visíveis antes de prosseguir.`
      recommendedStage = 'stage_1_detailed_review'
    } else {
      action = 'integrative_mission'
      title = 'Consolidação e Aplicação'
      explanation = `Recomendamos exercícios assistidos com fórmulas para consolidar a fundamentação mecânica.`
      recommendedStage = 'stage_2_assisted_with_formulas'
    }

    const rec: AdaptiveRecommendation = {
      action,
      title,
      explanation,
      recommendedStage,
      competencyCode: competencyCode || 'COMP-RESMAT-01',
      metricsConsidered: {
        accuracyRate: Math.round(accuracyRate),
        avgPerceivedDifficulty: Number(avgPerceivedDifficulty.toFixed(1)),
        hintsUsedCount: hintsCount,
        uncertaintyCount,
        attemptsCount: total,
        compositeProficiencyScore: Math.max(0, Math.min(100, compositeScore)),
      },
    }

    // Registra log explicável para auditoria do admin
    await (supabase as any).from('adaptive_recommendation_logs').insert({
      user_id: userId,
      track_id: trackId,
      competency_code: rec.competencyCode,
      recommended_action: rec.action,
      recommendation_reason: rec.explanation,
      decision_factors: rec.metricsConsidered,
      student_overrode_choice: false,
    })

    return rec
  },

  /**
   * Registra quando o aluno escolhe conscientemente um desafio superior
   * mesmo quando o sistema recomendou revisão (Regra 14 do Usuário)
   */
  async recordStudentOverrideChoice(
    userId: string,
    trackId: string,
    chosenAction: string,
  ): Promise<void> {
    await (supabase as any).from('adaptive_recommendation_logs').insert({
      user_id: userId,
      track_id: trackId,
      recommended_action: 'student_override_higher_difficulty',
      recommendation_reason:
        'O aluno exerceu autonomia técnica para enfrentar desafio de maior complexidade.',
      decision_factors: { studentChoice: chosenAction },
      student_overrode_choice: true,
      student_chosen_action: chosenAction,
    })

    // Registra telemetria não duplicada
    await (supabase as any).from('student_telemetry_events').insert({
      user_id: userId,
      event_type: 'adaptive_challenge_overridden',
      entity_id: trackId,
      payload: { chosenAction },
    })
  },

  /**
   * Busca e gerencia avaliações diagnósticas (Nivelamento Inicial)
   */
  async getDiagnosticAssessment(trackId: string): Promise<DiagnosticAssessmentConfig | null> {
    const { data, error } = await (supabase as any)
      .from('diagnostic_assessments_config')
      .select('*')
      .eq('track_id', trackId)
      .eq('is_active', true)
      .maybeSingle()

    if (error || !data) return null

    return {
      id: data.id,
      trackId: data.track_id,
      title: data.title,
      description: data.description,
      isActive: data.is_active,
      durationMinutes: data.duration_minutes,
      maxRetakesPerStudent: data.max_retakes_per_student,
      retakeCooldownDays: data.retake_cooldown_days,
      competenciesCovered: data.competencies_covered || [],
      questionIds: data.question_ids || [],
      startingPointRules: data.starting_point_rules || [],
    }
  },

  /**
   * Salva resultado de avaliação diagnóstica com ponto de partida por competência
   */
  async completeDiagnosticAssessment(
    result: StudentDiagnosticResult,
  ): Promise<StudentDiagnosticResult> {
    const payload = {
      user_id: result.userId,
      assessment_id: result.assessmentId,
      track_id: result.trackId,
      status: 'completed',
      competency_scores: result.competencyScores,
      recommended_starting_nodes: result.recommendedStartingNodes,
      total_questions: result.totalQuestions,
      correct_questions: result.correctQuestions,
      score_percent: result.scorePercent,
      active_seconds: result.activeSeconds,
      completed_at: new Date().toISOString(),
      metadata: { completedByStudent: true },
    }

    const { data, error } = await (supabase as any)
      .from('student_diagnostic_results')
      .insert(payload)
      .select()
      .single()

    if (error) throw error

    // Telemetria mínima de diagnóstico concluído
    await (supabase as any).from('student_telemetry_events').insert({
      user_id: result.userId,
      event_type: 'diagnostic_completed',
      entity_id: result.assessmentId,
      payload: { trackId: result.trackId, scorePercent: result.scorePercent },
    })

    return {
      ...result,
      id: data.id,
      completedAt: data.completed_at,
    }
  },

  /**
   * Lista resultados de diagnósticos anteriores do aluno
   */
  async getStudentDiagnosticHistory(
    userId: string,
    trackId: string,
  ): Promise<StudentDiagnosticResult[]> {
    const { data, error } = await (supabase as any)
      .from('student_diagnostic_results')
      .select('*')
      .eq('user_id', userId)
      .eq('track_id', trackId)
      .order('completed_at', { ascending: false })

    if (error || !data) return []

    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      assessmentId: d.assessment_id,
      trackId: d.track_id,
      status: d.status,
      competencyScores: d.competency_scores || {},
      recommendedStartingNodes: d.recommended_starting_nodes || [],
      totalQuestions: d.total_questions,
      correctQuestions: d.correct_questions,
      scorePercent: Number(d.score_percent) || 0,
      activeSeconds: d.active_seconds,
      completedAt: d.completed_at,
    }))
  },

  /**
   * B2 — Revisão Espaçada Inteligente com Agendamento e Seleção de Equivalentes
   * Aprimora o ciclo 1/3/7/14 dias diferenciando erros conceituais e permitindo revisão voluntária.
   */
  async getPendingSpacedReviews(userId: string): Promise<
    Array<{
      id: string
      missionId: string
      exerciseId: string
      competencyCode: string
      intervalDays: number
      state: string
      scheduledFor: string
      isPending: boolean
      equivalentExerciseAvailable: boolean
    }>
  > {
    const { data, error } = await (supabase as any)
      .from('review_schedule')
      .select('*')
      .eq('user_id', userId)
      .eq('is_pending', true)
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })

    if (error || !data) return []

    return data.map((r: any) => ({
      id: r.id,
      missionId: r.mission_id,
      exerciseId: r.exercise_id,
      competencyCode: r.competency_code,
      intervalDays: r.interval_days,
      state: r.state,
      scheduledFor: r.scheduled_for,
      isPending: r.is_pending,
      equivalentExerciseAvailable: true,
    }))
  },

  /**
   * Permite revisão voluntária solicitada pelo aluno de um tópico específico
   */
  async requestVoluntaryReview(
    userId: string,
    missionId: string,
    competencyCode: string,
  ): Promise<void> {
    const { error } = await (supabase as any).from('review_schedule').upsert(
      {
        user_id: userId,
        mission_id: missionId,
        exercise_id: `vol-${missionId}-${Date.now()}`,
        competency_code: competencyCode,
        state: 'step_1_day',
        interval_days: 1,
        scheduled_for: new Date().toISOString(),
        is_pending: true,
      },
      { onConflict: 'user_id,exercise_id' },
    )

    if (error) console.warn('Erro ao registrar revisão voluntária:', error)
  },

  /**
   * Calibração de Dificuldade de Questões (Admin & Editorial)
   */
  async listQuestionCalibrations(): Promise<QuestionCalibrationData[]> {
    const { data, error } = await (supabase as any)
      .from('question_calibrations')
      .select('*')
      .order('last_calibrated_at', { ascending: false })

    if (error || !data) return []

    return data.map((q: any) => ({
      questionId: q.question_id,
      competencyCode: q.competency_code,
      totalAnswersCount: q.total_answers_count,
      correctAnswersCount: q.correct_answers_count,
      accuracyRate: Number(q.accuracy_rate) || 0,
      avgPerceivedDifficulty: Number(q.avg_perceived_difficulty) || 3,
      uncertaintyCount: q.uncertainty_count,
      totalHintsUsed: q.total_hints_used,
      avgActiveSeconds: Number(q.avg_active_seconds) || 0,
      currentCalibratedStage: q.current_calibrated_stage,
      isFlaggedForEditorialReview: Boolean(q.is_flagged_for_editorial_review),
      editorialNotes: q.editorial_notes,
    }))
  },

  /**
   * Simula o motor adaptativo para diferentes perfis de alunos no painel admin
   */
  simulateProfileRecommendation(
    profile: {
      accuracyRate: number
      avgPerceivedDifficulty: number
      hintsCount: number
      uncertaintyCount: number
      attemptsCount: number
    },
    policy: AdaptivePolicy,
  ): AdaptiveRecommendation {
    const total = profile.attemptsCount || 5
    const normDiff = Math.max(0, Math.min(100, ((5 - profile.avgPerceivedDifficulty) / 4) * 100))
    const normHints = Math.min(100, (profile.hintsCount / total) * 25)
    const normUncert = Math.min(100, (profile.uncertaintyCount / total) * 50)

    const score = Math.round(
      profile.accuracyRate * policy.objectiveAccuracyWeight +
        normDiff * policy.perceivedDifficultyWeight -
        normHints * policy.hintsUsedPenaltyWeight -
        normUncert * policy.uncertaintyFrequencyWeight,
    )

    let action: AdaptiveRecommendation['action']
    let title: string
    let explanation: string
    let stage: AssistanceStageLevel

    if (score >= 80 && profile.accuracyRate >= policy.minAccuracyToAdvance) {
      action = 'advance_difficulty'
      title = 'Avanço de Complexidade'
      explanation = `Perfil de alta autonomia (${score} pts). Recomendado desmame total de fórmulas.`
      stage = 'stage_4_independent_application'
    } else if (score >= 60) {
      action = 'equivalent_exercise'
      title = 'Prática Equivalente'
      explanation = `Desempenho estável. Recomendada questão similar com dicas opcionais.`
      stage = 'stage_3_retrieval_with_hints'
    } else if (
      profile.accuracyRate <= policy.maxErrorRateToReview ||
      profile.avgPerceivedDifficulty >= 4.0
    ) {
      action = 'review_prerequisites'
      title = 'Reforço de Pré-Requisitos'
      explanation = `Dificuldade acentuada percebida. Recomendada revisão com fórmulas expostas.`
      stage = 'stage_1_detailed_review'
    } else {
      action = 'integrative_mission'
      title = 'Resolução Guiada'
      explanation = `Recomendado estágio 2 com fórmulas visíveis.`
      stage = 'stage_2_assisted_with_formulas'
    }

    return {
      action,
      title,
      explanation,
      recommendedStage: stage,
      metricsConsidered: {
        accuracyRate: profile.accuracyRate,
        avgPerceivedDifficulty: profile.avgPerceivedDifficulty,
        hintsUsedCount: profile.hintsCount,
        uncertaintyCount: profile.uncertaintyCount,
        attemptsCount: total,
        compositeProficiencyScore: score,
      },
    }
  },
}
