import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Compass,
  Sparkles,
  BookOpen,
  TrendingUp,
  Settings,
  Shield,
  Layers,
  Users,
  Briefcase,
  Sliders,
  LogOut,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Wordmark } from '@/components/Wordmark'
import { cn } from '@/lib/utils'

interface SidebarNavProps {
  onItemClick?: () => void
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ onItemClick }) => {
  const { user, isAdmin, logout } = useAuth()
  const location = useLocation()
  const inAdminRoute = location.pathname.startsWith('/admin')

  // Alternância de modo (Área do Aluno vs Administração)
  const [adminMode, setAdminMode] = useState<boolean>(() => inAdminRoute)
  const [adminSectionOpen, setAdminSectionOpen] = useState({
    conteudos: true,
    gestao: true,
  })

  // 1. Navegação do ALUNO: Estritamente 5 itens prioritários
  const learnerPrimaryNav = [
    { to: '/app', label: 'Início', icon: LayoutDashboard, exact: true },
    { to: '/app/trilhas', label: 'Aprender', icon: Compass },
    { to: '/app/revisar', label: 'Revisar', icon: Sparkles },
    { to: '/app/biblioteca', label: 'Biblioteca', icon: BookOpen },
    { to: '/app/progresso', label: 'Progresso', icon: TrendingUp },
  ]

  // Menus secundários do aluno
  const learnerSecondaryNav = [
    { to: '/app/perfil', label: 'Meu Perfil', icon: Settings },
    { to: '/app/conquistas', label: 'Conquistas & Medalhas', icon: Sparkles },
    { to: '/app/assinatura', label: 'Minha Assinatura', icon: Briefcase },
  ]

  // 2. Navegação ADMINISTRATIVA Agrupada
  const adminOverview = [{ to: '/admin/painel', label: 'Visão Geral', icon: LayoutDashboard }]

  const adminContentGroup = [
    { to: '/admin/trilhas/editor/track-resmat-flexao', label: 'Editor de Trilhas', icon: Compass },
    { to: '/admin/cursos', label: 'Catálogo de Trilhas', icon: BookOpen },
    { to: '/admin/blocos', label: 'Blocos de Conteúdo', icon: Layers },
    { to: '/admin/questoes', label: 'Banco de Questões', icon: Layers },
    { to: '/admin/midia', label: 'Biblioteca de Mídia', icon: BookOpen },
    { to: '/admin/importar', label: 'Importador JSON/ZIP', icon: Layers },
  ]

  const adminManagementGroup = [
    { to: '/admin/alunos', label: 'Gestão de Alunos', icon: Users },
    { to: '/admin/matriculas', label: 'Matrículas', icon: Briefcase },
    { to: '/admin/usuarios', label: 'Controle de Acesso', icon: Shield },
    { to: '/admin/gamificacao', label: 'Gamificação & Mentor', icon: Sparkles },
    { to: '/admin/adaptativo', label: 'Motor Adaptativo', icon: Sliders },
    { to: '/admin/analytics-pedagogico', label: 'Analytics Pedagógico', icon: TrendingUp },
    { to: '/admin/campanhas', label: 'Campanhas Comerciais', icon: Briefcase },
  ]

  return (
    <div className="flex h-full flex-col justify-between bg-card border-r border-border text-foreground w-full select-none">
      {/* Topo: Wordmark limpo sem subtítulo técnico redundante */}
      <div className="px-5 py-5 border-b border-border/60">
        <Wordmark size="md" to="/app" />

        {/* Toggle para Administradores alternarem entre visão de Aluno e Administração */}
        {isAdmin && (
          <div className="mt-4 flex rounded-lg bg-muted p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setAdminMode(false)}
              className={cn(
                'flex-1 py-1 px-2 rounded-md transition-all text-center',
                !adminMode
                  ? 'bg-card text-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Área do Aluno
            </button>
            <button
              type="button"
              onClick={() => setAdminMode(true)}
              className={cn(
                'flex-1 py-1 px-2 rounded-md transition-all text-center',
                adminMode
                  ? 'bg-card text-primary font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Administração
            </button>
          </div>
        )}
      </div>

      {/* Conteúdo de Navegação */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {!adminMode ? (
          /* ================= NAVEGAÇÃO DO ALUNO ================= */
          <div className="space-y-6">
            <nav className="space-y-1">
              {learnerPrimaryNav.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    onClick={onItemClick}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-150',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>

            {/* Acessos Secundários */}
            <div className="pt-4 border-t border-border/40">
              <span className="px-3 text-[10px] uppercase tracking-wider font-mono text-muted-foreground/70 block mb-1">
                Minha Conta
              </span>
              <nav className="space-y-0.5">
                {learnerSecondaryNav.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onItemClick}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors',
                          isActive
                            ? 'text-primary font-semibold bg-primary/5'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                        )
                      }
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          </div>
        ) : (
          /* ================= NAVEGAÇÃO ADMINISTRATIVA ================= */
          <div className="space-y-5 text-xs">
            {/* Visão Geral */}
            <nav className="space-y-0.5">
              {adminOverview.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onItemClick}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors',
                        isActive
                          ? 'bg-primary/15 text-primary font-bold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>

            {/* Grupo Conteúdos */}
            <div>
              <button
                type="button"
                onClick={() => setAdminSectionOpen((p) => ({ ...p, conteudos: !p.conteudos }))}
                className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider"
              >
                <span>Conteúdos & Trilhas</span>
                {adminSectionOpen.conteudos ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
              {adminSectionOpen.conteudos && (
                <nav className="space-y-0.5 mt-1 pl-1">
                  {adminContentGroup.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onItemClick}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors',
                            isActive
                              ? 'text-primary font-semibold bg-primary/10'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                          )
                        }
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    )
                  })}
                </nav>
              )}
            </div>

            {/* Grupo Gestão */}
            <div>
              <button
                type="button"
                onClick={() => setAdminSectionOpen((p) => ({ ...p, gestao: !p.gestao }))}
                className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider"
              >
                <span>Gestão & Comercial</span>
                {adminSectionOpen.gestao ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
              {adminSectionOpen.gestao && (
                <nav className="space-y-0.5 mt-1 pl-1">
                  {adminManagementGroup.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onItemClick}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors',
                            isActive
                              ? 'text-primary font-semibold bg-primary/10'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                          )
                        }
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    )
                  })}
                </nav>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cartão de Usuário Inferior */}
      <div className="p-3 border-t border-border bg-card">
        {user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 px-1">
              <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                {user.name
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{user.totalXp} XP</p>
              </div>
            </div>

            <button
              onClick={() => {
                logout()
                if (onItemClick) onItemClick()
              }}
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg border border-border transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
