import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SidebarNav } from '@/components/SidebarNav'
import { Topbar } from '@/components/Topbar'
import { DemoNoticeBanner } from '@/components/DemoNoticeBanner'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useAuth } from '@/contexts/AuthContext'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  // Telas públicas que não usam sidebar interna
  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/cadastro' ||
    location.pathname === '/recuperar-senha' ||
    location.pathname === '/'

  if (isAuthPage) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors selection:bg-[#01B59A] selection:text-black">
        <DemoNoticeBanner />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors selection:bg-[#01B59A] selection:text-black">
      {/* Banner de Demonstração Global */}
      <DemoNoticeBanner />

      <div className="flex flex-1">
        {/* Sidebar Desktop (>= 1024px) */}
        <aside className="hidden lg:flex lg:w-72 lg:shrink-0 lg:flex-col fixed top-0 bottom-0 left-0 z-40 border-r border-border">
          <SidebarNav />
        </aside>

        {/* Drawer Mobile (<= 1024px) */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-72 bg-[#0C1317] border-r border-[#294149]">
            <SheetTitle className="sr-only">Navegação Principal</SheetTitle>
            <SidebarNav onItemClick={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Área Principal de Conteúdo */}
        <div className="flex flex-1 flex-col lg:pl-72 w-full">
          <Topbar onToggleMobileNav={() => setMobileOpen(true)} />

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-7xl w-full mx-auto fade-in-up">
            <Outlet />
          </main>

          <footer className="border-t border-border/60 py-4 px-4 md:px-8 text-center md:text-right text-xs text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#01B59A]" />
              <span className="font-semibold text-foreground">Engenharia Divergente Academy</span>
              <span>• Fase 1 (Núcleo Seguro & RBAC)</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>Ambiente de Demonstração</span>
              <span>•</span>
              <span className="text-[#C69B4B]">Supabase PENDENTE</span>
              <span>•</span>
              <span>v1.0.0-demo</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
