import React, { createContext, useContext, useEffect, useState } from 'react'
import { UserSession } from '@/data/demoData'
import { AuthService, LoginCredentials, RegisterData } from '@/services/authService'
import { Role, isAdminRole } from '@/lib/rbac'

interface AuthContextType {
  user: UserSession | null
  role: Role | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<UserSession>
  register: (data: RegisterData) => Promise<UserSession>
  logout: () => Promise<void>
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = () => {
    const session = AuthService.getCurrentSession()
    setUser(session)
  }

  useEffect(() => {
    refreshUser()
    setIsLoading(false)
  }, [])

  const login = async (credentials: LoginCredentials): Promise<UserSession> => {
    const loggedUser = await AuthService.login(credentials)
    setUser(loggedUser)
    return loggedUser
  }

  const register = async (data: RegisterData): Promise<UserSession> => {
    const registeredUser = await AuthService.register(data)
    setUser(registeredUser)
    return registeredUser
  }

  const logout = async (): Promise<void> => {
    await AuthService.logout()
    setUser(null)
  }

  const role = user?.role ?? null
  const isAuthenticated = !!user
  const isAdmin = role ? isAdminRole(role) : false

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
