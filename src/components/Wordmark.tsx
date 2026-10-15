import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface WordmarkProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  to?: string
}

export const Wordmark: React.FC<WordmarkProps> = ({ className, size = 'md', to = '/app' }) => {
  const content = (
    <div
      className={cn(
        'inline-flex flex-col select-none leading-none tracking-tight font-sans',
        className,
      )}
      aria-label="Engenharia Divergente Academy (Wordmark provisório)"
    >
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            'font-bold tracking-tight text-foreground transition-colors',
            size === 'sm' && 'text-sm',
            size === 'md' && 'text-base',
            size === 'lg' && 'text-2xl',
          )}
        >
          Engenharia
        </span>
        <span
          className={cn(
            'font-extrabold tracking-tight text-[#01B59A] transition-colors',
            size === 'sm' && 'text-sm',
            size === 'md' && 'text-base',
            size === 'lg' && 'text-2xl',
          )}
        >
          Divergente
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        <span
          className={cn(
            'font-semibold uppercase tracking-[0.22em] text-[#A8BBC0] dark:text-[#A8BBC0]',
            size === 'sm' && 'text-[9px]',
            size === 'md' && 'text-[10px]',
            size === 'lg' && 'text-xs',
          )}
        >
          Academy
        </span>
        <span
          className="text-[8px] uppercase tracking-wider font-mono px-1 py-0.2 rounded border border-[#294149] text-muted-foreground"
          title="Wordmark provisório até substituição pelo arquivo oficial PNG"
        >
          Provisório
        </span>
      </div>
    </div>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="inline-block focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
      >
        {content}
      </Link>
    )
  }

  return content
}
