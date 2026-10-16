import React from 'react'
import { MathInline, MathBlock, MathFormula } from '@/components/math/MathRenderer'

export { MathInline, MathBlock, MathFormula }

/**
 * Sanitiza textos removendo scripts e manipuladores de eventos perigosos.
 */
export function sanitizeText(raw: string): string {
  if (!raw) return ''
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\bon\w+\s*=/gi, '')
    .replace(/javascript\s*:/gi, '')
}

interface SanitizedMarkdownViewerProps {
  content: string
  className?: string
}

/**
 * Tokeniza texto identificando blocos LaTeX e inline LaTeX respeitando delimitadores:
 * - $$...$$ (bloco)
 * - \[...\] (bloco)
 * - $...$ (inline)
 * - \(...\) (inline)
 */
export const SanitizedMarkdownViewer: React.FC<SanitizedMarkdownViewerProps> = ({
  content,
  className = '',
}) => {
  if (!content) return null

  const cleaned = sanitizeText(content)

  // 1. Processamento de blocos matemáticos multi-linha $$...$$ ou \[...\]
  // Dividimos os blocos e parágrafos
  const blocks = splitIntoBlocks(cleaned)

  return (
    <div className={`space-y-3 text-sm leading-relaxed text-foreground select-text ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === 'math_block') {
          return <MathBlock key={idx} math={block.content} />
        }

        const trimmed = block.content.trim()
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />
        }

        // Títulos Markdown
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={idx}
              className="text-base font-semibold text-foreground pt-2 border-b border-border/40 pb-1"
            >
              {renderInlineContent(trimmed.slice(4))}
            </h4>
          )
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3
              key={idx}
              className="text-lg font-bold text-foreground pt-3 border-b border-border pb-1"
            >
              {renderInlineContent(trimmed.slice(3))}
            </h3>
          )
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-xl font-bold text-foreground pt-3">
              {renderInlineContent(trimmed.slice(2))}
            </h2>
          )
        }

        // Lista com marcadores
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-primary mt-1 text-xs">•</span>
              <div className="flex-1">{renderInlineContent(trimmed.slice(2))}</div>
            </div>
          )
        }

        // Parágrafo comum
        return <p key={idx}>{renderInlineContent(block.content)}</p>
      })}
    </div>
  )
}

interface BlockItem {
  type: 'text' | 'math_block'
  content: string
}

function splitIntoBlocks(text: string): BlockItem[] {
  const result: BlockItem[] = []
  // Regex para encontrar $$...$$ ou \[...\]
  const blockRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = blockRegex.exec(text)) !== null) {
    const textBefore = text.slice(lastIndex, match.index)
    if (textBefore) {
      // Divide textBefore em linhas/parágrafos
      const paragraphs = textBefore.split(/\n{2,}/)
      for (const p of paragraphs) {
        if (p.trim()) {
          result.push({ type: 'text', content: p.trim() })
        }
      }
    }

    const matchedStr = match[0]
    let latex = ''
    if (matchedStr.startsWith('$$') && matchedStr.endsWith('$$')) {
      latex = matchedStr.slice(2, -2).trim()
    } else if (matchedStr.startsWith('\\[') && matchedStr.endsWith('\\]')) {
      latex = matchedStr.slice(2, -2).trim()
    }
    result.push({ type: 'math_block', content: latex })

    lastIndex = match.index + matchedStr.length
  }

  const remaining = text.slice(lastIndex)
  if (remaining) {
    const paragraphs = remaining.split(/\n{2,}/)
    for (const p of paragraphs) {
      if (p.trim()) {
        result.push({ type: 'text', content: p.trim() })
      }
    }
  }

  return result
}

/**
 * Renderiza o conteúdo inline, tratando:
 * - $...$ e \(...\) como fórmulas matemáticas
 * - **...** como negrito
 * - *...* como itálico
 * - `...` como código inline
 */
function renderInlineContent(text: string): React.ReactNode {
  // Regex para encontrar $...$ ou \(...\)
  // Cuidados: $ não deve casar se for escape (\$); não deve casar cifrão avulso
  const inlineMathRegex = /(\$(?!\s)[^$\n]+(?<!\s)\$|\\\([^\n]+?\\\))/g

  const segments = text.split(inlineMathRegex)

  return segments.map((seg, i) => {
    if (!seg) return null

    // Inline math $...$
    if (seg.startsWith('$') && seg.endsWith('$') && seg.length > 2) {
      const latex = seg.slice(1, -1)
      return <MathInline key={i} math={latex} />
    }

    // Inline math \(...\)
    if (seg.startsWith('\\(') && seg.endsWith('\\)') && seg.length > 4) {
      const latex = seg.slice(2, -2)
      return <MathInline key={i} math={latex} />
    }

    // Trata formatações markdown simples: negrito e código
    return <React.Fragment key={i}>{formatInlineMarkdown(seg)}</React.Fragment>
  })
}

function formatInlineMarkdown(text: string): React.ReactNode {
  // Negrito **texto**
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g)
  return boldParts.map((bp, j) => {
    if (bp.startsWith('**') && bp.endsWith('**') && bp.length > 4) {
      return (
        <strong key={j} className="font-semibold text-foreground">
          {bp.slice(2, -2)}
        </strong>
      )
    }

    // Código `código`
    const codeParts = bp.split(/(`[^`]+`)/g)
    return (
      <React.Fragment key={j}>
        {codeParts.map((cp, k) => {
          if (cp.startsWith('`') && cp.endsWith('`') && cp.length > 2) {
            return (
              <code key={k} className="font-mono text-xs px-1 py-0.5 rounded bg-muted text-primary">
                {cp.slice(1, -1)}
              </code>
            )
          }
          return cp
        })}
      </React.Fragment>
    )
  })
}
