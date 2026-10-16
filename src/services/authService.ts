import { supabase } from '@/lib/supabase/client'
import { DEMO_USERS, UserSession } from '@/data/demoData'
import { Role } from '@/lib/rbac'

const DEMO_SESSION_KEY = 'academy_demo_session'
const AUTH_MODE_KEY = 'academy_auth_mode' // 'real' | 'demo'

export type AuthMode = 'real' | 'demo'

export interface LoginCredentials {
  email: string
  password?: string
  rememberMe?: boolean
}

export interface RegisterData {
  name: string
  email: string
  password: string
  creaNumber?: string
}

export interface ResetPasswordData {
  email: string
}

export interface UpdatePasswordData {
  newPassword: string
}

export interface AuthActionResult<T = void> {
  data?: T
  error?: string | null
}

export const AuthService = {
  /**
   * Identifica o modo de autenticação configurado ou preferido
   */
  getAuthMode(): AuthMode {
    try {
      const mode = localStorage.getItem(AUTH_MODE_KEY)
      return mode === 'demo' ? 'demo' : 'real'
    } catch {
      return 'real'
    }
  },

  setAuthMode(mode: AuthMode): void {
    try {
      localStorage.setItem(AUTH_MODE_KEY, mode)
    } catch {
      // ignore
    }
  },

  /**
   * Obtém a sessão do modo demo isolado em localStorage
   */
  getDemoSession(): UserSession | null {
    try {
      const stored = localStorage.getItem(DEMO_SESSION_KEY)
      if (!stored) return null
      return JSON.parse(stored) as UserSession
    } catch {
      return null
    }
  },

  /**
   * Realiza login no modo de demonstração isolado
   * Contas demo NUNCA tocam a base de dados de produção nem obtêm privilégios reais
   */
  async loginDemo(email: string): Promise<UserSession> {
    const normalizedEmail = email.trim().toLowerCase()
    const user = DEMO_USERS[normalizedEmail]

    if (user) {
      const demoUser: UserSession = { ...user, isDemo: true }
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser))
      this.setAuthMode('demo')
      return demoUser
    }

    // Conta dinâmica gerada para preview
    const dynamicUser: UserSession = {
      id: `usr-demo-${Date.now()}`,
      name: normalizedEmail.split('@')[0].replace('.', ' '),
      email: normalizedEmail,
      role: 'student' as Role,
      headline: 'Engenheiro em Formação Contínua (Modo Demo)',
      streakDays: 1,
      totalXp: 100,
      isDemo: true,
    }

    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(dynamicUser))
    this.setAuthMode('demo')
    return dynamicUser
  },

  /**
   * Carrega perfil e papéis do Supabase para o usuário autenticado
   */
  async fetchRealUserProfile(userId: string): Promise<UserSession | null> {
    try {
      const client = supabase as any
      // 1. Busca perfil em public.profiles
      const { data: profile, error: profileErr } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (profileErr) {
        console.warn('Erro ao carregar public.profiles:', profileErr.message)
      }

      // 2. Busca papéis em public.user_roles
      const { data: rolesData, error: rolesErr } = await client
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)

      if (rolesErr) {
        console.warn('Erro ao carregar public.user_roles:', rolesErr.message)
      }

      // Determina papel com maior privilégio
      const roles = (rolesData || []).map((r: { role: string }) => r.role as Role)
      let resolvedRole: Role = 'student'
      if (roles.includes('super_admin')) {
        resolvedRole = 'super_admin'
      } else if (roles.includes('admin')) {
        resolvedRole = 'admin'
      } else if (roles.includes('content_editor')) {
        resolvedRole = 'content_editor'
      } else if (roles.includes('student')) {
        resolvedRole = 'student'
      }

      const { data: authData } = await supabase.auth.getUser()
      const authUser = authData?.user

      const prof = profile as Record<string, any> | null

      return {
        id: userId,
        name:
          prof?.full_name ||
          authUser?.user_metadata?.full_name ||
          authUser?.email?.split('@')[0] ||
          'Engenheiro',
        email: prof?.email || authUser?.email || '',
        role: resolvedRole,
        avatarUrl: prof?.avatar_url || undefined,
        headline: prof?.headline || 'Membro da Engenharia Divergente Academy',
        creaNumber: prof?.crea_number || undefined,
        streakDays: prof?.streak_days ?? 1,
        totalXp: prof?.total_xp ?? 0,
        isDemo: false,
        emailConfirmed: Boolean(authUser?.email_confirmed_at),
      }
    } catch (err) {
      console.error('Falha ao compor perfil real:', err)
      return null
    }
  },

  /**
   * Login Real via Supabase Auth
   */
  async loginReal({
    email,
    password,
  }: LoginCredentials): Promise<{ user: UserSession | null; error?: string }> {
    if (!password) {
      return { user: null, error: 'A senha é obrigatória para autenticação no banco de produção.' }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        // Registra tentativa com falha em audit_logs se possível
        try {
          const client = supabase as any
          await client.from('audit_logs').insert({
            action: 'auth_failure',
            details: { email: email.trim().toLowerCase(), error: error.message },
          })
        } catch {
          // ignora falha de auditoria para unauthenticated
        }
        return { user: null, error: error.message }
      }

      if (!data.user) {
        return { user: null, error: 'Usuário não retornado pelo servidor de autenticação.' }
      }

      this.setAuthMode('real')
      localStorage.removeItem(DEMO_SESSION_KEY) // limpa demo se estiver entrando em conta real

      const profile = await this.fetchRealUserProfile(data.user.id)
      return { user: profile }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha desconhecida na autenticação.'
      return { user: null, error: msg }
    }
  },

  /**
   * Cadastro Real via Supabase Auth
   */
  async registerReal(
    data: RegisterData,
  ): Promise<{ user: UserSession | null; error?: string; requiresEmailConfirmation?: boolean }> {
    try {
      const email = data.email.trim().toLowerCase()
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            name: data.name,
            crea_number: data.creaNumber || null,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (error) {
        return { user: null, error: error.message }
      }

      const createdUser = signUpData.user
      if (!createdUser) {
        return {
          user: null,
          error: 'Cadastro efetuado, mas os dados do usuário não foram retornados.',
        }
      }

      this.setAuthMode('real')
      localStorage.removeItem(DEMO_SESSION_KEY)

      // Se a confirmação de e-mail estiver ativa no Supabase e email_confirmed_at for nulo
      const requiresConfirmation = !createdUser.email_confirmed_at

      // Tenta carregar o perfil criado pelo trigger
      const profile = await this.fetchRealUserProfile(createdUser.id)

      return {
        user: profile,
        requiresEmailConfirmation: requiresConfirmation,
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar usuário.'
      return { user: null, error: msg }
    }
  },

  /**
   * Envio de link para recuperação de senha
   */
  async sendPasswordResetEmail(email: string): Promise<AuthActionResult> {
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/atualizar-senha`,
      })
      if (error) {
        return { error: error.message }
      }
      return { error: null }
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Erro ao solicitar redefinição.' }
    }
  },

  /**
   * Atualização de senha de usuário autenticado
   */
  async updateUserPassword(newPassword: string): Promise<AuthActionResult> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (error) {
        return { error: error.message }
      }
      return { error: null }
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Erro ao atualizar senha.' }
    }
  },

  /**
   * Atualização de perfil (nome, headline, crea)
   */
  async updateProfile(updates: {
    name?: string
    headline?: string
    creaNumber?: string
  }): Promise<AuthActionResult<UserSession>> {
    const mode = this.getAuthMode()

    if (mode === 'demo') {
      const demo = this.getDemoSession()
      if (!demo) return { error: 'Nenhuma sessão demo ativa.' }
      const updated: UserSession = {
        ...demo,
        ...(updates.name ? { name: updates.name } : {}),
        ...(updates.headline ? { headline: updates.headline } : {}),
        ...(updates.creaNumber !== undefined ? { creaNumber: updates.creaNumber } : {}),
      }
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(updated))
      return { data: updated }
    }

    try {
      const { data: authData } = await supabase.auth.getUser()
      const authUser = authData?.user
      if (!authUser) {
        return { error: 'Sessão expirada ou não autenticado.' }
      }

      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }
      if (updates.name) updatePayload.full_name = updates.name
      if (updates.headline !== undefined) updatePayload.headline = updates.headline
      if (updates.creaNumber !== undefined) updatePayload.crea_number = updates.creaNumber

      const client = supabase as any
      const { error } = await client.from('profiles').update(updatePayload).eq('id', authUser.id)

      if (error) {
        return { error: error.message }
      }

      // Registra no log de auditoria
      try {
        await client.from('audit_logs').insert({
          actor_id: authUser.id,
          action: 'profile_updated',
          target_user_id: authUser.id,
          details: { fields_updated: Object.keys(updates) },
        })
      } catch {
        // non-blocking
      }

      const refreshed = await this.fetchRealUserProfile(authUser.id)
      return { data: refreshed || undefined }
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Falha ao atualizar perfil.' }
    }
  },

  /**
   * Logout geral (limpa sessão Supabase e sessão Demo)
   */
  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
    localStorage.removeItem(DEMO_SESSION_KEY)
  },
}
