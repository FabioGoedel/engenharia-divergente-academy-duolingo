import React from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { Menu, Sun, Moon, LogOut, User as UserIcon, Shield, Layers } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { DemoNoticeBanner } from '@/components/DemoNoticeBanner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  onToggleMobileNav: () => void
}

const ROUTE_TITLES: Record<string, string> = {
  '/app': 'Painel Pessoal',
  '/app/trilhas': 'Trilhas de Aprendizagem',
  '/app/meus-cursos': 'Meus Cursos',
  '/app/progresso': 'Progresso & Competências',
  '/app/conquistas': 'Conquistas & Gamificação',
  '/app/assinatura': 'Assinatura & Entitlements',
  '/app/perfil': 'Meu Perfil',
  '/admin/painel': 'Painel de Controle Administrativo',
  '/admin/alunos': 'Gestão de Alunos',
  '/admin/cursos': 'Catálogo de Cursos & Trilhas',
  '/admin/matriculas': 'Matrículas & Entitlements',
  '/admin/relatorios': 'Relatórios & Roadmap Fase 2',
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileNav }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAdmin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const getPageTitle = () => {
    if (ROUTE_TITLES[location.pathname]) {
      return ROUTE_TITLES[location.pathname]
    }
    if (location.pathname.startsWith('/app/trilhas/')) {
      return 'Mapa Visual da Trilha'
    }
    return 'Engenharia Divergente Academy'
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/90 px-4 md:px-8 backdrop-blur transition-colors">
      <div className="flex items-center gap-3">
        {/* Hamburger mobile */}
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="lg:hidden p-2 rounded-lg text-foreground hover:bg-muted border border-border"
          aria-label="Abrir menu lateral"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base md:text-lg font-bold tracking-tight text-foreground">
            {getPageTitle()}
          </h1>
          <p className="hidden md:block text-[11px] text-muted-foreground font-mono">
            Engenharia Divergente • Ambiente LMS
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Badge Demo Pulsante */}
        <div className="hidden sm:block">
          <DemoNoticeBanner compact />
        </div>

        {/* Alternador de Tema */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 rounded-lg border-border hover:bg-muted"
          title={`Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-[#C69B4B]" />
          ) : (
            <Moon className="h-4 w-4 text-foreground" />
          )}
        </Button>

        {/* Menu do Usuário */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2.5 rounded-full border border-border bg-card p-1 pr-3 hover:bg-muted transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <div className="h-7 w-7 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs">
                  {user.name
                    .split(' ')
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold leading-none text-foreground">
                    {user.name.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-none mt-1">{user.role}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-bold text-foreground leading-none">{user.name}</p>
                  <p className="text-[11px] leading-none text-muted-foreground font-mono">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/app/perfil" className="flex items-center gap-2 cursor-pointer text-xs">
                  <UserIcon className="h-3.5 w-3.5 text-primary" />
                  <span>Perfil & Matrícula</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/app/assinatura"
                  className="flex items-center gap-2 cursor-pointer text-xs"
                >
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>Meus Entitlements</span>
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      to="/admin/painel"
                      className="flex items-center gap-2 cursor-pointer text-xs text-[#C69B4B]"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      <span>Painel Administrativo</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await logout()
                  navigate('/login')
                }}
                className="flex items-center gap-2 cursor-pointer text-xs text-[#C86F63] focus:text-[#C86F63]"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Encerrar sessão demo</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            asChild
            size="sm"
            className="bg-[#01B59A] hover:bg-[#00A88F] text-black font-semibold text-xs"
          >
            <Link to="/login">Entrar</Link>
          </Button>
        )}
      </div>
    </header>
  )
}
