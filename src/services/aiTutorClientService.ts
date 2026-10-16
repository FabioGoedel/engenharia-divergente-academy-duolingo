/**
 * Engenharia Divergente Academy — AiTutorClientService (B3)
 *
 * Cliente de interface com o Tutor de IA Server-Side.
 * Respeita regras:
 * - Se provedor indisponível ou sem chave (OPENAI_API_KEY), exibe estado REAL de indisponibilidade
 * - NUNCA simula respostas de mentira apresentadas como IA real
 * - Modos pedagógicos: study_mode, hint_mode, assessment_mode, post_answer_review
 * - Registro de telemetria e controle de limites
 */

import { supabase } from '@/lib/supabase/client'

export type TutorPedagogicalMode =
  | 'study_mode'
  | 'hint_mode'
  | 'assessment_mode'
  | 'post_answer_review'

export interface AiTutorStatus {
  available: boolean
  isBlockedByCredentials?: boolean
  reason?: string
  provider?: string
  model?: string
  disclaimer?: string
  quotaExceeded?: boolean
}

export interface AiTutorResponse {
  available: boolean
  response?: string
  reason?: string
  mode?: TutorPedagogicalMode
  disclaimer?: string
  tokensUsed?: number
  quotaExceeded?: boolean
}

export interface AiTutorConfigData {
  id: string
  provider: string
  modelName: string
  isEnabled: boolean
  maxQuestionsPerStudentPerDay: number
  pedagogicalInstructions: string
  prohibitedTopics: string[]
  costPer1kTokensCents: number
  totalTokensConsumed: number
  totalRequestsCount: number
}

export const AiTutorClientService = {
  /**
   * Consulta o status do Tutor de IA sem enviar pergunta
   */
  async checkTutorAvailability(): Promise<AiTutorStatus> {
    try {
      const { data: config } = await (supabase as any)
        .from('ai_tutor_config')
        .select('*')
        .eq('id', 'default_tutor_config')
        .maybeSingle()

      if (!config || !config.is_enabled) {
        return {
          available: false,
          isBlockedByCredentials: false,
          reason: 'O Tutor de IA está temporariamente desativado no painel administrativo.',
          provider: config?.provider || 'openai',
          model: config?.model_name || 'gpt-4o-mini',
          disclaimer:
            'A Engenharia Divergente prioriza conteúdo editorialmente validado por engenheiros calculistas.',
        }
      }

      // Testa a Edge Function para checar se a chave do provedor existe no ambiente
      const { data, error } = await supabase.functions.invoke('ai-tutor', {
        body: { studentQuestion: 'status_check' },
      })

      if (error) {
        return {
          available: false,
          reason: `Serviço do Tutor indisponível (${error.message}).`,
        }
      }

      return {
        available: Boolean(data?.available),
        isBlockedByCredentials: Boolean(data?.isBlockedByCredentials),
        reason: data?.reason,
        provider: data?.provider || config.provider,
        model: data?.model || config.model_name,
        disclaimer: data?.disclaimer,
      }
    } catch (err: any) {
      return {
        available: false,
        reason: err?.message || 'Falha ao verificar status do Tutor de IA.',
      }
    }
  },

  /**
   * Envia uma consulta pedagógica ao Tutor de IA
   */
  async askTutor(params: {
    exerciseId?: string
    competencyCode?: string
    studentQuestion: string
    mode?: TutorPedagogicalMode
    assistanceStage?: string
  }): Promise<AiTutorResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-tutor', {
        body: {
          exerciseId: params.exerciseId,
          competencyCode: params.competencyCode,
          studentQuestion: params.studentQuestion,
          mode: params.mode || 'study_mode',
          assistanceStage: params.assistanceStage,
        },
      })

      if (error) {
        return {
          available: false,
          reason: `Erro no servidor do tutor: ${error.message}`,
        }
      }

      return data as AiTutorResponse
    } catch (err: any) {
      return {
        available: false,
        reason: err?.message || 'Falha na comunicação com o servidor de inteligência pedagógica.',
      }
    }
  },

  /**
   * Lista o histórico de conversas do aluno para consulta
   */
  async getStudentConversationHistory(
    userId: string,
    limit = 10,
  ): Promise<
    Array<{
      id: string
      exerciseId?: string
      competencyCode?: string
      mode: string
      promptMessage: string
      responseMessage: string
      createdAt: string
    }>
  > {
    const { data, error } = await (supabase as any)
      .from('ai_tutor_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return data.map((d: any) => ({
      id: d.id,
      exerciseId: d.exercise_id,
      competencyCode: d.competency_code,
      mode: d.mode,
      promptMessage: d.prompt_message,
      responseMessage: d.response_message,
      createdAt: d.created_at,
    }))
  },

  /**
   * Painel Admin: Consulta a configuração global do Tutor
   */
  async adminGetConfig(): Promise<AiTutorConfigData> {
    const { data, error } = await (supabase as any)
      .from('ai_tutor_config')
      .select('*')
      .eq('id', 'default_tutor_config')
      .maybeSingle()

    if (error || !data) {
      return {
        id: 'default_tutor_config',
        provider: 'openai',
        modelName: 'gpt-4o-mini',
        isEnabled: false,
        maxQuestionsPerStudentPerDay: 25,
        pedagogicalInstructions: 'Você é o Tutor de IA da Engenharia Divergente Academy...',
        prohibitedTopics: ['revelar_gabarito'],
        costPer1kTokensCents: 2,
        totalTokensConsumed: 0,
        totalRequestsCount: 0,
      }
    }

    return {
      id: data.id,
      provider: data.provider,
      modelName: data.model_name,
      isEnabled: Boolean(data.is_enabled),
      maxQuestionsPerStudentPerDay: data.max_questions_per_student_per_day || 25,
      pedagogicalInstructions: data.pedagogical_instructions || '',
      prohibitedTopics: data.prohibited_topics || [],
      costPer1kTokensCents: data.cost_per_1k_tokens_cents || 2,
      totalTokensConsumed: Number(data.total_tokens_consumed) || 0,
      totalRequestsCount: Number(data.total_requests_count) || 0,
    }
  },

  /**
   * Painel Admin: Salva a configuração global do Tutor
   */
  async adminSaveConfig(config: Partial<AiTutorConfigData>): Promise<void> {
    const payload = {
      id: 'default_tutor_config',
      provider: config.provider,
      model_name: config.modelName,
      is_enabled: config.isEnabled,
      max_questions_per_student_per_day: config.maxQuestionsPerStudentPerDay,
      pedagogical_instructions: config.pedagogicalInstructions,
      prohibited_topics: config.prohibitedTopics,
      cost_per_1k_tokens_cents: config.costPer1kTokensCents,
      updated_at: new Date().toISOString(),
    }

    const { error } = await (supabase as any)
      .from('ai_tutor_config')
      .upsert(payload, { onConflict: 'id' })

    if (error) throw error
  },
}
