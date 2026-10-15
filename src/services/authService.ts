/**
 * Fase 1 — mock Supabase. Trocar por chamadas reais quando o Supabase for conectado.
 * Ponto único de substituição: substituir o backend em localStorage por `supabase.auth.signInWithPassword()`
 * e leitura de perfil na tabela `public.profiles` e `public.user_roles`.
 */

import { DEMO_USERS, UserSession } from '@/data/demoData'
import { Role } from '@/lib/rbac'

const SESSION_KEY = 'academy_demo_session'

export interface LoginCredentials {
  email: string
  password?: string
  rememberMe?: boolean
}

export interface RegisterData {
  name: string
  email: string
  password?: string
  creaNumber?: string
}

export const AuthService = {
  /**
   * Obtém a sessão atual salva em localStorage ou null
   */
  getCurrentSession(): UserSession | null {
    try {
      const stored = localStorage.getItem(SESSION_KEY)
      if (!stored) return null
      return JSON.parse(stored) as UserSession
    } catch {
      return null
    }
  },

  /**
   * Realiza login simulado via contas do dataset demo
   */
  async login({ email }: LoginCredentials): Promise<UserSession> {
    const normalizedEmail = email.trim().toLowerCase()
    const user = DEMO_USERS[normalizedEmail]

    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
      return user
    }

    // Se for outro e-mail válido, cria sessão como aluno demo
    const dynamicUser: UserSession = {
      id: `usr-demo-${Date.now()}`,
      name: normalizedEmail.split('@')[0].replace('.', ' '),
      email: normalizedEmail,
      role: 'student' as Role,
      headline: 'Engenheiro em Formação Contínua',
      streakDays: 1,
      totalXp: 100,
      isDemo: true,
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(dynamicUser))
    return dynamicUser
  },

  /**
   * Cria nova conta de aluno em memória / localStorage
   */
  async register(data: RegisterData): Promise<UserSession> {
    const newUser: UserSession = {
      id: `usr-reg-${Date.now()}`,
      name: data.name,
      email: data.email.trim().toLowerCase(),
      role: 'student',
      headline: 'Engenheiro Cadastrado no Modo Demo',
      creaNumber: data.creaNumber || undefined,
      streakDays: 1,
      totalXp: 50,
      isDemo: true,
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser))
    return newUser
  },

  /**
   * Encerra a sessão
   */
  async logout(): Promise<void> {
    localStorage.removeItem(SESSION_KEY)
  },

  /**
   * Atualiza perfil em memória
   */
  async updateProfile(updates: Partial<UserSession>): Promise<UserSession> {
    const current = this.getCurrentSession()
    if (!current) throw new Error('Nenhuma sessão ativa')
    const updated = { ...current, ...updates }
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
    return updated
  },
}
