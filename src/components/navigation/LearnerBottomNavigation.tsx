import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Compass, Sparkles, BookOpen, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Barra de navegação inferior compacta para smartphones (360px - 430px)
 * 5 destinos principais: Início, Aprender, Revisar, Biblioteca, Progresso
 */
export const LearnerBottomNavigation: React.FC = () => {
  const location = useLocation()

  // Oculta em rotas administrativas e rotas públicas
  const isAdmin = location.pathname.startsWith('/admin')
  const isPublic = ['/', '/login', '/cadastro', '/recuperar-senha'].includes(location.pathname)

  if (isAdmin || isPublic) {
    return null
  }

  const items = [
    { to: '/app', label: 'Início', icon: LayoutDashboard, exact: true },
    { to: '/app/trilhas', label: 'Aprender', icon: Compass },
    { to: '/app/revisar', label: 'Revisar', icon: Sparkles },
    { to: '/app/biblioteca', label: 'Biblioteca', icon: BookOpen },
    { to: '/app/progresso', label: 'Progresso', icon: TrendingUp },
  ]

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-2 py-1.5 flex items-center justify-around select-none shadow-lg"
      aria-label="Navegação inferior móvel"
    >
      {items.map((item) => {
        const Icon = item.icon
        const isActive = item.exact
          ? location.pathname === item.to
          : location.pathname.startsWith(item.to)

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors',
              isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon
              className={cn('h-5 w-5 mb-0.5', isActive ? 'text-primary' : 'text-muted-foreground')}
            />
            <span className="truncate">{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
