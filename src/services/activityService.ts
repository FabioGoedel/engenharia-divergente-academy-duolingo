/**
 * Engenharia Divergente Academy — ActivityService
 *
 * PONTO ÚNICO DE TROCA PARA O SUPABASE / BACKEND:
 * - Toda a persistência de tentativas (attempts), respostas e concessão de XP é centralizada aqui.
 * - Idempotência estrita espelhando o `xp_ledger` da ESPECIFICACAO_TECNICA.md:
 *   chave UNIQUE (source_attempt_id, reason). Se a mesma tentativa/razão for repetida
 *   ou se a página for recarregada, o XP NÃO é duplicado.
 * - Gabarito e chaves privadas nunca são expostos no payload do aluno.
 * - O motor é agnóstico ao conteúdo da missão: atua sobre payloads padronizados.
 */

import {
  ActivityMissionDefinition,
  ActivityExerciseStudentPayload,
  ActivityMissionProgress,
  ExerciseSubmission,
  ExerciseGradeResult,
} from '@/types/activity'
import {
  BEAM_BENDING_MISSION,
  BEAM_BENDING_EXERCISES,
  CanonicalMissionExercise,
} from '@/data/beamBendingMissionData'
import { parseBrazilianNumericInput } from '@/schemas/canonicalSchemas'
import { LearningPersistenceService } from '@/services/learningPersistenceService'

const ATTEMPTS_STORAGE_KEY = 'academy_demo_activity_attempts'
const XP_LEDGER_STORAGE_KEY = 'academy_demo_xp_ledger'

interface XpLedgerEntry {
  id: string
  sourceAttemptId: string
  reason: string // ex: "exercise_completion_ex-bb-01"
  xpAmount: number
  userId: string
  createdAt: string
  isDemo: boolean
}

function getStoredAttempts(): Record<string, ActivityMissionProgress> {
  try {
    const raw = localStorage.getItem(ATTEMPTS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function persistAttempts(attempts: Record<string, ActivityMissionProgress>): void {
  try {
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts))
  } catch {
    // fallback
  }
}

function getStoredXpLedger(): XpLedgerEntry[] {
  try {
    const raw = localStorage.getItem(XP_LEDGER_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistXpLedger(ledger: XpLedgerEntry[]): void {
  try {
    localStorage.setItem(XP_LEDGER_STORAGE_KEY, JSON.stringify(ledger))
  } catch {
    // fallback
  }
}

export const ActivityService = {
  /**
   * Obtém os metadados públicos da missão
   */
  async getMissionDefinition(missionIdOrSlug: string): Promise<ActivityMissionDefinition | null> {
    if (
      BEAM_BENDING_MISSION.id === missionIdOrSlug ||
      BEAM_BENDING_MISSION.slug === missionIdOrSlug
    ) {
      return BEAM_BENDING_MISSION
    }
    return null
  },

  /**
   * Obtém a lista sanitizada dos exercícios da missão (PAYLOAD DO ALUNO).
   * Sem gabarito e sem distractorRationale.
   */
  async getMissionStudentExercises(missionId: string): Promise<ActivityExerciseStudentPayload[]> {
    if (missionId !== BEAM_BENDING_MISSION.id) {
      return []
    }
    return BEAM_BENDING_EXERCISES.map((item) => item.studentPayload)
  },

  /**
   * Inicia ou retoma uma tentativa de missão para o usuário.
   * Gera um attempt_id único se não existir tentativa ativa em andamento.
   */
  async startOrResumeAttempt(
    missionId: string,
    userId: string,
    isRealMode = false,
  ): Promise<ActivityMissionProgress> {
    if (isRealMode && userId && !userId.startsWith('demo-')) {
      try {
        return await LearningPersistenceService.startOrResumeAttempt(missionId, userId)
      } catch (err) {
        console.warn('Falha na persistência real do Supabase, caindo para sandbox local:', err)
      }
    }

    const attempts = getStoredAttempts()

    // Procura tentativa recente não concluída para o usuário e missão
    const existingKey = Object.keys(attempts).find((k) => {
      const a = attempts[k]
      return a.missionId === missionId && a.userId === userId && !a.isCompleted
    })

    if (existingKey) {
      return attempts[existingKey]
    }

    // Cria nova tentativa com ID único
    const newAttemptId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const newProgress: ActivityMissionProgress = {
      attemptId: newAttemptId,
      missionId,
      userId,
      startedAt: new Date().toISOString(),
      currentExerciseIndex: 0,
      completedExerciseIds: [],
      totalXpEarned: 0,
      isCompleted: false,
      answers: {},
      isDemo: true,
    }

    attempts[newAttemptId] = newProgress
    persistAttempts(attempts)
    return newProgress
  },

  /**
   * Obtém o progresso de uma tentativa pelo attemptId
   */
  async getAttemptProgress(attemptId: string): Promise<ActivityMissionProgress | null> {
    const attempts = getStoredAttempts()
    return attempts[attemptId] || null
  },

  /**
   * CORREÇÃO NA CAMADA DE SERVIÇO (Simulação Server-Side):
   * Recebe a submissão do aluno, busca a chave privada isolada e calcula o resultado.
   * Aplica idempotência de XP espelhando o UNIQUE(source_attempt_id, reason).
   */
  async submitExerciseAnswer(
    submission: ExerciseSubmission,
    userId: string,
    isRealMode = false,
    options?: { activeSeconds?: number; formulaWasHidden?: boolean },
  ): Promise<{
    gradeResult: ExerciseGradeResult
    updatedProgress: ActivityMissionProgress
    xpAwardedInThisAction: number
  }> {
    // Se o usuário está autenticado no Supabase real (não é demo), envia para o servidor via Edge Function
    if (isRealMode && userId && !userId.startsWith('demo-')) {
      try {
        const edgeResult = await LearningPersistenceService.submitAnswerToEdgeFunction(
          submission,
          options?.activeSeconds || 0,
          options?.formulaWasHidden || false,
        )

        // Atualiza e retorna o progresso atualizado do Supabase
        const updatedProgress = await LearningPersistenceService.startOrResumeAttempt(
          BEAM_BENDING_MISSION.id,
          userId,
        )

        return {
          gradeResult: edgeResult.gradeResult,
          updatedProgress,
          xpAwardedInThisAction: edgeResult.xpAwardedInThisAction,
        }
      } catch (edgeErr) {
        console.warn('Erro ao avaliar via Edge Function, caindo para fallback canônico:', edgeErr)
      }
    }

    const { attemptId, exerciseId, studentAnswer, hintsUsedCount } = submission

    const canonicalItem: CanonicalMissionExercise | undefined = BEAM_BENDING_EXERCISES.find(
      (e) => e.studentPayload.id === exerciseId,
    )

    if (!canonicalItem) {
      throw new Error(`Exercício "${exerciseId}" não localizado na base canônica.`)
    }

    const { studentPayload, privateKey } = canonicalItem
    let isCorrect = false
    let scorePercent = 0
    let feedbackRationale: string | undefined
    let numericDetails: ExerciseGradeResult['numericDetails'] = undefined

    // 1. Correção por tipo
    if (studentPayload.type === 'single_choice' || studentPayload.type === 'engineering_decision') {
      const selectedId = studentAnswer.selectedOptionIds?.[0] || studentAnswer.choiceId
      const expectedId = privateKey.correctOptionIds?.[0]
      isCorrect = Boolean(selectedId && selectedId === expectedId)
      scorePercent = isCorrect ? 100 : 0

      if (selectedId && privateKey.distractorRationales) {
        feedbackRationale = privateKey.distractorRationales[selectedId]
      }
    } else if (studentPayload.type === 'numeric_response') {
      const parsedValue = parseBrazilianNumericInput(studentAnswer.numericValue)
      const expected = privateKey.numericExpectedValue ?? 0
      const tolAbs = privateKey.numericToleranceAbs ?? 0.5

      if (parsedValue !== null) {
        const diff = Math.abs(parsedValue - expected)
        isCorrect = diff <= tolAbs
        scorePercent = isCorrect ? 100 : 0
        numericDetails = {
          expected,
          tolerance: tolAbs,
          unit: privateKey.numericUnit || studentPayload.numericUnit,
          userParsedValue: parsedValue,
        }
      } else {
        isCorrect = false
        scorePercent = 0
        numericDetails = {
          expected,
          tolerance: tolAbs,
          unit: privateKey.numericUnit || studentPayload.numericUnit,
        }
      }
    }

    // 2. Cálculo do XP com desconto configurável de dicas
    let earnedXp = 0
    if (isCorrect) {
      const baseXp = studentPayload.xpRewardBase
      const totalHintPenalty = studentPayload.hints
        .slice(0, hintsUsedCount)
        .reduce((sum, h) => sum + h.xpCost, 0)
      earnedXp = Math.max(5, baseXp - totalHintPenalty) // Mínimo de 5 XP por acerto
    }

    // 3. IDEMPOTÊNCIA DE XP (espelho de UNIQUE source_attempt_id + reason no xp_ledger)
    const ledgerReason = `exercise_completion_${exerciseId}`
    const ledger = getStoredXpLedger()
    const alreadyCredited = ledger.some(
      (entry) => entry.sourceAttemptId === attemptId && entry.reason === ledgerReason,
    )

    let actualXpToAward = 0
    if (isCorrect && !alreadyCredited) {
      actualXpToAward = earnedXp
      ledger.push({
        id: `xpledger-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sourceAttemptId: attemptId,
        reason: ledgerReason,
        xpAmount: earnedXp,
        userId,
        createdAt: new Date().toISOString(),
        isDemo: true,
      })
      persistXpLedger(ledger)
    }

    const gradeResult: ExerciseGradeResult = {
      isCorrect,
      scorePercent,
      xpEarned: actualXpToAward,
      explanationMarkdown: privateKey.explanationMarkdown,
      feedbackRationale,
      numericDetails,
      correctOptionIds: privateKey.correctOptionIds,
    }

    // 4. Atualiza o estado da tentativa
    const attempts = getStoredAttempts()
    const currentProgress = attempts[attemptId] || {
      attemptId,
      missionId: studentPayload.missionId,
      userId,
      startedAt: new Date().toISOString(),
      currentExerciseIndex: 0,
      completedExerciseIds: [],
      totalXpEarned: 0,
      isCompleted: false,
      answers: {},
      isDemo: true,
    }

    currentProgress.answers[exerciseId] = {
      submission,
      result: gradeResult,
      gradedAt: new Date().toISOString(),
    }

    if (isCorrect && !currentProgress.completedExerciseIds.includes(exerciseId)) {
      currentProgress.completedExerciseIds.push(exerciseId)
      currentProgress.totalXpEarned += actualXpToAward
    }

    // Verifica se completou todos os exercícios da missão
    if (currentProgress.completedExerciseIds.length >= BEAM_BENDING_EXERCISES.length) {
      currentProgress.isCompleted = true
      currentProgress.completedAt = new Date().toISOString()
    }

    attempts[attemptId] = currentProgress
    persistAttempts(attempts)

    return {
      gradeResult,
      updatedProgress: currentProgress,
      xpAwardedInThisAction: actualXpToAward,
    }
  },

  /**
   * Avança o índice do exercício na tentativa
   */
  async setExerciseIndex(
    attemptId: string,
    index: number,
    isRealMode = false,
  ): Promise<ActivityMissionProgress | void> {
    if (isRealMode && !attemptId.startsWith('att-')) {
      await LearningPersistenceService.updateAttemptState(attemptId, index)
      return
    }

    const attempts = getStoredAttempts()
    const progress = attempts[attemptId]
    if (progress) {
      progress.currentExerciseIndex = index
      persistAttempts(attempts)
      return progress
    }
    throw new Error('Tentativa não encontrada.')
  },

  /**
   * Reinicia a missão gerando uma nova tentativa limpa
   */
  async resetAttempt(missionId: string, userId: string): Promise<ActivityMissionProgress> {
    const newAttemptId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const newProgress: ActivityMissionProgress = {
      attemptId: newAttemptId,
      missionId,
      userId,
      startedAt: new Date().toISOString(),
      currentExerciseIndex: 0,
      completedExerciseIds: [],
      totalXpEarned: 0,
      isCompleted: false,
      answers: {},
      isDemo: true,
    }

    const attempts = getStoredAttempts()
    attempts[newAttemptId] = newProgress
    persistAttempts(attempts)
    return newProgress
  },

  /**
   * Consulta o ledger de XP para auditoria e teste de idempotência
   */
  getXpLedger(): XpLedgerEntry[] {
    return getStoredXpLedger()
  },
}
