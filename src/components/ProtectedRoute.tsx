import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Role, isAdminRole } from '@/lib/rbac'
import { useToast } from '@/hooks/use-toast'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'student' | Role
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, role, isLoading } = useAuth()
  const location = useLocation()
  const { toast } = useToast()
  const [notified, setNotified] = React.useState(false)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Carregando ambiente...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Checagem de rota editorial (content_editor, admin, super_admin)
  if (
    requiredRole === 'content_editor' &&
    role &&
    role !== 'content_editor' &&
    !isAdminRole(role)
  ) {
    if (!notified) {
      setNotified(true)
      toast({
        variant: 'destructive',
        title: 'Acesso restrito à equipe editorial',
        description: 'Seu papel atual não possui privilégios de edição de conteúdo.',
      })
    }
    return <Navigate to="/app" replace />
  }

  // Checagem de rota administrativa estrita (apenas admin ou super_admin)
  if (requiredRole === 'admin' && role && !isAdminRole(role)) {
    if (!notified) {
      setNotified(true)
      toast({
        variant: 'destructive',
        title: 'Acesso restrito a administradores',
        description:
          'Seu papel atual não possui privilégios de gestão avançada. Redirecionando para o painel.',
      })
    }
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}
