import React from 'react'
import katex from 'katex'

/**
 * Propriedades para renderização de fórmulas matemáticas
 */
export interface MathProps {
  math: string
  className?: string
  displayMode?: boolean
}

/**
 * Renderizador seguro de fórmulas KaTeX com tratamento de erro
 */
function renderKatexHtml(latex: string, displayMode: boolean): { html: string; isError: boolean } {
  try {
    const html = katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      trust: false, // Proibir comandos HTML/JS arbitrários para segurança total
      strict: false,
      output: 'htmlAndMathml',
    })
    return { html, isError: false }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    // Fallback limpo e legível sem quebrar a tela
    return {
      html: `<span class="katex-fallback text-amber-500 font-mono text-xs px-1 py-0.5 rounded bg-amber-500/10 border border-amber-500/20" title="${escapeHtml(errorMsg)}">${escapeHtml(latex)}</span>`,
      isError: true,
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Componente MathInline para fórmulas inline ($...$ ou \(...\))
 */
export const MathInline: React.FC<MathProps> = ({ math, className = '' }) => {
  const cleanMath = (math || '').trim()
  if (!cleanMath) return null

  const { html, isError } = renderKatexHtml(cleanMath, false)

  return (
    <span
      className={`inline-math-node inline-block align-baseline mx-0.5 select-text ${isError ? 'katex-error' : ''} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/**
 * Componente MathBlock para fórmulas em bloco ($$...$$ ou \[...\])
 */
export const MathBlock: React.FC<MathProps> = ({ math, className = '' }) => {
  const cleanMath = (math || '').trim()
  if (!cleanMath) return null

  const { html, isError } = renderKatexHtml(cleanMath, true)

  return (
    <div
      className={`block-math-node my-3 w-full overflow-x-auto text-center py-2 px-3 rounded-lg bg-card/60 border border-border/40 select-text ${isError ? 'katex-error' : ''} ${className}`}
    >
      <div
        className="inline-block max-w-full text-foreground"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

/**
 * MathFormula retrocompatível com usos existentes
 */
export interface MathFormulaProps {
  math: string
  block?: boolean
  className?: string
}

export const MathFormula: React.FC<MathFormulaProps> = ({
  math,
  block = false,
  className = '',
}) => {
  if (block) {
    return <MathBlock math={math} className={className} />
  }
  return <MathInline math={math} className={className} />
}
