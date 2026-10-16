import { supabase } from '@/lib/supabase/client'
import { Role } from '@/lib/rbac'

export interface ManagedUser {
  id: string
  fullName: string
  email: string
  creaNumber?: string
  headline?: string
  totalXp: number
  streakDays: number
  createdAt: string
  roles: Role[]
  isCurrentUser: boolean
}

export interface AuditLogItem {
  id: string
  actorId?: string
  actorEmail?: string
  action: string
  targetUserId?: string
  targetEmail?: string
  details: Record<string, unknown>
  createdAt: string
}

export const UserManagementService = {
  /**
   * Lista todos os usuários cadastrados em public.profiles com seus papéis
   */
  async listUsers(): Promise<{ users: ManagedUser[]; error?: string }> {
    try {
      const client = supabase as any
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      // 1. Busca perfis
      const { data: profiles, error: pError } = await client
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (pError) {
        return { users: [], error: pError.message }
      }

      // 2. Busca papéis de todos os usuários
      const { data: userRoles, error: rError } = await client
        .from('user_roles')
        .select('user_id, role')

      if (rError) {
        return { users: [], error: rError.message }
      }

      const rolesByUserId = new Map<string, Role[]>()
      for (const ur of (userRoles || []) as Array<{ user_id: string; role: Role }>) {
        const list = rolesByUserId.get(ur.user_id) || []
        list.push(ur.role)
        rolesByUserId.set(ur.user_id, list)
      }

      const users: ManagedUser[] = ((profiles || []) as Array<Record<string, any>>).map((p) => ({
        id: p.id,
        fullName: p.full_name || 'Sem nome',
        email: p.email,
        creaNumber: p.crea_number || undefined,
        headline: p.headline || undefined,
        totalXp: p.total_xp || 0,
        streakDays: p.streak_days || 0,
        createdAt: p.created_at,
        roles: rolesByUserId.get(p.id) || ['student'],
        isCurrentUser: currentUser?.id === p.id,
      }))

      return { users }
    } catch (err: unknown) {
      return { users: [], error: err instanceof Error ? err.message : 'Falha ao buscar usuários.' }
    }
  },

  /**
   * Atribui um papel a um usuário chamando a procedure segura do banco
   */
  async assignRole(
    targetUserId: string,
    newRole: Role,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const client = supabase as any
      const { error } = await client.rpc('admin_assign_role', {
        p_target_user_id: targetUserId,
        p_new_role: newRole,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Falha ao atribuir papel.',
      }
    }
  },

  /**
   * Revoga um papel chamando a procedure segura do banco
   */
  async revokeRole(
    targetUserId: string,
    roleToRevoke: Role,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const client = supabase as any
      const { error } = await client.rpc('admin_revoke_role', {
        p_target_user_id: targetUserId,
        p_role_to_revoke: roleToRevoke,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Falha ao revogar papel.',
      }
    }
  },

  /**
   * Busca registros de auditoria com minimização e LGPD
   */
  async listAuditLogs(limit = 50): Promise<{ logs: AuditLogItem[]; error?: string }> {
    try {
      const client = supabase as any
      const { data, error } = await client
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        return { logs: [], error: error.message }
      }

      // Mapeia perfis para enriquecer IDs com e-mails
      const userIds = new Set<string>()
      for (const item of (data || []) as Array<{ actor_id?: string; target_user_id?: string }>) {
        if (item.actor_id) userIds.add(item.actor_id)
        if (item.target_user_id) userIds.add(item.target_user_id)
      }

      let emailMap = new Map<string, string>()
      if (userIds.size > 0) {
        const { data: profs } = await client
          .from('profiles')
          .select('id, email')
          .in('id', Array.from(userIds))

        emailMap = new Map(
          ((profs || []) as Array<{ id: string; email: string }>).map((p) => [p.id, p.email]),
        )
      }

      const logs: AuditLogItem[] = ((data || []) as Array<Record<string, any>>).map((l) => ({
        id: l.id,
        actorId: l.actor_id || undefined,
        actorEmail: l.actor_id ? emailMap.get(l.actor_id) || 'Sistema' : 'Sistema',
        action: l.action,
        targetUserId: l.target_user_id || undefined,
        targetEmail: l.target_user_id ? emailMap.get(l.target_user_id) || 'N/A' : 'N/A',
        details: l.details || {},
        createdAt: l.created_at,
      }))

      return { logs }
    } catch (err: unknown) {
      return {
        logs: [],
        error: err instanceof Error ? err.message : 'Falha ao carregar auditoria.',
      }
    }
  },
}
