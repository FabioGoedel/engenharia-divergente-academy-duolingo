import { supabase } from '@/lib/supabase/client'
import { Role } from '@/lib/rbac'

export interface ManagedEnrollment {
  id: string
  userId: string
  studentName: string
  studentEmail: string
  productId: string
  productCode: string
  productTitle: string
  tier: string
  status: 'active' | 'completed' | 'suspended' | 'expired'
  progressPercent: number
  startedAt: string
  completedAt?: string
  validFrom?: string
  validUntil?: string
  isEntitlementActive: boolean
}

export interface EnrollmentAuditLog {
  id: string
  actorId?: string
  targetUserId: string
  productId: string
  action: string
  reason?: string
  previousStatus?: string
  newStatus?: string
  createdAt: string
}

export interface CourseProductOption {
  id: string
  code: string
  title: string
  slug: string
  tier: string
  isIncludedInBaseSub: boolean
}

export const EnrollmentService = {
  assertAdminAccess(role?: Role | null): void {
    if (!role || (role !== 'admin' && role !== 'super_admin')) {
      throw new Error('Acesso negado: privilégios de administrador necessários.')
    }
  },

  async listProducts(): Promise<CourseProductOption[]> {
    const { data, error } = await supabase
      .from('products')
      .select('id, code, title, slug, tier, is_included_in_base_sub')
      .order('code', { ascending: true })

    if (error) {
      console.warn('Erro ao carregar produtos do Supabase:', error)
      return []
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      slug: p.slug,
      tier: p.tier,
      isIncludedInBaseSub: Boolean(p.is_included_in_base_sub),
    }))
  },

  async listEnrollments(): Promise<ManagedEnrollment[]> {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        product_id,
        status,
        progress_percent,
        started_at,
        completed_at,
        profiles:user_id (id, full_name, email),
        products:product_id (id, code, title, tier, is_included_in_base_sub)
      `)
      .order('started_at', { ascending: false })

    if (error) {
      console.warn('Falha ao listar matrículas do Supabase:', error)
      return []
    }

    // Carrega entitlements para casar valid_until
    const { data: entitlements } = await supabase
      .from('entitlements')
      .select('user_id, product_id, is_active, valid_from, valid_until')

    const entMap = new Map<string, any>()
    ;(entitlements || []).forEach((e: any) => {
      entMap.set(`${e.user_id}_${e.product_id}`, e)
    })

    return (data || []).map((row: any) => {
      const entKey = `${row.user_id}_${row.product_id}`
      const ent = entMap.get(entKey)

      const profile = row.profiles || {}
      const product = row.products || {}

      let status = row.status
      if (ent && ent.valid_until && new Date(ent.valid_until) < new Date()) {
        status = 'expired'
      }

      return {
        id: row.id,
        userId: row.user_id,
        studentName: profile.full_name || 'Aluno',
        studentEmail: profile.email || '—',
        productId: row.product_id,
        productCode: product.code || '—',
        productTitle: product.title || 'Curso',
        tier: product.tier || 'technical_extension',
        status,
        progressPercent: row.progress_percent || 0,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        validFrom: ent?.valid_from,
        validUntil: ent?.valid_until,
        isEntitlementActive: Boolean(ent?.is_active),
      }
    })
  },

  async grantManualEnrollment(params: {
    userId: string
    productId: string
    validUntil?: string | null
    reason?: string
    userRole?: Role | null
  }): Promise<{ success: boolean; message: string }> {
    this.assertAdminAccess(params.userRole)

    const { data, error } = await (supabase.rpc as any)('admin_grant_enrollment', {
      p_user_id: params.userId,
      p_product_id: params.productId,
      p_valid_until: params.validUntil || null,
      p_reason: params.reason || 'Concessão manual via painel de administração',
    })

    if (error) {
      throw new Error(`Falha ao conceder matrícula: ${error.message}`)
    }

    return {
      success: true,
      message: data?.message || 'Matrícula e direito concedidos com sucesso.',
    }
  },

  async revokeEnrollment(params: {
    userId: string
    productId: string
    reason: string
    userRole?: Role | null
  }): Promise<{ success: boolean; message: string }> {
    this.assertAdminAccess(params.userRole)

    const { data, error } = await (supabase.rpc as any)('admin_revoke_enrollment', {
      p_user_id: params.userId,
      p_product_id: params.productId,
      p_reason: params.reason || 'Revogação manual via painel',
    })

    if (error) {
      throw new Error(`Falha ao revogar matrícula: ${error.message}`)
    }

    return {
      success: true,
      message: data?.message || 'Matrícula revogada com sucesso.',
    }
  },

  async getAuditHistory(userId?: string): Promise<EnrollmentAuditLog[]> {
    let query = (supabase as any)
      .from('enrollment_audit_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (userId) {
      query = query.eq('target_user_id', userId)
    }

    const { data, error } = await query
    if (error) {
      console.warn('Erro ao consultar histórico de auditoria:', error)
      return []
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      actorId: row.actor_id,
      targetUserId: row.target_user_id,
      productId: row.product_id,
      action: row.action,
      reason: row.reason,
      previousStatus: row.previous_status,
      newStatus: row.new_status,
      createdAt: row.created_at,
    }))
  },

  /**
   * Verifica se o aluno logado possui acesso ativo a um produto
   */
  async checkUserProductAccess(productId: string): Promise<boolean> {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) return false

    const { data, error } = await (supabase.rpc as any)('has_entitlement', {
      user_uid: user.id,
      prod_id: productId,
    })

    if (error) return false
    return Boolean(data)
  },
}
