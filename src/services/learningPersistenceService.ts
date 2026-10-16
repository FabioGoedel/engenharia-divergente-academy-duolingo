/**
 * Engenharia Divergente Academy — LearningPersistenceService
 * Subfase 4.2: Serviço real conectado ao backend Supabase.
 *
 * Gerencia ciclo de tentativas, eventos de telemetria ativa, submissão server-side,
 * histórico de respostas, agendamentos de revisão espaçada e progresso por competências.
 */

import { supabase } from '@/lib/supabase/client'
import { ActivityMissionProgress, ExerciseSubmission, ExerciseGradeResult } from '@/types/activity'

export interface AttemptEventInput {
  attemptId: string
  eventType:
    | 'started'
    | 'hint_requested'
    | 'calc_transfer'
    | 'formula_toggled'
    | 'visibility_pause'
    | 'visibility_resume'
    | 'submitted'
    | 'completed'
  exerciseId?: string
  payload?: Record<string, unknown>
}

export interface StudentDashboardMetrics {
  totalXp: number
  totalActiveSeconds: number
  completedMissionsCount: number
  pendingReviewsCount: number
  competencies: Array<{
    competencyCode: string
    masteryScorePercent: number
    totalAnswered: number
    autonomousCount: number
  }>
  nextRecommendedActivity?: {
    missionId: string
    title: string
  }
}

export const LearningPersistenceService = {
  /**
   * Inicia ou retoma uma tentativa existente no Supabase para o aluno autenticado.
   */
  async startOrResumeAttempt(missionId: string, userId: string): Promise<ActivityMissionProgress> {
    // 1. Busca tentativa em andamento
    const { data: existing, error: fetchErr } = await (supabase as any)
      .from('activity_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('mission_id', missionId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchErr) {
      console.warn('Erro ao consultar tentativas no Supabase:', fetchErr)
    }

    let attemptRow = existing

    // 2. Se não existir, cria nova tentativa
    if (!attemptRow) {
      const { data: created, error: createErr } = await (supabase as any)
        .from('activity_attempts')
        .insert({
          user_id: userId,
          mission_id: missionId,
          activity_version: 1,
          status: 'in_progress',
          current_exercise_index: 0,
        })
        .select('*')
        .single()

      if (createErr || !created) {
        throw new Error(createErr?.message || 'Falha ao criar nova tentativa no backend Supabase.')
      }
      attemptRow = created

      // Registra evento de início
      await this.recordEvent({
        attemptId: created.id,
        eventType: 'started',
      })
    }

    // 3. Carrega respostas já dadas nesta tentativa
    const { data: answersData } = await (supabase as any)
      .from('attempt_answers')
      .select('*')
      .eq('attempt_id', attemptRow.id)

    const answersRecord: ActivityMissionProgress['answers'] = {}
    const completedExerciseIds: string[] = []

    if (answersData) {
      for (const ans of answersData as any[]) {
        const studentAns = ans.student_answer as Record<string, unknown>
        const gradeRes = ans.grade_result as ExerciseGradeResult
        answersRecord[ans.exercise_id] = {
          submission: {
            attemptId: attemptRow.id,
            exerciseId: ans.exercise_id,
            studentAnswer: studentAns,
            hintsUsedCount: ans.hints_used_count,
            perceivedDifficulty: ans.perceived_difficulty as 1 | 2 | 3 | 4 | 5 | undefined,
            guessed: ans.guessed,
            elapsedSeconds: ans.active_seconds,
          },
          result: gradeRes,
          gradedAt: ans.answered_at,
        }
        if (ans.is_correct) {
          completedExerciseIds.push(ans.exercise_id)
        }
      }
    }

    return {
      attemptId: attemptRow.id,
      missionId: attemptRow.mission_id,
      userId: attemptRow.user_id,
      startedAt: attemptRow.started_at,
      completedAt: attemptRow.completed_at || undefined,
      currentExerciseIndex: attemptRow.current_exercise_index || 0,
      completedExerciseIds,
      totalXpEarned: attemptRow.total_xp_awarded || 0,
      isCompleted: attemptRow.status === 'completed',
      answers: answersRecord,
      isDemo: false,
    }
  },

  /**
   * Registra eventos de telemetria na tentativa (pausas de visibilidade, dicas, calculadora)
   */
  async recordEvent(event: AttemptEventInput): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await (supabase as any).from('attempt_events').insert({
        attempt_id: event.attemptId,
        user_id: user.id,
        event_type: event.eventType,
        exercise_id: event.exerciseId || null,
        payload: (event.payload as any) || {},
      })
    } catch (err) {
      console.warn('Erro ao registrar evento pedagógico:', err)
    }
  },

  /**
   * Atualiza índice do exercício atual e tempo acumulado na tentativa
   */
  async updateAttemptState(
    attemptId: string,
    currentIndex: number,
    additionalActiveSeconds = 0,
  ): Promise<void> {
    try {
      const updatePayload: Record<string, unknown> = {
        current_exercise_index: currentIndex,
      }
      if (additionalActiveSeconds > 0) {
        // Incrementa tempo se especificado
        const { data: curr } = await (supabase as any)
          .from('activity_attempts')
          .select('active_time_seconds')
          .eq('id', attemptId)
          .single()
        if (curr) {
          updatePayload.active_time_seconds =
            (curr.active_time_seconds || 0) + additionalActiveSeconds
        }
      }
      await (supabase as any).from('activity_attempts').update(updatePayload).eq('id', attemptId)
    } catch (err) {
      console.warn('Erro ao sincronizar estado da tentativa:', err)
    }
  },

  /**
   * Envia a submissão para correção segura no servidor via Edge Function
   */
  async submitAnswerToEdgeFunction(
    submission: ExerciseSubmission,
    activeSeconds: number,
    formulaWasHidden = false,
  ): Promise<{
    gradeResult: ExerciseGradeResult
    xpAwardedInThisAction: number
    isMissionCompleted: boolean
    evaluation?: any
  }> {
    const { data, error } = await supabase.functions.invoke('evaluate-submission', {
      body: {
        attemptId: submission.attemptId,
        exerciseId: submission.exerciseId,
        studentAnswer: submission.studentAnswer,
        hintsUsedCount: submission.hintsUsedCount || 0,
        perceivedDifficulty: submission.perceivedDifficulty,
        guessed: Boolean(submission.guessed),
        activeSeconds,
        formulaWasHidden,
      },
    })

    if (error || !data) {
      throw new Error(error?.message || data?.error || 'Falha ao processar avaliação no servidor.')
    }

    return {
      gradeResult: data.gradeResult,
      xpAwardedInThisAction: data.xpAwardedInThisAction || 0,
      isMissionCompleted: Boolean(data.isMissionCompleted),
      evaluation: data.evaluation,
    }
  },

  /**
   * Obtém métricas e dados consolidados para o painel de aprendizagem do aluno
   */
  async getStudentLearningMetrics(userId: string): Promise<StudentDashboardMetrics> {
    const [profileRes, progressRes, compRes, reviewsRes] = await Promise.all([
      (supabase as any).from('profiles').select('total_xp').eq('id', userId).maybeSingle(),
      (supabase as any).from('student_activity_progress').select('*').eq('user_id', userId),
      (supabase as any).from('student_competency_progress').select('*').eq('user_id', userId),
      (supabase as any)
        .from('review_schedule')
        .select('*')
        .eq('user_id', userId)
        .eq('is_pending', true),
    ])

    const totalXp = profileRes.data?.total_xp || 0
    let totalActiveSeconds = 0
    let completedMissionsCount = 0

    if (progressRes.data) {
      for (const p of progressRes.data as any[]) {
        totalActiveSeconds += p.total_active_seconds || 0
        if (p.is_completed) completedMissionsCount++
      }
    }

    const competencies = ((compRes.data as any[]) || []).map((c) => ({
      competencyCode: c.competency_code,
      masteryScorePercent: Number(c.mastery_score_percent) || 0,
      totalAnswered: c.total_questions_answered,
      autonomousCount: c.autonomous_correct_count,
    }))

    const pendingReviewsCount = reviewsRes.data?.length || 0

    return {
      totalXp,
      totalActiveSeconds,
      completedMissionsCount,
      pendingReviewsCount,
      competencies,
      nextRecommendedActivity: {
        missionId: 'mis-resmat-flexao-01',
        title: 'Resistência dos Materiais: Flexão Pura e Simples de Vigas',
      },
    }
  },
}
