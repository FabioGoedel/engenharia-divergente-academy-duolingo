import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Compass,
  GraduationCap,
  Award,
  TrendingUp,
  CreditCard,
  User as UserIcon,
  ShieldCheck,
  Users,
  BookOpen,
  FileSpreadsheet,
  BarChart3,
  LogOut,
  Sparkles,
  Boxes,
  HelpCircle,
  FolderOpen,
  FileCheck,
  UploadCloud,
  Wand2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Wordmark } from '@/components/Wordmark'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface SidebarNavProps {
  onItemClick?: () => void
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ onItemClick }) => {
  const { user, isAdmin, isEditorial, logout } = useAuth()

  const studentLinks = [
    { to: '/app', label: 'Painel Pessoal', icon: LayoutDashboard, exact: true },
    { to: '/app/trilhas', label: 'Trilhas de Engenharia', icon: Compass },
    { to: '/app/meus-cursos', label: 'Meus Cursos', icon: GraduationCap },
    { to: '/app/biblioteca', label: 'Biblioteca & Materiais', icon: BookOpen },
    { to: '/app/progresso', label: 'Competências & Horas', icon: TrendingUp },
    { to: '/app/conquistas', label: 'Conquistas & XP', icon: Award },
    { to: '/app/assinatura', label: 'Assinatura & Acessos', icon: CreditCard },
    { to: '/app/perfil', label: 'Meu Perfil', icon: UserIcon },
  ]

  // Módulos editoriais (Fase 2) — acessíveis por content_editor, admin, super_admin
  const editorialLinks = [
    { to: '/admin/blocos', label: 'Biblioteca de Blocos', icon: Boxes },
    { to: '/admin/questoes', label: 'Banco de Questões', icon: HelpCircle },
    { to: '/admin/gerador-ia', label: 'Apoio IA & Schemas', icon: Wand2 },
    { to: '/admin/midia', label: 'Biblioteca de Mídia', icon: FolderOpen },
    { to: '/admin/revisao', label: 'Revisão Editorial', icon: FileCheck },
  ]

  // Gestão executiva — restrita a admin e super_admin (content_editor NÃO acessa)
  const adminLinks = [
    {
      to: '/admin/trilhas/editor/track-resmat-flexao',
      label: 'Editor Visual de Trilhas',
      icon: Sparkles,
    },
    { to: '/admin/usuarios', label: 'Usuários & RBAC', icon: ShieldCheck },
    { to: '/admin/cursos', label: 'Cursos & Trilhas', icon: BookOpen },
    { to: '/admin/importar', label: 'Importação em Massa', icon: UploadCloud },
    { to: '/admin/painel', label: 'Painel Admin', icon: BarChart3 },
    { to: '/admin/alunos', label: 'Gestão de Alunos', icon: Users },
    { to: '/admin/matriculas', label: 'Matrículas & Entitlements', icon: FileSpreadsheet },
    { to: '/admin/gamificacao', label: 'Gamificação & Mentor', icon: Award },
    { to: '/admin/relatorios', label: 'Relatórios & Roadmap', icon: ShieldCheck },
  ]

  return (
    <div className="flex h-full flex-col justify-between bg-[#0C1317] border-r border-[#294149] text-[#E6EAED] w-full">
      {/* Topo / Wordmark */}
      <div className="px-6 py-6 border-b border-[#294149]/60">
        <Wordmark size="md" to="/app" />
        <p className="mt-2 text-[11px] text-[#A8BBC0] leading-snug">
          LMS Multimaterial para Engenharia
        </p>
      </div>

      {/* Navegação Principal */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Grupo Aluno */}
        <div>
          <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#A8BBC0]/70 flex items-center justify-between">
            <span>Área do Aluno</span>
            {user?.streakDays ? (
              <span className="flex items-center gap-1 text-[#01B59A] font-mono text-[10px] lowercase">
                <Sparkles className="h-3 w-3" />
                {user.streakDays}d streak
              </span>
            ) : null}
          </div>
          <nav className="space-y-1">
            {studentLinks.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={onItemClick}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                      isActive
                        ? 'bg-[#152228] text-white border-l-2 border-[#01B59A] pl-[10px] shadow-sm'
                        : 'text-[#A8BBC0] hover:text-white hover:bg-[#152228]/50',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive ? 'text-[#01B59A]' : 'text-[#A8BBC0] group-hover:text-white',
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Grupo Editorial / CMS (Fase 2: content_editor, admin, super_admin) */}
        {isEditorial && (
          <div className="pt-2 border-t border-[#294149]/40">
            <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#01B59A] flex items-center justify-between">
              <span>CMS & Conteúdo</span>
              <Badge
                variant="outline"
                className="text-[9px] border-[#01B59A]/40 text-[#01B59A] px-1 py-0"
              >
                Fase 2
              </Badge>
            </div>
            <nav className="space-y-1">
              {editorialLinks.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onItemClick}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                        isActive
                          ? 'bg-[#152228] text-white border-l-2 border-[#01B59A] pl-[10px] shadow-sm'
                          : 'text-[#A8BBC0] hover:text-white hover:bg-[#152228]/50',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-colors',
                            isActive ? 'text-[#01B59A]' : 'text-[#A8BBC0] group-hover:text-white',
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>
        )}

        {/* Grupo Gestão Administrativa (Apenas admin e super_admin — content_editor bloqueado) */}
        {isAdmin && (
          <div className="pt-2 border-t border-[#294149]/40">
            <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#C69B4B] flex items-center justify-between">
              <span>Administração</span>
              <Badge
                variant="outline"
                className="text-[9px] border-[#C69B4B]/40 text-[#C69B4B] px-1 py-0"
              >
                RBAC Ativo
              </Badge>
            </div>
            <nav className="space-y-1">
              {adminLinks.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onItemClick}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                        isActive
                          ? 'bg-[#152228] text-white border-l-2 border-[#C69B4B] pl-[10px] shadow-sm'
                          : 'text-[#A8BBC0] hover:text-white hover:bg-[#152228]/50',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-colors',
                            isActive ? 'text-[#C69B4B]' : 'text-[#A8BBC0] group-hover:text-white',
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Cartão de Usuário Inferior */}
      <div className="p-4 border-t border-[#294149] bg-[#0C1317]">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#152228] border border-[#01B59A]/40 flex items-center justify-center font-bold text-xs text-[#01B59A] shrink-0">
                {user.name
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={cn(
                      'text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded font-mono',
                      isAdmin
                        ? 'bg-[#C69B4B]/20 text-[#C69B4B] border border-[#C69B4B]/30'
                        : 'bg-[#01B59A]/20 text-[#01B59A] border border-[#01B59A]/30',
                    )}
                  >
                    {user.role}
                  </span>
                  <span className="text-[10px] text-[#A8BBC0] truncate font-mono">
                    {user.totalXp} XP
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                logout()
                if (onItemClick) onItemClick()
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-[#A8BBC0] hover:text-[#C86F63] hover:bg-[#152228] rounded border border-[#294149] transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair da conta</span>
            </button>
          </div>
        ) : (
          <div className="text-xs text-center text-[#A8BBC0]">
            <p>Nenhuma sessão ativa</p>
          </div>
        )}
      </div>
    </div>
  )
}
