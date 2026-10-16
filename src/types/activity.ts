/**
 * Engenharia Divergente Academy — Tipos de Atividades Interativas e Missões
 *
 * Contrato canônico agnóstico para execução de missões:
 * - A missão é composta por itens ordenados (atividades/questões).
 * - O motor de atividades não tem conteúdo fixo: consome itens de dados compatíveis
 *   com o canonicalSchemas / QuestionBankItem e content_blocks.
 * - Gabarito e chaves privadas nunca são trafegados no payload do aluno.
 * - Idempotência estrita de XP espelhando o xp_ledger (UNIQUE source_attempt_id + reason).
 */

import { QuestionType, EditorialStatus } from '@/types/cms'

export interface ActivityHint {
  id: string
  textMarkdown: string
  xpCost: number // Redução configurável de XP ao solicitar dica
}

export interface ActivityExerciseOption {
  id: string
  label: string
  textMarkdown: string
  // distractorRationale NÃO existe aqui no payload inicial do aluno!
}

export interface ActivityExerciseStudentPayload {
  id: string
  missionId: string
  order: number
  externalId: string
  title: string
  type: QuestionType | 'structural_diagram' | 'engineering_decision'
  promptMarkdown: string
  diagramUrl?: string
  diagramCaption?: string
  options?: ActivityExerciseOption[]
  numericUnit?: string
  numericPlaceholder?: string
  hints: ActivityHint[]
  estimatedSeconds: number
  xpRewardBase: number
  blockType: string // Bloco registrado correspondente para renderização no BlockRegistry
  subjectArea: string
  competencyCode: string
}

export interface ActivityExercisePrivateKey {
  correctOptionIds?: string[]
  numericExpectedValue?: number
  numericToleranceAbs?: number
  numericToleranceRel?: number
  numericUnit?: string
  explanationMarkdown: string
  distractorRationales?: Record<string, string> // rationale por optionId
  rubricNotes?: string
}

export interface ActivityMissionDefinition {
  id: string
  slug: string
  trackSlug: string
  moduleId: string
  title: string
  headline: string
  description: string
  level: string
  subjectArea: string
  totalExercises: number
  estimatedMinutes: number
  totalXpReward: number
  editorialStatus: EditorialStatus
  isDemo?: boolean
}

export interface ExerciseSubmission {
  attemptId: string
  exerciseId: string
  studentAnswer: {
    selectedOptionIds?: string[]
    numericValue?: string | number
    choiceId?: string
    notes?: string
  }
  hintsUsedCount: number
  perceivedDifficulty?: 1 | 2 | 3 | 4 | 5
  guessed?: boolean // "Acertei, mas não tinha certeza"
  elapsedSeconds?: number
}

export interface ExerciseGradeResult {
  isCorrect: boolean
  scorePercent: number
  xpEarned: number
  explanationMarkdown: string
  feedbackRationale?: string
  numericDetails?: {
    expected: number
    tolerance: number
    unit?: string
    userParsedValue?: number
  }
  correctOptionIds?: string[] // Apenas após responder
}

export interface ActivityMissionProgress {
  attemptId: string
  missionId: string
  userId: string
  startedAt: string
  completedAt?: string
  currentExerciseIndex: number
  completedExerciseIds: string[]
  totalXpEarned: number
  isCompleted: boolean
  answers: Record<
    string,
    {
      submission: ExerciseSubmission
      result: ExerciseGradeResult
      gradedAt: string
    }
  >
  isDemo?: boolean
}
