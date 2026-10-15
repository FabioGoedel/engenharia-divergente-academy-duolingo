/**
 * Camada de Serviços Swappable — Banco de Questões Editável (Fase 2)
 *
 * PONTO ÚNICO DE TROCA:
 * Quando o Supabase for conectado:
 * 1. `question_bank` terá RLS estrita onde `private_key_json` NUNCA é retornado
 *    para o papel `student` (função security definer `get_student_question_payload`).
 * 2. Correção de respostas ocorrerá via Edge Function `submit_question_answer`
 *    comparando com o gabarito protegido no servidor.
 * 3. Publicar cria registro imutável em `question_versions`.
 */

import {
  QuestionBankItem,
  QuestionStudentPayload,
  QuestionPrivateKey,
  EditorialStatus,
  VersionSnapshot,
} from '@/types/cms'
import { INITIAL_DEMO_QUESTIONS } from '@/data/demoCmsData'
import { Role, isAdminRole } from '@/lib/rbac'
import { parseBrazilianNumericInput } from '@/schemas/canonicalSchemas'

const QUESTIONS_STORAGE_KEY = 'academy_demo_question_bank'
const VERSIONS_STORAGE_KEY = 'academy_demo_question_versions'

function getStoredQuestions(): QuestionBankItem[] {
  try {
    const raw = localStorage.getItem(QUESTIONS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_QUESTIONS))
      return INITIAL_DEMO_QUESTIONS
    }
    return JSON.parse(raw) as QuestionBankItem[]
  } catch {
    return INITIAL_DEMO_QUESTIONS
  }
}

function persistQuestions(questions: QuestionBankItem[]): void {
  try {
    localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(questions))
  } catch {
    // fallback
  }
}

function getStoredVersions(): VersionSnapshot<QuestionBankItem>[] {
  try {
    const raw = localStorage.getItem(VERSIONS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistVersions(versions: VersionSnapshot<QuestionBankItem>[]): void {
  try {
    localStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(versions))
  } catch {
    // fallback
  }
}

export const QuestionBankService = {
  assertEditorialAccess(role?: Role | null): void {
    if (!role || (role !== 'content_editor' && role !== 'admin' && role !== 'super_admin')) {
      throw new Error('Acesso negado: privilégios editoriais necessários.')
    }
  },

  assertPublishAccess(role?: Role | null): void {
    if (!role || !isAdminRole(role)) {
      throw new Error('Acesso negado: publicação final restrita a administradores.')
    }
  },

  async listQuestions(filters?: {
    search?: string
    subjectArea?: string
    authoringLevel?: number
    status?: EditorialStatus
    isContested?: boolean
    lowPerformance?: boolean // Telemetria simulada
  }): Promise<QuestionBankItem[]> {
    let list = getStoredQuestions()

    if (filters?.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.externalId.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q)) ||
          item.promptMarkdown.toLowerCase().includes(q),
      )
    }

    if (filters?.subjectArea && filters.subjectArea !== 'all') {
      list = list.filter((i) => i.subjectArea === filters.subjectArea)
    }

    if (filters?.authoringLevel) {
      list = list.filter((i) => i.authoringLevel === filters.authoringLevel)
    }

    if (filters?.status && filters.status !== ('all' as unknown)) {
      list = list.filter((i) => i.editorialStatus === filters.status)
    }

    if (filters?.isContested) {
      list = list.filter((i) => i.telemetryStats?.isContested === true)
    }

    if (filters?.lowPerformance) {
      // Baixa performance: taxa de acerto abaixo de 50%
      list = list.filter((i) => (i.telemetryStats?.accuracyRate ?? 100) < 50)
    }

    return list
  },

  async getById(id: string): Promise<QuestionBankItem | null> {
    const list = getStoredQuestions()
    return list.find((q) => q.id === id) || null
  },

  /**
   * PAYLOAD SEGURO DO ALUNO:
   * Remove privateKey e distractorRationale de forma estrita!
   */
  async getStudentPayload(id: string): Promise<QuestionStudentPayload | null> {
    const q = await this.getById(id)
    if (!q) return null

    return {
      id: q.id,
      externalId: q.externalId,
      title: q.title,
      questionType: q.questionType,
      subjectArea: q.subjectArea,
      competencyCode: q.competencyCode,
      authoringLevel: q.authoringLevel,
      promptMarkdown: q.promptMarkdown,
      options: q.options.map((opt) => ({
        id: opt.id,
        label: opt.label,
        textMarkdown: opt.textMarkdown,
      })),
      hint: q.hint,
      numericUnit: q.numericUnit,
      estimatedSeconds: q.estimatedSeconds,
      xpReward: q.xpReward,
      version: q.version,
    }
  },

  /**
   * CORREÇÃO NA CAMADA DE SERVIÇO:
   * Valida resposta do aluno contra o gabarito protegido do servidor.
   */
  async gradeAnswer(
    questionId: string,
    studentAnswer: {
      selectedOptionIds?: string[]
      numericValue?: number | string
      stepOrder?: string[]
    },
  ): Promise<{
    isCorrect: boolean
    scorePercent: number
    explanation: string
    feedbackRationale?: string
    numericDetails?: { expected: number; tolerance: number; unit?: string }
  }> {
    const q = await this.getById(questionId)
    if (!q) throw new Error('Questão não encontrada.')

    const { privateKey } = q

    if (q.questionType === 'single_choice' || q.questionType === 'true_false') {
      const selected = studentAnswer.selectedOptionIds?.[0]
      const expected = privateKey.correctOptionIds?.[0]
      const isCorrect = selected === expected
      const matchedOption = q.options.find((o) => o.id === selected)

      return {
        isCorrect,
        scorePercent: isCorrect ? 100 : 0,
        explanation: q.explanationMarkdown,
        feedbackRationale: matchedOption?.distractorRationale,
      }
    }

    if (q.questionType === 'multiple_choice') {
      const selected = new Set(studentAnswer.selectedOptionIds || [])
      const expected = new Set(privateKey.correctOptionIds || [])
      const isCorrect =
        selected.size === expected.size && Array.from(selected).every((id) => expected.has(id))

      return {
        isCorrect,
        scorePercent: isCorrect ? 100 : 0,
        explanation: q.explanationMarkdown,
      }
    }

    if (q.questionType === 'numeric_response') {
      const parsedUserVal = parseBrazilianNumericInput(studentAnswer.numericValue)
      const expected = privateKey.numericExpectedValue ?? 0
      const tolAbs = privateKey.numericToleranceAbs ?? 0.05

      if (parsedUserVal === null) {
        return {
          isCorrect: false,
          scorePercent: 0,
          explanation:
            'Valor numérico inválido. Use formato brasileiro com vírgula ou ponto decimal.',
        }
      }

      const diff = Math.abs(parsedUserVal - expected)
      const isCorrect = diff <= tolAbs

      return {
        isCorrect,
        scorePercent: isCorrect ? 100 : 0,
        explanation: q.explanationMarkdown,
        numericDetails: {
          expected,
          tolerance: tolAbs,
          unit: privateKey.numericUnit || q.numericUnit,
        },
      }
    }

    if (q.questionType === 'ordered_steps') {
      const userOrder = studentAnswer.stepOrder || []
      const expectedOrder = privateKey.correctStepOrder || []
      const isCorrect =
        userOrder.length === expectedOrder.length &&
        userOrder.every((id, idx) => id === expectedOrder[idx])

      return {
        isCorrect,
        scorePercent: isCorrect ? 100 : 0,
        explanation: q.explanationMarkdown,
      }
    }

    return {
      isCorrect: false,
      scorePercent: 0,
      explanation: q.explanationMarkdown,
    }
  },

  async createQuestion(
    data: Omit<QuestionBankItem, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'isDemo'>,
    userRole?: Role | null,
  ): Promise<QuestionBankItem> {
    this.assertEditorialAccess(userRole)

    const newQuestion: QuestionBankItem = {
      ...data,
      id: `qst-${Date.now()}`,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      telemetryStats: {
        totalAttempts: 0,
        accuracyRate: 0,
        isContested: false,
        perceivedDifficulty: 'adequada',
        isPendingTelemetry: true,
      },
      isDemo: true,
    }

    const list = [newQuestion, ...getStoredQuestions()]
    persistQuestions(list)
    return newQuestion
  },

  /**
   * Edição com versionamento:
   * Se a questão já está publicada e sofre alteração substantiva,
   * incrementa a versão e salva snapshot imutável.
   */
  async updateQuestion(
    id: string,
    updates: Partial<QuestionBankItem>,
    userRole?: Role | null,
    actorName?: string,
  ): Promise<QuestionBankItem> {
    this.assertEditorialAccess(userRole)

    const list = getStoredQuestions()
    const index = list.findIndex((q) => q.id === id)
    if (index === -1) throw new Error('Questão não encontrada.')

    const current = list[index]
    let newVersion = current.version

    // Se estiver publicada e houver mudança de conteúdo, incrementa versão
    if (
      current.editorialStatus === 'published' &&
      (updates.promptMarkdown || updates.options || updates.privateKey)
    ) {
      newVersion += 1
      // Registra snapshot imutável da versão anterior
      const versions = getStoredVersions()
      versions.push({
        id: `qver-${Date.now()}`,
        entityId: current.id,
        versionNumber: current.version,
        snapshot: current,
        publishedBy: actorName || 'Sistema / Editor',
        publishedAt: new Date().toISOString(),
        changeSummary: 'Nova versão gerada após alteração técnica de conteúdo.',
      })
      persistVersions(versions)
    }

    const updated: QuestionBankItem = {
      ...current,
      ...updates,
      version: newVersion,
      updatedAt: new Date().toISOString(),
    }

    list[index] = updated
    persistQuestions(list)
    return updated
  },

  async publishQuestion(
    id: string,
    reviewerName: string,
    userRole?: Role | null,
  ): Promise<{ success: boolean; question?: QuestionBankItem; errors?: string[] }> {
    this.assertPublishAccess(userRole)

    const q = await this.getById(id)
    if (!q) return { success: false, errors: ['Questão não encontrada.'] }

    // Validação de consistência obrigatória antes de publicar
    const validationErrors: string[] = []

    if (!q.explanationMarkdown || q.explanationMarkdown.trim().length < 5) {
      validationErrors.push(
        'Publicação bloqueada: A explicação da resolução é obrigatória e deve ter embasamento técnico.',
      )
    }

    if (q.questionType === 'single_choice' || q.questionType === 'true_false') {
      const correct = q.privateKey.correctOptionIds
      if (!correct || correct.length !== 1) {
        validationErrors.push(
          'Publicação bloqueada: Deve haver exatamente 1 alternativa correta indicada.',
        )
      }
    } else if (q.questionType === 'numeric_response') {
      if (
        q.privateKey.numericExpectedValue === undefined ||
        Number.isNaN(q.privateKey.numericExpectedValue)
      ) {
        validationErrors.push('Publicação bloqueada: O valor esperado numérico é obrigatório.')
      }
    }

    if (validationErrors.length > 0) {
      return { success: false, errors: validationErrors }
    }

    const updated = await this.updateQuestion(
      id,
      {
        editorialStatus: 'published',
        reviewedBy: reviewerName,
        reviewedAt: new Date().toISOString(),
      },
      userRole,
      reviewerName,
    )

    return { success: true, question: updated }
  },

  async duplicateQuestion(id: string, userRole?: Role | null): Promise<QuestionBankItem> {
    this.assertEditorialAccess(userRole)

    const original = await this.getById(id)
    if (!original) throw new Error('Questão original não encontrada.')

    return this.createQuestion(
      {
        ...original,
        externalId: `${original.externalId}-COPY`,
        title: `${original.title} (Cópia)`,
        editorialStatus: 'draft',
      },
      userRole,
    )
  },

  async deleteQuestion(
    id: string,
    userRole?: Role | null,
  ): Promise<{ success: boolean; reason?: string }> {
    this.assertEditorialAccess(userRole)

    // Se a questão já tiver tentativas registradas ou estiver publicada, arquiva em vez de deletar
    const current = await this.getById(id)
    if (current && current.editorialStatus === 'published') {
      await this.updateQuestion(id, { editorialStatus: 'archived' }, userRole)
      return {
        success: true,
        reason: 'Questão publicada arquivada para preservar a integridade histórica de avaliações.',
      }
    }

    const list = getStoredQuestions().filter((q) => q.id !== id)
    persistQuestions(list)
    return { success: true }
  },
}
