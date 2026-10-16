import React from 'react'
import { AlertCircle, Database } from 'lucide-react'
import { DEMO_NOTICE_TEXT, IS_DEMO } from '@/data/demoData'

interface DemoNoticeBannerProps {
  compact?: boolean
}

export const DemoNoticeBanner: React.FC<DemoNoticeBannerProps> = ({ compact = false }) => {
  if (!IS_DEMO) return null

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-500 text-xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        <span className="font-semibold tracking-wider text-[11px] uppercase">
          Modo Demonstração
        </span>
      </div>
    )
  }

  return (
    <div
      role="region"
      aria-label="Aviso de Modo Demonstração"
      className="w-full bg-[#152228] border-b border-[#C69B4B]/30 px-4 py-2 text-xs text-[#A8BBC0] flex items-center justify-between gap-3 shadow-sm"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center h-5 w-5 rounded bg-[#C69B4B]/20 text-[#C69B4B] shrink-0">
          <AlertCircle className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-bold text-[#C69B4B] uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-[#C69B4B]/10 border border-[#C69B4B]/30">
            Ambiente Demonstrativo
          </span>
          <span className="text-muted-foreground">{DEMO_NOTICE_TEXT}</span>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[#A8BBC0] shrink-0 font-mono">
        <Database className="h-3 w-3 text-[#01B59A]" />
        <span>Supabase:</span>
        <span className="text-[#C69B4B] font-semibold">PENDENTE</span>
      </div>
    </div>
  )
}
