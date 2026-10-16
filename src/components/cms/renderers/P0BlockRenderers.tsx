import React, { useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  FileText,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Lock,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ListOrdered,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { SanitizedMarkdownViewer, MathFormula } from '@/components/cms/SanitizedMarkdownViewer'
import { parseBrazilianNumericInput } from '@/schemas/canonicalSchemas'

interface BaseBlockRendererProps {
  config: Record<string, unknown>
  onComplete?: () => void
  isReadOnly?: boolean
}

// 1. Single Choice (Alternativa única explicativa)
export const SingleChoiceBlockRenderer: React.FC<BaseBlockRendererProps> = ({
  config,
  onComplete,
}) => {
  const prompt = (config.prompt as string) || 'Selecione a resposta correta:'
  const options =
    (config.options as Array<{ id: string; label: string; text: string; rationale?: string }>) || []
  const correctOptionId = config.correctOptionId as string | undefined

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!selectedId) return
    setSubmitted(true)
    if (onComplete) onComplete()
  }

  const isCorrect = selectedId === correctOptionId

  return (
    <div className="space-y-4">
      <SanitizedMarkdownViewer content={prompt} />

      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = selectedId === opt.id
          let borderClass = 'border-[#294149] hover:border-[#01B59A]/60 bg-[#152228]/60'
          if (submitted) {
            if (opt.id === correctOptionId) {
              borderClass = 'border-[#01B59A] bg-[#01B59A]/15 text-white'
            } else if (isSelected && !isCorrect) {
              borderClass = 'border-[#C86F63] bg-[#C86F63]/15 text-white'
            } else {
              borderClass = 'border-[#294149]/40 opacity-60'
            }
          } else if (isSelected) {
            borderClass = 'border-[#01B59A] bg-[#01B59A]/10 text-white'
          }

          return (
            <div
              key={opt.id}
              onClick={() => !submitted && setSelectedId(opt.id)}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-all ${borderClass}`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-mono font-bold ${
                  isSelected
                    ? 'border-[#01B59A] bg-[#01B59A] text-black'
                    : 'border-[#294149] text-[#A8BBC0]'
                }`}
              >
                {opt.label || opt.id.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 space-y-1">
                <div className="text-sm">
                  <SanitizedMarkdownViewer content={opt.text} />
                </div>
                {submitted && opt.rationale && (
                  <div className="text-xs text-[#A8BBC0] italic pt-1 border-t border-white/10">
                    Justificativa:{' '}
                    <SanitizedMarkdownViewer content={opt.rationale} className="inline" />
                  </div>
                )}
              </div>
              {submitted && opt.id === correctOptionId && (
                <CheckCircle2 className="h-5 w-5 text-[#01B59A] shrink-0" />
              )}
              {submitted && isSelected && !isCorrect && (
                <XCircle className="h-5 w-5 text-[#C86F63] shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {!submitted ? (
        <Button
          onClick={handleSubmit}
          disabled={!selectedId}
          className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold"
        >
          Confirmar Resposta
        </Button>
      ) : (
        <div className="rounded-lg border border-[#294149] bg-[#152228] p-4 text-sm">
          <div className="flex items-center gap-2 mb-2 font-medium">
            {isCorrect ? (
              <span className="text-[#01B59A] flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Resposta Correta!
              </span>
            ) : (
              <span className="text-[#C86F63] flex items-center gap-1.5 font-semibold">
                <XCircle className="h-4 w-4" /> Resposta Incorreta
              </span>
            )}
          </div>
          {config.explanation && (
            <div className="text-xs text-[#A8BBC0] border-t border-[#294149] pt-2">
              <span className="font-semibold text-white">Comentário Técnico: </span>
              {String(config.explanation)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 2. Multiple Choice (Múltipla escolha)
export const MultipleChoiceBlockRenderer: React.FC<BaseBlockRendererProps> = ({
  config,
  onComplete,
}) => {
  const prompt = (config.prompt as string) || 'Selecione todas as alternativas válidas:'
  const options =
    (config.options as Array<{ id: string; label: string; text: string; rationale?: string }>) || []
  const correctOptionIds = (config.correctOptionIds as string[]) || []

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  const toggleSelect = (id: string) => {
    if (submitted) return
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleSubmit = () => {
    if (selectedIds.length === 0) return
    setSubmitted(true)
    if (onComplete) onComplete()
  }

  return (
    <div className="space-y-4">
      <SanitizedMarkdownViewer content={prompt} />
      <p className="text-xs text-[#A8BBC0]">Múltipla seleção permitida.</p>

      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = selectedIds.includes(opt.id)
          const isOptionCorrect = correctOptionIds.includes(opt.id)

          return (
            <div
              key={opt.id}
              onClick={() => toggleSelect(opt.id)}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-all ${
                submitted
                  ? isOptionCorrect
                    ? 'border-[#01B59A] bg-[#01B59A]/15'
                    : isSelected
                      ? 'border-[#C86F63] bg-[#C86F63]/15'
                      : 'border-[#294149]/40 opacity-60'
                  : isSelected
                    ? 'border-[#01B59A] bg-[#01B59A]/10'
                    : 'border-[#294149] hover:border-[#01B59A]/60 bg-[#152228]/60'
              }`}
            >
              <Checkbox checked={isSelected} className="mt-0.5" />
              <div className="flex-1 space-y-1">
                <span className="font-mono text-xs text-[#01B59A] mr-2 font-bold">{opt.label}</span>
                <div className="text-sm text-[#E6EAED] inline-block">
                  <SanitizedMarkdownViewer content={opt.text} />
                </div>
                {submitted && opt.rationale && (
                  <div className="text-xs text-[#A8BBC0] italic pt-1">
                    <SanitizedMarkdownViewer content={opt.rationale} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!submitted ? (
        <Button
          onClick={handleSubmit}
          disabled={selectedIds.length === 0}
          className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold"
        >
          Confirmar Seleção
        </Button>
      ) : (
        <div className="rounded-lg border border-[#294149] bg-[#152228] p-3 text-xs text-[#A8BBC0]">
          {config.explanation && <p>{String(config.explanation)}</p>}
        </div>
      )}
    </div>
  )
}

// 3. True / False (Verdadeiro ou Falso Comentado)
export const TrueFalseBlockRenderer: React.FC<BaseBlockRendererProps> = ({
  config,
  onComplete,
}) => {
  const statement = (config.statement as string) || (config.prompt as string) || ''
  const correctAnswer = config.correctAnswer === true || config.correctOptionId === 'V'
  const [userChoice, setUserChoice] = useState<boolean | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSelect = (choice: boolean) => {
    if (submitted) return
    setUserChoice(choice)
    setSubmitted(true)
    if (onComplete) onComplete()
  }

  return (
    <div className="space-y-4 rounded-lg border border-[#294149] bg-[#152228]/50 p-4">
      <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#01B59A]">
        <FileText className="h-4 w-4" /> Julgamento Técnico
      </div>
      <SanitizedMarkdownViewer content={statement} />

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={submitted}
          onClick={() => handleSelect(true)}
          className={`h-12 border ${
            submitted && correctAnswer
              ? 'border-[#01B59A] bg-[#01B59A]/20 text-[#01B59A] font-bold'
              : submitted && userChoice === true
                ? 'border-[#C86F63] bg-[#C86F63]/20 text-[#C86F63]'
                : 'border-[#294149] hover:border-[#01B59A]'
          }`}
        >
          Verdadeiro
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={submitted}
          onClick={() => handleSelect(false)}
          className={`h-12 border ${
            submitted && !correctAnswer
              ? 'border-[#01B59A] bg-[#01B59A]/20 text-[#01B59A] font-bold'
              : submitted && userChoice === false
                ? 'border-[#C86F63] bg-[#C86F63]/20 text-[#C86F63]'
                : 'border-[#294149] hover:border-[#01B59A]'
          }`}
        >
          Falso
        </Button>
      </div>

      {submitted && (
        <div className="rounded-lg border border-[#294149] bg-[#0C1317] p-3 text-xs space-y-1">
          <p className="font-semibold text-white">
            {userChoice === correctAnswer ? '✓ Julgamento correto!' : '✗ Julgamento incorreto.'}
          </p>
          {config.explanation && <p className="text-[#A8BBC0]">{String(config.explanation)}</p>}
        </div>
      )}
    </div>
  )
}

// 4. Numeric Response (com tolerância, vírgula decimal pt-BR e unidade)
export const NumericResponseBlockRenderer: React.FC<BaseBlockRendererProps> = ({
  config,
  onComplete,
}) => {
  const prompt = (config.prompt as string) || 'Calcule o valor numérico:'
  const expectedValue = typeof config.expectedValue === 'number' ? config.expectedValue : 0
  const toleranceAbs = typeof config.toleranceAbs === 'number' ? config.toleranceAbs : 0.05
  const unit = (config.unit as string) || ''

  const [inputStr, setInputStr] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const handleValidate = () => {
    setErrorMsg(null)
    const parsed = parseBrazilianNumericInput(inputStr)
    if (parsed === null) {
      setErrorMsg(
        'Digite um número válido. Aceita vírgula ou ponto (ex: 24,5 ou 24.5). Rejeita NaN/infinito.',
      )
      return
    }

    const diff = Math.abs(parsed - expectedValue)
    const passed = diff <= toleranceAbs
    setIsCorrect(passed)
    setSubmitted(true)
    if (onComplete) onComplete()
  }

  return (
    <div className="space-y-4 rounded-lg border border-[#294149] bg-[#152228]/50 p-4">
      <SanitizedMarkdownViewer content={prompt} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Input
            value={inputStr}
            onChange={(e) => setInputStr(e.target.value)}
            disabled={submitted}
            placeholder="Ex: 142,5"
            className="border-[#294149] bg-[#0C1317] text-white font-mono"
          />
        </div>
        {unit && (
          <span className="font-mono text-sm font-semibold text-[#01B59A] shrink-0">[{unit}]</span>
        )}
        <Button
          onClick={handleValidate}
          disabled={submitted || !inputStr.trim()}
          className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 shrink-0 font-semibold"
        >
          Verificar
        </Button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-[#C86F63]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {submitted && (
        <div className="rounded-lg border border-[#294149] bg-[#0C1317] p-3 text-xs space-y-2">
          <div className="flex items-center gap-2">
            {isCorrect ? (
              <span className="text-[#01B59A] font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Valor dentro da tolerância aceita (±
                {toleranceAbs} {unit})!
              </span>
            ) : (
              <span className="text-[#C86F63] font-semibold flex items-center gap-1">
                <XCircle className="h-4 w-4" /> Valor fora do intervalo aceitável.
              </span>
            )}
          </div>
          <p className="text-[#A8BBC0]">
            Esperado:{' '}
            <span className="font-mono text-white">
              {expectedValue} {unit}
            </span>{' '}
            (Tolerância: ±{toleranceAbs})
          </p>
          {config.explanation && (
            <p className="text-[#A8BBC0] border-t border-[#294149] pt-2">
              {String(config.explanation)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// 5. Ordered Steps (Ordenar etapas de cálculo/projeto)
export const OrderedStepsBlockRenderer: React.FC<BaseBlockRendererProps> = ({
  config,
  onComplete,
}) => {
  const prompt =
    (config.prompt as string) || 'Ordene as etapas sequencialmente na ordem de execução correta:'
  const rawSteps = (config.steps as Array<{ id: string; text: string }>) || []
  const correctOrder = (config.correctOrder as string[]) || rawSteps.map((s) => s.id)

  const [steps, setSteps] = useState(rawSteps)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (submitted) return
    const newIdx = direction === 'up' ? index - 1 : index + 1
    if (newIdx < 0 || newIdx >= steps.length) return
    const updated = [...steps]
    const temp = updated[index]
    updated[index] = updated[newIdx]
    updated[newIdx] = temp
    setSteps(updated)
  }

  const handleVerify = () => {
    const currentOrder = steps.map((s) => s.id)
    const match = currentOrder.every((id, idx) => id === correctOrder[idx])
    setIsCorrect(match)
    setSubmitted(true)
    if (onComplete) onComplete()
  }

  return (
    <div className="space-y-4 rounded-lg border border-[#294149] bg-[#152228]/50 p-4">
      <SanitizedMarkdownViewer content={prompt} />

      <div className="space-y-2">
        {steps.map((st, idx) => (
          <div
            key={st.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-[#294149] bg-[#0C1317] p-3"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-[#152228] font-mono text-xs font-bold text-[#01B59A] border border-[#294149]">
                {idx + 1}
              </span>
              <span className="text-sm text-[#E6EAED]">{st.text}</span>
            </div>
            {!submitted && (
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={idx === 0}
                  onClick={() => moveStep(idx, 'up')}
                  className="h-7 w-7 text-[#A8BBC0] hover:text-white"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={idx === steps.length - 1}
                  onClick={() => moveStep(idx, 'down')}
                  className="h-7 w-7 text-[#A8BBC0] hover:text-white"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!submitted ? (
        <Button
          onClick={handleVerify}
          className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold"
        >
          Validar Sequência
        </Button>
      ) : (
        <div className="rounded-lg border border-[#294149] bg-[#0C1317] p-3 text-xs space-y-1">
          <p className="font-semibold text-white">
            {isCorrect ? '✓ Sequência de etapas perfeita!' : '✗ A ordem ainda não está correta.'}
          </p>
          {config.explanation && <p className="text-[#A8BBC0]">{String(config.explanation)}</p>}
        </div>
      )}
    </div>
  )
}

// 6. Rich Text (Markdown/LaTeX sanitizado)
export const RichTextBlockRenderer: React.FC<BaseBlockRendererProps> = ({ config }) => {
  const markdown = (config.markdown as string) || (config.text as string) || ''
  return (
    <div className="rounded-lg border border-[#294149] bg-[#152228]/40 p-5">
      <SanitizedMarkdownViewer content={markdown} />
    </div>
  )
}

// 7. Video Embed (Player YouTube oficial)
export const VideoEmbedBlockRenderer: React.FC<BaseBlockRendererProps> = ({
  config,
  onComplete,
}) => {
  const title = (config.title as string) || 'Vídeo de Engenharia'
  const videoId = (config.youtubeId as string) || (config.videoId as string) || 'dQw4w9WgXcQ'
  const duration = config.durationMinutes ? `${config.durationMinutes} min` : undefined

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[#294149] bg-black shadow-lg">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
      <div className="flex items-center justify-between text-xs text-[#A8BBC0] px-1">
        <div className="flex items-center gap-2">
          <Play className="h-3.5 w-3.5 text-[#01B59A]" />
          <span className="font-medium text-white">{title}</span>
          {duration && <span>• {duration}</span>}
        </div>
        {onComplete && (
          <Button
            size="sm"
            variant="outline"
            onClick={onComplete}
            className="h-7 text-xs border-[#294149] text-[#01B59A] hover:bg-[#01B59A]/10"
          >
            Marcar como Assistido
          </Button>
        )}
      </div>
    </div>
  )
}

// 8. PDF Reader (Leitor in-app com zoom e download)
export const PdfReaderBlockRenderer: React.FC<BaseBlockRendererProps> = ({ config }) => {
  const title = (config.title as string) || 'Documento Técnico (PDF)'
  const pdfUrl =
    (config.pdfUrl as string) ||
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  const [zoom, setZoom] = useState(100)

  return (
    <div className="space-y-3 rounded-lg border border-[#294149] bg-[#152228]/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#294149] pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#01B59A]" />
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setZoom((z) => Math.max(50, z - 25))}
            className="h-7 w-7 text-[#A8BBC0]"
            title="Reduzir Zoom"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="font-mono text-xs text-[#A8BBC0] w-12 text-center">{zoom}%</span>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setZoom((z) => Math.min(200, z + 25))}
            className="h-7 w-7 text-[#A8BBC0]"
            title="Aumentar Zoom"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[#01B59A] hover:underline ml-2"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Abrir Externo
          </a>
        </div>
      </div>

      <div
        className="w-full overflow-auto rounded border border-[#294149] bg-zinc-900"
        style={{ height: '420px' }}
      >
        <iframe src={`${pdfUrl}#zoom=${zoom}`} title={title} className="h-full w-full border-0" />
      </div>
    </div>
  )
}

// 9. Checklist (persistente no localStorage da sessão demo)
export const ChecklistBlockRenderer: React.FC<BaseBlockRendererProps> = ({
  config,
  onComplete,
}) => {
  const blockId = (config.id as string) || 'default-checklist'
  const items = (config.items as Array<{ id: string; label: string }>) || []

  const storageKey = `checklist_state_${blockId}`
  const [checkedIds, setCheckedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const toggleItem = (id: string) => {
    setCheckedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      try {
        localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        // demo fallback
      }
      if (next.length === items.length && onComplete) {
        onComplete()
      }
      return next
    })
  }

  const allCompleted = items.length > 0 && checkedIds.length === items.length

  return (
    <div className="space-y-3 rounded-lg border border-[#294149] bg-[#152228]/50 p-4">
      <div className="flex items-center justify-between border-b border-[#294149] pb-2">
        <h4 className="text-sm font-semibold text-white">
          {(config.title as string) || 'Lista de Verificação Técnica'}
        </h4>
        <Badge
          variant="outline"
          className={`text-[10px] font-mono ${
            allCompleted
              ? 'border-[#01B59A] text-[#01B59A] bg-[#01B59A]/10'
              : 'border-[#294149] text-[#A8BBC0]'
          }`}
        >
          {checkedIds.length}/{items.length} itens concluídos
        </Badge>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const isDone = checkedIds.includes(item.id)
          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-2.5 transition-colors ${
                isDone
                  ? 'border-[#01B59A]/40 bg-[#01B59A]/5 text-[#E6EAED]'
                  : 'border-[#294149]/60 hover:border-[#294149] bg-[#0C1317]/50'
              }`}
            >
              <Checkbox checked={isDone} className="mt-0.5" />
              <span className={`text-sm ${isDone ? 'line-through text-[#A8BBC0]' : 'text-white'}`}>
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 10. Image / Gallery
export const ImageBlockRenderer: React.FC<BaseBlockRendererProps> = ({ config }) => {
  const imageUrl =
    (config.imageUrl as string) ||
    'https://img.usecurling.com/p/800/450?q=mechanical%20engineering%20stress'
  const caption = (config.caption as string) || ''
  const alt = (config.alt as string) || 'Diagrama Técnico'

  return (
    <figure className="space-y-2 rounded-lg border border-[#294149] bg-[#152228]/40 p-3">
      <div className="overflow-hidden rounded-md bg-black/60 flex items-center justify-center">
        <img
          src={imageUrl}
          alt={alt}
          className="max-h-[460px] w-auto object-contain mx-auto"
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="text-center text-xs text-[#A8BBC0] italic pt-1">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

// 11. Formula Reference (Painel de fórmulas)
export const FormulaReferenceBlockRenderer: React.FC<BaseBlockRendererProps> = ({ config }) => {
  const title = (config.title as string) || 'Fórmulas e Relações Fundamentais'
  const formulas =
    (config.formulas as Array<{ label: string; latex: string; description?: string }>) || []

  return (
    <div className="space-y-3 rounded-lg border border-[#294149] bg-[#152228]/50 p-4">
      <div className="flex items-center gap-2 border-b border-[#294149] pb-2">
        <Sparkles className="h-4 w-4 text-[#01B59A]" />
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {formulas.map((f, idx) => (
          <div key={idx} className="rounded-lg border border-[#294149] bg-[#0C1317] p-3 space-y-1">
            <p className="text-xs font-semibold text-white">{f.label}</p>
            <MathFormula math={f.latex} block />
            {f.description && <p className="text-[11px] text-[#A8BBC0]">{f.description}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

// 12. Milestone Video (Vídeo do professor em marco de jornada)
export const MilestoneVideoBlockRenderer: React.FC<BaseBlockRendererProps> = ({
  config,
  onComplete,
}) => {
  const mentorName = (config.mentorName as string) || 'Prof. Fernando Silva'
  const headline = (config.headline as string) || 'Mensagem do Coordenador de Trilha'
  const videoId = (config.youtubeId as string) || 'dQw4w9WgXcQ'

  return (
    <div className="rounded-xl border-2 border-[#01B59A]/60 bg-gradient-to-b from-[#152228] to-[#0C1317] p-5 space-y-4 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[#01B59A]/20 border border-[#01B59A] flex items-center justify-center font-bold text-sm text-[#01B59A]">
          FD
        </div>
        <div>
          <Badge className="bg-[#01B59A] text-black text-[10px] uppercase font-mono font-bold">
            Marco da Trilha
          </Badge>
          <h4 className="text-base font-bold text-white mt-0.5">{headline}</h4>
          <p className="text-xs text-[#A8BBC0]">{mentorName}</p>
        </div>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-[#294149] bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
          title={headline}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>

      {onComplete && (
        <div className="flex justify-end">
          <Button
            onClick={onComplete}
            className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs"
          >
            Avançar após orientações <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}

// 13. CTA (Chamada comercial contextual)
export const CtaBlockRenderer: React.FC<BaseBlockRendererProps> = ({ config }) => {
  const title = (config.title as string) || 'Aprofunde-se nesta Especialização'
  const description =
    (config.description as string) || 'Liberte o módulo avançado com casos práticos e laudos reais.'
  const buttonText = (config.buttonText as string) || 'Conhecer Extensão Técnica'
  const targetUrl = (config.targetUrl as string) || '/app/assinatura'

  return (
    <div className="rounded-xl border border-[#C69B4B]/40 bg-gradient-to-r from-[#152228] via-[#0C1317] to-[#152228] p-5 space-y-3">
      <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#C69B4B]">
        <Sparkles className="h-4 w-4" /> Próximo Passo Profissional
      </div>
      <h4 className="text-base font-bold text-white">{title}</h4>
      <p className="text-xs text-[#A8BBC0]">{description}</p>
      <div className="pt-2">
        <Button
          asChild
          className="bg-[#C69B4B] text-black hover:bg-[#C69B4B]/90 font-semibold text-xs"
        >
          <a href={targetUrl}>{buttonText}</a>
        </Button>
      </div>
    </div>
  )
}

// 14. Conditional Gate (Gate de acesso / competência)
export const ConditionalGateBlockRenderer: React.FC<BaseBlockRendererProps> = ({ config }) => {
  const gateTitle = (config.title as string) || 'Portão de Competência Bloqueado'
  const requirement =
    (config.requirement as string) ||
    'Conclusão da lista de exercícios com aproveitamento mínimo de 75% e aprovação do pré-requisito.'
  const isUnlocked = config.isUnlocked === true

  return (
    <div
      className={`rounded-xl border p-5 space-y-3 ${
        isUnlocked ? 'border-[#01B59A]/50 bg-[#01B59A]/10' : 'border-[#C86F63]/50 bg-[#152228]'
      }`}
    >
      <div className="flex items-center gap-2">
        {isUnlocked ? (
          <CheckCircle2 className="h-5 w-5 text-[#01B59A]" />
        ) : (
          <Lock className="h-5 w-5 text-[#C86F63]" />
        )}
        <h4 className="text-sm font-bold text-white">{gateTitle}</h4>
      </div>
      <p className="text-xs text-[#A8BBC0]">{requirement}</p>
      <div className="text-[11px] font-mono text-[#A8BBC0]">
        Status: {isUnlocked ? 'LIBERADO PARA AVANÇO' : 'BLOQUEADO — PENDENTE DE CRITÉRIO'}
      </div>
    </div>
  )
}
