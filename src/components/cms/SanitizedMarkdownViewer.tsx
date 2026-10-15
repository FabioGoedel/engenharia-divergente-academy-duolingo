import React from 'react'

/**
 * Sanitizador seguro de Markdown e suporte a fórmulas matemáticas (estilo KaTeX).
 * Regras estritas:
 * - Proibir <script>, iframe livre, javascript:, inline event handlers (onload, onerror, onclick)
 * - Renderizar notações matemáticas $...$ (inline) e $$...$$ (bloco) de forma legível e sem injeção
 */

export function sanitizeText(raw: string): string {
  if (!raw) return ''
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\bon\w+\s*=/gi, '')
    .replace(/javascript\s*:/gi, '')
}

interface MathFormulaProps {
  math: string
  block?: boolean
}

export const MathFormula: React.FC<MathFormulaProps> = ({ math, block = false }) => {
  // Conversão amigável de comandos LaTeX comuns para símbolos matemáticos e formatação limpa
  const pretty = math
    .replace(/\\sigma/g, 'σ')
    .replace(/\\tau/g, 'τ')
    .replace(/\\epsilon/g, 'ε')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\pi/g, 'π')
    .replace(/\\theta/g, 'θ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\nu/g, 'ν')
    .replace(/\\mu/g, 'μ')
    .replace(/\\infty/g, '∞')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\left|\\right/g, '')

  if (block) {
    return (
      <div className="my-3 overflow-x-auto rounded border border-[#294149] bg-[#0C1317]/80 p-3 font-mono text-sm text-[#01B59A] text-center shadow-inner">
        <span className="select-all tracking-wide">{pretty}</span>
      </div>
    )
  }

  return (
    <span className="mx-1 inline-block rounded bg-[#152228] px-1.5 py-0.5 font-mono text-xs text-[#01B59A] border border-[#294149]/70">
      {pretty}
    </span>
  )
}

interface SanitizedMarkdownViewerProps {
  content: string
  className?: string
}

export const SanitizedMarkdownViewer: React.FC<SanitizedMarkdownViewerProps> = ({
  content,
  className = '',
}) => {
  if (!content) return null

  const cleaned = sanitizeText(content)
  const lines = cleaned.split('\n')

  return (
    <div className={`space-y-2 text-sm leading-relaxed text-[#E6EAED] ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) {
          return <div key={idx} className="h-2" />
        }

        // Títulos Markdown simples
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={idx}
              className="text-base font-semibold text-white pt-2 border-b border-[#294149]/40 pb-1"
            >
              {trimmed.slice(4)}
            </h4>
          )
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3
              key={idx}
              className="text-lg font-bold text-white pt-3 border-b border-[#294149] pb-1"
            >
              {trimmed.slice(3)}
            </h3>
          )
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-xl font-bold text-white pt-3">
              {trimmed.slice(2)}
            </h2>
          )
        }

        // Bloco de fórmula $$...$$
        if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
          const formula = trimmed.slice(2, -2).trim()
          return <MathFormula key={idx} math={formula} block />
        }

        // Lista com marcadores
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-[#01B59A] mt-1 text-xs">•</span>
              <p className="flex-1">{renderInlineMathAndBold(trimmed.slice(2))}</p>
            </div>
          )
        }

        // Parágrafo com inline math
        return <p key={idx}>{renderInlineMathAndBold(line)}</p>
      })}
    </div>
  )
}

function renderInlineMathAndBold(text: string): React.ReactNode {
  // Processa fórmulas inline $...$
  const parts = text.split(/(\$[^$]+\$)/g)
  return parts.map((part, i) => {
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const formula = part.slice(1, -1)
      return <MathFormula key={i} math={formula} />
    }
    // Negrito **texto**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g)
    return (
      <React.Fragment key={i}>
        {boldParts.map((bp, j) => {
          if (bp.startsWith('**') && bp.endsWith('**')) {
            return (
              <strong key={j} className="font-semibold text-white">
                {bp.slice(2, -2)}
              </strong>
            )
          }
          return bp
        })}
      </React.Fragment>
    )
  })
}
