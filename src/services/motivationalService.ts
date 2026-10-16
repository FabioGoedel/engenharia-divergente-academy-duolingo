/**
 * Engenharia Divergente Academy — MotivationalService
 * Fase 5: Conectado ao Supabase real.
 * Gerencia mensagens contextuais com controle de frequência,
 * catálogo de vídeos pedagógicos do Prof. Fábio Goedel vinculados a gatilhos
 * e preferências detalhadas do aluno (pedagógicas separadas de comerciais).
 */

import { supabase } from '@/lib/supabase/client'

export type MotivationalTrigger =
  | 'first_access'
  | 'first_mission'
  | 'goal_reached'
  | 'streak_milestone'
  | 'performance_improved'
  | 'unit_completed'
  | 'level_up'
  | 'repeated_difficulty'
  | 'return_after_inactivity'
  | 'review_completed'
  | 'competency_acquired'
  | 'track_opened'
  | 'pedagogical_guidance'

export interface ContextualMessageConfig {
  id: string
  triggerEvent: MotivationalTrigger
  title: string
  messageText: string
  tone: string
  isActive: boolean
  priority: number
  maxImpressionsPerUser: number
}

export interface MentorVideoConfig {
  id: string
  triggerEvent: MotivationalTrigger
  title: string
  description?: string
  supportMessage: string
  provider: 'youtube' | 'vimeo' | 'cloudflare_stream' | 'supabase_storage'
  videoUrlOrId: string
  thumbnailUrl?: string
  durationSeconds?: number
  priority: number
  isMandatory: boolean
  isActive: boolean
  buttonLabel: string
  relatedProductId?: string
  relatedNodeId?: string
}

export interface StudentPreferences {
  theme: 'dark' | 'light' | 'system'
  reducedMotion: boolean
  dailyGoalMinutes: number
  motivationalMessagesEnabled: boolean
  motivationalFrequency: 'minimal' | 'balanced' | 'frequent'
  pedagogicalNotificationsEnabled: boolean
  soundEffectsEnabled: boolean
  videoAutoplay: boolean
  videoDefaultSpeed: number
  commercialMarketingOptIn: boolean
  partnerOffersOptIn: boolean
}

export const MotivationalService = {
  /**
   * Avalia e seleciona a mensagem contextual mais apropriada para o gatilho,
   * respeitando as preferências do aluno e o limite de impressões.
   */
  async getContextualMessage(
    userId: string,
    trigger: MotivationalTrigger,
  ): Promise<ContextualMessageConfig | null> {
    // 1. Checa preferências do aluno
    const { data: prefRow } = await (supabase as any)
      .from('student_preferences')
      .select('motivational_messages_enabled, motivational_frequency')
      .eq('user_id', userId)
      .maybeSingle()

    if (prefRow && !prefRow.motivational_messages_enabled) {
      return null
    }

    // 2. Busca mensagens ativas para o gatilho
    const { data: messages, error } = await (supabase as any)
      .from('pedagogical_messages_config')
      .select('*')
      .eq('trigger_event', trigger)
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (error || !messages || !messages.length) {
      return null
    }

    // 3. Checa impressões já exibidas para este usuário
    const { data: impressions } = await (supabase as any)
      .from('student_message_impressions')
      .select('message_id')
      .eq('user_id', userId)
      .eq('trigger_event', trigger)

    const impressionCounts = new Map<string, number>()
    for (const imp of (impressions as any[]) || []) {
      impressionCounts.set(imp.message_id, (impressionCounts.get(imp.message_id) || 0) + 1)
    }

    // Seleciona a primeira que ainda não atingiu o limite
    for (const msg of messages) {
      const shownCount = impressionCounts.get(msg.id) || 0
      if (shownCount < msg.max_impressions_per_user) {
        return {
          id: msg.id,
          triggerEvent: msg.trigger_event,
          title: msg.title,
          messageText: msg.message_text,
          tone: msg.tone,
          isActive: msg.is_active,
          priority: msg.priority,
          maxImpressionsPerUser: msg.max_impressions_per_user,
        }
      }
    }

    return null
  },

  /**
   * Registra a impressão de uma mensagem contextual
   */
  async recordMessageImpression(
    userId: string,
    messageId: string,
    trigger: MotivationalTrigger,
  ): Promise<void> {
    await (supabase as any).from('student_message_impressions').insert({
      user_id: userId,
      message_id: messageId,
      trigger_event: trigger,
      shown_at: new Date().toISOString(),
    })
  },

  /**
   * Busca vídeo do mentor Fábio Goedel vinculado a determinado marco pedagógico
   */
  async getMentorVideoForEvent(
    userId: string,
    trigger: MotivationalTrigger,
  ): Promise<MentorVideoConfig | null> {
    const { data: videos, error } = await (supabase as any)
      .from('pedagogical_mentor_videos')
      .select('*')
      .eq('trigger_event', trigger)
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (error || !videos || !videos.length) {
      return null
    }

    // Checa se o aluno já visualizou
    const { data: views } = await (supabase as any)
      .from('student_mentor_video_views')
      .select('video_id, completed')
      .eq('user_id', userId)
      .eq('trigger_event', trigger)

    const completedSet = new Set(
      (views || []).filter((v: any) => v.completed).map((v: any) => v.video_id),
    )

    // Se houver vídeo obrigatório ainda não visto, prioriza
    for (const v of videos) {
      if (v.is_mandatory && !completedSet.has(v.id)) {
        return {
          id: v.id,
          triggerEvent: v.trigger_event,
          title: v.title,
          description: v.description,
          supportMessage: v.support_message,
          provider: v.provider,
          videoUrlOrId: v.video_url_or_id,
          thumbnailUrl: v.thumbnail_url,
          durationSeconds: v.duration_seconds,
          priority: v.priority,
          isMandatory: v.is_mandatory,
          isActive: v.is_active,
          buttonLabel: v.button_label,
          relatedProductId: v.related_product_id,
          relatedNodeId: v.related_node_id,
        }
      }
    }

    // Se não for obrigatório, retorna o primeiro disponível
    const candidate = videos[0]
    return {
      id: candidate.id,
      triggerEvent: candidate.trigger_event,
      title: candidate.title,
      description: candidate.description,
      supportMessage: candidate.support_message,
      provider: candidate.provider,
      videoUrlOrId: candidate.video_url_or_id,
      thumbnailUrl: candidate.thumbnail_url,
      durationSeconds: candidate.duration_seconds,
      priority: candidate.priority,
      isMandatory: candidate.is_mandatory,
      isActive: candidate.is_active,
      buttonLabel: candidate.button_label,
      relatedProductId: candidate.related_product_id,
      relatedNodeId: candidate.related_node_id,
    }
  },

  /**
   * Registra visualização de vídeo do mentor pelo aluno
   */
  async recordMentorVideoView(
    userId: string,
    videoId: string,
    trigger: MotivationalTrigger,
    completed = true,
  ): Promise<void> {
    await (supabase as any).from('student_mentor_video_views').upsert(
      {
        user_id: userId,
        video_id: videoId,
        trigger_event: trigger,
        viewed_at: new Date().toISOString(),
        completed,
      },
      { onConflict: 'user_id,video_id,trigger_event' },
    )

    // Telemetria mínima
    await (supabase as any).from('student_telemetry_events').insert({
      user_id: userId,
      event_type: completed ? 'video_completed' : 'video_viewed',
      entity_id: videoId,
      payload: { trigger, completed },
    })
  },

  /**
   * Carrega preferências completas do aluno
   */
  async getStudentPreferences(userId: string): Promise<StudentPreferences> {
    const { data } = await (supabase as any)
      .from('student_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (!data) {
      return {
        theme: 'dark',
        reducedMotion: false,
        dailyGoalMinutes: 15,
        motivationalMessagesEnabled: true,
        motivationalFrequency: 'balanced',
        pedagogicalNotificationsEnabled: true,
        soundEffectsEnabled: true,
        videoAutoplay: false,
        videoDefaultSpeed: 1.0,
        commercialMarketingOptIn: false,
        partnerOffersOptIn: false,
      }
    }

    return {
      theme: data.theme || 'dark',
      reducedMotion: Boolean(data.reduced_motion),
      dailyGoalMinutes: data.daily_goal_minutes || 15,
      motivationalMessagesEnabled: data.motivational_messages_enabled ?? true,
      motivationalFrequency: data.motivational_frequency || 'balanced',
      pedagogicalNotificationsEnabled: data.pedagogical_notifications_enabled ?? true,
      soundEffectsEnabled: data.sound_effects_enabled ?? true,
      videoAutoplay: Boolean(data.video_autoplay),
      videoDefaultSpeed: Number(data.video_default_speed) || 1.0,
      commercialMarketingOptIn: Boolean(data.commercial_marketing_opt_in),
      partnerOffersOptIn: Boolean(data.partner_offers_opt_in),
    }
  },

  /**
   * Salva preferências do aluno no Supabase
   */
  async saveStudentPreferences(
    userId: string,
    preferences: Partial<StudentPreferences>,
  ): Promise<void> {
    const updatePayload: Record<string, unknown> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    }

    if (preferences.theme !== undefined) updatePayload.theme = preferences.theme
    if (preferences.reducedMotion !== undefined)
      updatePayload.reduced_motion = preferences.reducedMotion
    if (preferences.dailyGoalMinutes !== undefined)
      updatePayload.daily_goal_minutes = preferences.dailyGoalMinutes
    if (preferences.motivationalMessagesEnabled !== undefined)
      updatePayload.motivational_messages_enabled = preferences.motivationalMessagesEnabled
    if (preferences.motivationalFrequency !== undefined)
      updatePayload.motivational_frequency = preferences.motivationalFrequency
    if (preferences.pedagogicalNotificationsEnabled !== undefined)
      updatePayload.pedagogical_notifications_enabled = preferences.pedagogicalNotificationsEnabled
    if (preferences.soundEffectsEnabled !== undefined)
      updatePayload.sound_effects_enabled = preferences.soundEffectsEnabled
    if (preferences.videoAutoplay !== undefined)
      updatePayload.video_autoplay = preferences.videoAutoplay
    if (preferences.videoDefaultSpeed !== undefined)
      updatePayload.video_default_speed = preferences.videoDefaultSpeed
    if (preferences.commercialMarketingOptIn !== undefined)
      updatePayload.commercial_marketing_opt_in = preferences.commercialMarketingOptIn
    if (preferences.partnerOffersOptIn !== undefined)
      updatePayload.partner_offers_opt_in = preferences.partnerOffersOptIn

    const { error } = await (supabase as any)
      .from('student_preferences')
      .upsert(updatePayload, { onConflict: 'user_id' })

    if (error) {
      console.warn('Erro ao salvar preferências:', error)
      throw error
    }
  },

  /**
   * Telemetria mínima e não intrusiva de navegação do aluno
   */
  async recordTelemetry(
    userId: string,
    eventType: string,
    entityId?: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await (supabase as any).from('student_telemetry_events').insert({
        user_id: userId,
        event_type: eventType,
        entity_id: entityId || null,
        payload: payload || {},
      })
    } catch (err) {
      // Telemetria não deve quebrar a UI
      console.warn('Telemetria:', err)
    }
  },

  // FUNÇÕES DE ADMINISTRAÇÃO (RBAC)
  async adminListMentorVideos(): Promise<MentorVideoConfig[]> {
    const { data, error } = await (supabase as any)
      .from('pedagogical_mentor_videos')
      .select('*')
      .order('priority', { ascending: true })
    if (error) throw error
    return (data || []).map((v: any) => ({
      id: v.id,
      triggerEvent: v.trigger_event,
      title: v.title,
      description: v.description,
      supportMessage: v.support_message,
      provider: v.provider,
      videoUrlOrId: v.video_url_or_id,
      thumbnailUrl: v.thumbnail_url,
      durationSeconds: v.duration_seconds,
      priority: v.priority,
      isMandatory: v.is_mandatory,
      isActive: v.is_active,
      buttonLabel: v.button_label,
      relatedProductId: v.related_product_id,
      relatedNodeId: v.related_node_id,
    }))
  },

  async adminSaveMentorVideo(video: MentorVideoConfig): Promise<void> {
    const { error } = await (supabase as any).from('pedagogical_mentor_videos').upsert({
      id: video.id,
      trigger_event: video.triggerEvent,
      title: video.title,
      description: video.description,
      support_message: video.supportMessage,
      provider: video.provider,
      video_url_or_id: video.videoUrlOrId,
      thumbnail_url: video.thumbnailUrl,
      duration_seconds: video.durationSeconds,
      priority: video.priority,
      is_mandatory: video.isMandatory,
      is_active: video.isActive,
      button_label: video.buttonLabel,
      related_product_id: video.relatedProductId || null,
      related_node_id: video.relatedNodeId || null,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
  },

  async adminListMessagesConfig(): Promise<ContextualMessageConfig[]> {
    const { data, error } = await (supabase as any)
      .from('pedagogical_messages_config')
      .select('*')
      .order('priority', { ascending: true })
    if (error) throw error
    return (data || []).map((m: any) => ({
      id: m.id,
      triggerEvent: m.trigger_event,
      title: m.title,
      messageText: m.message_text,
      tone: m.tone,
      isActive: m.is_active,
      priority: m.priority,
      maxImpressionsPerUser: m.max_impressions_per_user,
    }))
  },

  async adminSaveMessageConfig(msg: ContextualMessageConfig): Promise<void> {
    const { error } = await (supabase as any).from('pedagogical_messages_config').upsert({
      id: msg.id,
      trigger_event: msg.triggerEvent,
      title: msg.title,
      message_text: msg.messageText,
      tone: msg.tone,
      is_active: msg.isActive,
      priority: msg.priority,
      max_impressions_per_user: msg.maxImpressionsPerUser,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
  },
}
