import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { UserSession } from '@/data/demoData'
import { AuthService, AuthMode, LoginCredentials, RegisterData } from '@/services/authService'
import { Role, isAdminRole, isEditorialRole } from '@/lib/rbac'

interface AuthContextType {
  user: UserSession | null
  supabaseUser: User | null
  session: Session | null
  role: Role | null
  authMode: AuthMode
  isAuthenticated: boolean
  isAdmin: boolean
  isContentEditor: boolean
  isEditorial: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<{ user?: UserSession; error?: string }>
  loginDemo: (email: string) => Promise<UserSession>
  register: (
    data: RegisterData,
  ) => Promise<{ user?: UserSession; error?: string; requiresEmailConfirmation?: boolean }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setAuthMode: (mode: AuthMode) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserSession | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [authMode, setAuthModeState] = useState<AuthMode>(() => AuthService.getAuthMode())
  const [isLoading, setIsLoading] = useState(true)

  // Sincroniza dados do usuário a partir da sessão real ou da demo
  const syncCurrentUser = async (currentSession: Session | null) => {
    try {
      if (currentSession?.user) {
        // Usuário Supabase Autenticado
        setAuthModeState('real')
        const profile = await AuthService.fetchRealUserProfile(currentSession.user.id)
        if (profile) {
          setUser(profile)
          return
        }
      }

      // Se não há sessão Supabase, checa modo demo
      const demo = AuthService.getDemoSession()
      if (demo) {
        setAuthModeState('demo')
        setUser(demo)
      } else {
        setUser(null)
      }
    } catch (err) {
      console.warn('Erro ao sincronizar sessão:', err)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // 1. Ouvinte oficial do Supabase: SÍNCRONO dentro do callback (regra estrita)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setSupabaseUser(newSession?.user ?? null)
      if (newSession?.user) {
        setAuthModeState('real')
      }
    })

    // 2. Leitura inicial assíncrona da sessão
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        setSession(initialSession)
        setSupabaseUser(initialSession?.user ?? null)
        syncCurrentUser(initialSession)
      })
      .catch(() => {
        // Fallback para demo
        const demo = AuthService.getDemoSession()
        if (demo) {
          setUser(demo)
          setAuthModeState('demo')
        }
        setIsLoading(false)
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Quando session mudar (ex.: login/logout via onAuthStateChange), busca perfil
  useEffect(() => {
    if (session?.user) {
      AuthService.fetchRealUserProfile(session.user.id).then((profile) => {
        if (profile) setUser(profile)
      })
    }
  }, [session])

  const setAuthMode = (mode: AuthMode) => {
    AuthService.setAuthMode(mode)
    setAuthModeState(mode)
  }

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    const result = await AuthService.loginReal(credentials)
    setIsLoading(false)
    if (result.user) {
      setUser(result.user)
      setAuthModeState('real')
      return { user: result.user }
    }
    return { error: result.error }
  }

  const loginDemo = async (email: string) => {
    setIsLoading(true)
    const demoUser = await AuthService.loginDemo(email)
    setUser(demoUser)
    setAuthModeState('demo')
    setIsLoading(false)
    return demoUser
  }

  const register = async (data: RegisterData) => {
    setIsLoading(true)
    const result = await AuthService.registerReal(data)
    setIsLoading(false)
    if (result.user) {
      setUser(result.user)
      setAuthModeState('real')
      return {
        user: result.user,
        requiresEmailConfirmation: result.requiresEmailConfirmation,
      }
    }
    return {
      error: result.error,
      requiresEmailConfirmation: result.requiresEmailConfirmation,
    }
  }

  const logout = async () => {
    setIsLoading(true)
    await AuthService.logout()
    setUser(null)
    setSession(null)
    setSupabaseUser(null)
    setIsLoading(false)
  }

  const refreshUser = async () => {
    if (session?.user) {
      const refreshed = await AuthService.fetchRealUserProfile(session.user.id)
      if (refreshed) setUser(refreshed)
    } else {
      const demo = AuthService.getDemoSession()
      setUser(demo)
    }
  }

  const role = user?.role ?? null
  const isAuthenticated = !!user
  const isAdmin = role ? isAdminRole(role) : false
  const isContentEditor = role === 'content_editor'
  const isEditorial = role ? isEditorialRole(role) : false

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        role,
        authMode,
        isAuthenticated,
        isAdmin,
        isContentEditor,
        isEditorial,
        isLoading,
        login,
        loginDemo,
        register,
        logout,
        refreshUser,
        setAuthMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
