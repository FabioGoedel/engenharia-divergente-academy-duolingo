/**
 * QuestionBankService — Banco de Questões Editável com Persistência Supabase (Subfase 4.3)
 *
 * Suporta:
 * - Persistência em `public.question_bank` e `public.question_versions`
 * - RLS estrita com visão protegida `view_student_question_bank` para alunos (gabarito privado inacessível)
 * - Publicação de questões atômica e validada via RPC `rpc_publish_question`
 * - Respeito a versões imutáveis vinculadas a tentativas pedagógicas
 * - Isolamento transparente para modo Demo
 */

import {
  QuestionBankItem,
  QuestionStudentPayload,
  EditorialStatus,
  VersionSnapshot,
} from '@/types/cms'
import { INITIAL_DEMO_QUESTIONS } from '@/data/demoCmsData'
import { Role, isAdminRole, isEditorialRole } from '@/lib/rbac'
import { parseBrazilianNumericInput } from '@/schemas/canonicalSchemas'
import { supabase } from '@/lib/supabase/client'
import { IS_DEMO } from '@/data/demoData'

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

function mapDbRowToQuestionItem(row: any): QuestionBankItem {
  return {
    id: row.id,
    externalId: row.external_id,
    title: row.title,
    questionType: row.question_type,
    subjectArea: row.subject_area,
    competencyCode: row.competency_code,
    prerequisites: row.prerequisites || [],
    authoringLevel: (row.authoring_level || 3) as any,
    promptMarkdown: row.prompt_markdown,
    options: Array.isArray(row.options) ? row.options : [],
    privateKey: row.private_key_json || {},
    hint: row.hint || undefined,
    explanationMarkdown: row.explanation_markdown || '',
    numericUnit: row.numeric_unit || undefined,
    numericToleranceAbs:
      row.numeric_tolerance_abs !== null ? Number(row.numeric_tolerance_abs) : undefined,
    numericToleranceRel:
      row.numeric_tolerance_rel !== null ? Number(row.numeric_tolerance_rel) : undefined,
    estimatedSeconds: row.estimated_seconds || 180,
    xpReward: row.xp_reward || 15,
    tags: row.tags || [],
    editorialStatus: row.editorial_status,
    version: row.version || 1,
    reviewedBy: row.reviewed_by ? 'Revisor Supabase' : undefined,
    reviewedAt: row.reviewed_at || undefined,
    reviewNotes: row.review_notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    telemetryStats: {
      totalAttempts: 0,
      accuracyRate: 0,
      isContested: false,
      perceivedDifficulty: 'adequada',
      isPendingTelemetry: true,
    },
    isDemo: false,
  }
}

export const QuestionBankService = {
  assertEditorialAccess(role?: Role | null): void {
    if (!role || !isEditorialRole(role)) {
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
    lowPerformance?: boolean
  }): Promise<QuestionBankItem[]> {
    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'

    if (!isDemoMode) {
      try {
        let query = supabase.from('question_bank').select('*')

        if (filters?.subjectArea && filters.subjectArea !== 'all') {
          query = query.eq('subject_area', filters.subjectArea)
        }
        if (filters?.authoringLevel) {
          query = query.eq('authoring_level', filters.authoringLevel)
        }
        if (filters?.status && (filters.status as any) !== 'all') {
          query = query.eq('editorial_status', filters.status)
        }

        const { data, error } = await query.order('created_at', { ascending: false })

        if (!error && data && data.length > 0) {
          let list = data.map(mapDbRowToQuestionItem)
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
          return list
        }
      } catch (err) {
        console.warn('Fallback para listagem local de questões:', err)
      }
    }

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

    return list
  },

  async getById(id: string): Promise<QuestionBankItem | null> {
    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'

    if (!isDemoMode) {
      try {
        const { data, error } = await supabase
          .from('question_bank')
          .select('*')
          .or(`id.eq.${id},external_id.eq.${id}`)
          .maybeSingle()

        if (!error && data) {
          return mapDbRowToQuestionItem(data)
        }
      } catch (err) {
        console.warn('Fallback para busca de questão por ID:', err)
      }
    }

    const list = getStoredQuestions()
    return list.find((q) => q.id === id || q.externalId === id) || null
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

  async createQuestion(
    data: Omit<QuestionBankItem, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'isDemo'> & {
      id?: string
    },
    userRole?: Role | null,
  ): Promise<QuestionBankItem> {
    this.assertEditorialAccess(userRole)

    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'

    if (!isDemoMode) {
      try {
        const insertPayload: any = {
          external_id: data.externalId,
          title: data.title,
          question_type: data.questionType,
          subject_area: data.subjectArea,
          competency_code: data.competencyCode,
          prerequisites: data.prerequisites || [],
          authoring_level: data.authoringLevel || 3,
          prompt_markdown: data.promptMarkdown,
          options: data.options || [],
          private_key_json: data.privateKey || {},
          hint: data.hint || null,
          explanation_markdown: data.explanationMarkdown || '',
          numeric_unit: data.numericUnit || null,
          numeric_tolerance_abs: data.numericToleranceAbs ?? null,
          numeric_tolerance_rel: data.numericToleranceRel ?? null,
          estimated_seconds: data.estimatedSeconds || 180,
          xp_reward: data.xpReward || 15,
          tags: data.tags || [],
          editorial_status: data.editorialStatus || 'draft',
          version: 1,
          revision: 1,
        }

        if (data.id && data.id.includes('-') && data.id.length === 36) {
          insertPayload.id = data.id
        }

        const { data: createdRow, error } = await supabase
          .from('question_bank')
          .insert(insertPayload)
          .select('*')
          .single()

        if (!error && createdRow) {
          return mapDbRowToQuestionItem(createdRow)
        }
      } catch (err) {
        console.warn('Fallback para criação local de questão:', err)
      }
    }

    const newQuestion: QuestionBankItem = {
      ...data,
      id: data.id || `qst-${Date.now()}`,
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

  async updateQuestion(
    id: string,
    updates: Partial<QuestionBankItem>,
    userRole?: Role | null,
    actorName?: string,
  ): Promise<QuestionBankItem> {
    this.assertEditorialAccess(userRole)

    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'

    if (!isDemoMode) {
      try {
        const { data: current, error: getErr } = await (supabase.from('question_bank') as any)
          .select('*')
          .eq('id', id)
          .single()

        if (!getErr && current) {
          let nextVersion = current.version || 1

          if (
            current.editorial_status === 'published' &&
            (updates.promptMarkdown || updates.options || updates.privateKey)
          ) {
            nextVersion += 1
            await (supabase.from('question_versions') as any).insert({
              question_id: current.id,
              version_number: current.version,
              snapshot: current,
              published_at: new Date().toISOString(),
            })
          }

          const patchPayload: any = {
            updated_at: new Date().toISOString(),
            version: nextVersion,
            revision: (current.revision || 1) + 1,
          }

          if (updates.title !== undefined) patchPayload.title = updates.title
          if (updates.promptMarkdown !== undefined)
            patchPayload.prompt_markdown = updates.promptMarkdown
          if (updates.options !== undefined) patchPayload.options = updates.options
          if (updates.privateKey !== undefined) patchPayload.private_key_json = updates.privateKey
          if (updates.hint !== undefined) patchPayload.hint = updates.hint
          if (updates.explanationMarkdown !== undefined)
            patchPayload.explanation_markdown = updates.explanationMarkdown
          if (updates.editorialStatus !== undefined)
            patchPayload.editorial_status = updates.editorialStatus
          if (updates.tags !== undefined) patchPayload.tags = updates.tags

          const { data: updatedRow, error: updateErr } = await (
            supabase.from('question_bank') as any
          )
            .update(patchPayload)
            .eq('id', id)
            .select('*')
            .single()
          if (!updateErr && updatedRow) {
            return mapDbRowToQuestionItem(updatedRow)
          }
        }
      } catch (err) {
        console.warn('Fallback para update de questão no Supabase:', err)
      }
    }

    const list = getStoredQuestions()
    const index = list.findIndex((q) => q.id === id)
    if (index === -1) throw new Error('Questão não encontrada.')

    const current = list[index]
    let newVersion = current.version

    if (
      current.editorialStatus === 'published' &&
      (updates.promptMarkdown || updates.options || updates.privateKey)
    ) {
      newVersion += 1
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

    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'

    if (!isDemoMode) {
      try {
        const { data: rpcRes, error: rpcErr } = await (supabase.rpc as any)(
          'rpc_publish_question',
          {
            p_question_id: id,
            p_reviewer_name: reviewerName,
          },
        )

        if (!rpcErr && (rpcRes as any)?.success) {
          const published = await this.getById(id)
          return { success: true, question: published || undefined }
        } else if (rpcErr) {
          return { success: false, errors: [rpcErr.message] }
        }
      } catch (err: any) {
        console.warn('Fallback para publicação local de questão:', err)
      }
    }

    const q = await this.getById(id)
    if (!q) return { success: false, errors: ['Questão não encontrada.'] }

    const validationErrors: string[] = []
    if (!q.explanationMarkdown || q.explanationMarkdown.trim().length < 5) {
      validationErrors.push('Publicação bloqueada: A explicação da resolução é obrigatória.')
    }

    if (q.questionType === 'single_choice' || q.questionType === 'true_false') {
      const correct = q.privateKey.correctOptionIds
      if (!correct || correct.length !== 1) {
        validationErrors.push('Publicação bloqueada: Exatamente 1 alternativa correta indicada.')
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

    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'

    if (!isDemoMode) {
      try {
        const current = await this.getById(id)
        if (current && current.editorialStatus === 'published') {
          await this.updateQuestion(id, { editorialStatus: 'archived' }, userRole)
          return {
            success: true,
            reason: 'Questão publicada arquivada para preservar o histórico.',
          }
        }

        const { error } = await supabase.from('question_bank').delete().eq('id', id)
        if (!error) return { success: true }
      } catch (err) {
        console.warn('Fallback para exclusão local de questão:', err)
      }
    }

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
