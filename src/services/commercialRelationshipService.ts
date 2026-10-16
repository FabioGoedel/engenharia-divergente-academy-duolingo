/**
 * Engenharia Divergente Academy — CommercialRelationshipService (B5)
 *
 * Gestão de ofertas e campanhas comerciais discretas.
 * Regras estritas do Usuário:
 * - NUNCA apresentar oferta de curso/produto que o aluno já possui (entitlement ativo)
 * - Assinatura-base NÃO libera cursos técnicos especializados (regra existente preservada)
 * - NÃO implementar checkout nesta fase: direcionar para contratos/entitlements existentes
 * - NÃO conceder matrícula automática por clique em oferta
 * - Respeitar preferências de comunicação comercial do aluno (commercial_marketing_opt_in)
 * - Registrar visualizações e cliques para métricas de conversão
 */

import { supabase } from '@/lib/supabase/client'
import { MotivationalService } from '@/services/motivationalService'

export interface CommercialCampaign {
  id: string
  title: string
  slug: string
  targetProductId?: string
  targetProductCode: string
  headline: string
  bodyText: string
  bannerPlacement: string
  ctaLabel: string
  ctaUrl: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  priority: number
  startDate: string
  endDate?: string
  maxImpressionsPerStudent: number
  excludeIfAlreadyEntitled: boolean
  requiredPrerequisiteTrackId?: string
  viewsCount?: number
  clicksCount?: number
}

export const CommercialRelationshipService = {
  /**
   * Avalia e seleciona a campanha comercial mais adequada para o aluno
   */
  async getEligibleCampaignForStudent(
    userId: string,
    placement = 'dashboard_contextual',
  ): Promise<CommercialCampaign | null> {
    try {
      // 1. Checa preferências do aluno: respeita opt-out de marketing comercial
      const prefs = await MotivationalService.getStudentPreferences(userId)
      // Se não houver opt-in explícito, respeita postura discreta
      if (!prefs.commercialMarketingOptIn) {
        // Aluno optou por não receber ofertas comerciais
        return null
      }

      // 2. Busca campanhas ativas
      const { data: campaigns, error: campErr } = await (supabase as any)
        .from('commercial_campaigns')
        .select('*')
        .eq('status', 'active')
        .eq('banner_placement', placement)
        .order('priority', { ascending: true })

      if (campErr || !campaigns || campaigns.length === 0) {
        return null
      }

      // 3. Busca entitlements ativos do aluno para EXCLUIR cursos já possuídos
      const { data: entitlements } = await (supabase as any)
        .from('entitlements')
        .select('product_id, products(id, code)')
        .eq('user_id', userId)
        .eq('is_active', true)

      const ownedProductCodes = new Set<string>()
      const ownedProductIds = new Set<string>()

      for (const ent of entitlements || []) {
        if (ent.product_id) ownedProductIds.add(ent.product_id)
        if (ent.products?.code) ownedProductCodes.add(ent.products.code)
      }

      // 4. Busca histórico de impressões desta campanha para este aluno
      const { data: interactions } = await (supabase as any)
        .from('commercial_campaign_interactions')
        .select('campaign_id, interaction_type')
        .eq('user_id', userId)

      const impressionCounts = new Map<string, number>()
      for (const inter of interactions || []) {
        if (inter.interaction_type === 'impression') {
          impressionCounts.set(
            inter.campaign_id,
            (impressionCounts.get(inter.campaign_id) || 0) + 1,
          )
        }
      }

      // 5. Filtra candidatas
      for (const c of campaigns) {
        // Regra: se o aluno já possui o produto e a campanha exclui possuídos, PULA
        if (c.exclude_if_already_entitled) {
          if (ownedProductCodes.has(c.target_product_code)) continue
          if (c.target_product_id && ownedProductIds.has(c.target_product_id)) continue
        }

        // Regra de frequência máxima
        const impressionsSoFar = impressionCounts.get(c.id) || 0
        if (impressionsSoFar >= c.max_impressions_per_student) {
          continue
        }

        return {
          id: c.id,
          title: c.title,
          slug: c.slug,
          targetProductId: c.target_product_id,
          targetProductCode: c.target_product_code,
          headline: c.headline,
          bodyText: c.body_text,
          bannerPlacement: c.banner_placement,
          ctaLabel: c.ctaLabel || c.cta_label,
          ctaUrl: c.ctaUrl || c.cta_url,
          status: c.status,
          priority: c.priority,
          startDate: c.start_date,
          endDate: c.end_date,
          maxImpressionsPerStudent: c.max_impressions_per_student,
          excludeIfAlreadyEntitled: c.exclude_if_already_entitled,
          requiredPrerequisiteTrackId: c.required_prerequisite_track_id,
        }
      }

      return null
    } catch (err) {
      console.warn('Erro ao avaliar elegibilidade de campanha:', err)
      return null
    }
  },

  /**
   * Registra visualização de campanha comercial
   */
  async recordCampaignImpression(campaignId: string, userId: string): Promise<void> {
    try {
      await (supabase as any).from('commercial_campaign_interactions').insert({
        campaign_id: campaignId,
        user_id: userId,
        interaction_type: 'impression',
      })

      // Telemetria isolada
      await (supabase as any).from('student_telemetry_events').insert({
        user_id: userId,
        event_type: 'commercial_campaign_viewed',
        entity_id: campaignId,
      })
    } catch (err) {
      console.warn('Erro ao registrar impressão comercial:', err)
    }
  },

  /**
   * Registra clique de interesse na campanha comercial
   * NÃO concede matrícula automática
   */
  async recordCampaignClick(campaignId: string, userId: string): Promise<void> {
    try {
      await (supabase as any).from('commercial_campaign_interactions').insert({
        campaign_id: campaignId,
        user_id: userId,
        interaction_type: 'click',
      })

      // Telemetria isolada
      await (supabase as any).from('student_telemetry_events').insert({
        user_id: userId,
        event_type: 'commercial_campaign_clicked',
        entity_id: campaignId,
      })
    } catch (err) {
      console.warn('Erro ao registrar clique comercial:', err)
    }
  },

  /**
   * Painel Admin: Lista todas as campanhas com contadores de impressões e cliques
   */
  async adminListCampaigns(): Promise<CommercialCampaign[]> {
    const { data: camps, error } = await (supabase as any)
      .from('commercial_campaigns')
      .select('*')
      .order('priority', { ascending: true })

    if (error || !camps) return []

    // Coleta contadores de interações
    const { data: inters } = await (supabase as any)
      .from('commercial_campaign_interactions')
      .select('campaign_id, interaction_type')

    const stats = new Map<string, { views: number; clicks: number }>()
    for (const i of inters || []) {
      const cur = stats.get(i.campaign_id) || { views: 0, clicks: 0 }
      if (i.interaction_type === 'impression') cur.views++
      if (i.interaction_type === 'click') cur.clicks++
      stats.set(i.campaign_id, cur)
    }

    return camps.map((c: any) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      targetProductId: c.target_product_id,
      targetProductCode: c.target_product_code,
      headline: c.headline,
      bodyText: c.body_text,
      bannerPlacement: c.banner_placement,
      ctaLabel: c.cta_label,
      ctaUrl: c.cta_url,
      status: c.status,
      priority: c.priority,
      startDate: c.start_date,
      endDate: c.end_date,
      maxImpressionsPerStudent: c.max_impressions_per_student,
      excludeIfAlreadyEntitled: c.exclude_if_already_entitled,
      requiredPrerequisiteTrackId: c.required_prerequisite_track_id,
      viewsCount: stats.get(c.id)?.views || 0,
      clicksCount: stats.get(c.id)?.clicks || 0,
    }))
  },

  /**
   * Painel Admin: Cadastra ou edita uma campanha comercial
   */
  async adminSaveCampaign(campaign: Partial<CommercialCampaign>): Promise<void> {
    const payload = {
      id: campaign.id || `camp-${Date.now()}`,
      title: campaign.title,
      slug: campaign.slug,
      target_product_id: campaign.targetProductId || null,
      target_product_code: campaign.targetProductCode,
      headline: campaign.headline,
      body_text: campaign.bodyText,
      banner_placement: campaign.bannerPlacement || 'dashboard_contextual',
      cta_label: campaign.ctaLabel,
      cta_url: campaign.ctaUrl,
      status: campaign.status || 'active',
      priority: campaign.priority || 1,
      max_impressions_per_student: campaign.maxImpressionsPerStudent || 3,
      exclude_if_already_entitled: campaign.excludeIfAlreadyEntitled ?? true,
      required_prerequisite_track_id: campaign.requiredPrerequisiteTrackId || null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await (supabase as any)
      .from('commercial_campaigns')
      .upsert(payload, { onConflict: 'id' })

    if (error) throw error
  },
}
