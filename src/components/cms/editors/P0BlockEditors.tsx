import React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

export interface BlockEditorProps {
  config: Record<string, unknown>
  onChange: (updatedConfig: Record<string, unknown>) => void
}

// 1. Editor Single Choice
export const SingleChoiceBlockEditor: React.FC<BlockEditorProps> = ({ config, onChange }) => {
  const prompt = (config.prompt as string) || ''
  const explanation = (config.explanation as string) || ''
  const correctOptionId = (config.correctOptionId as string) || 'opt-1'
  const options = (config.options as Array<{
    id: string
    label: string
    text: string
    rationale?: string
  }>) || [
    { id: 'opt-1', label: 'A', text: '', rationale: '' },
    { id: 'opt-2', label: 'B', text: '', rationale: '' },
  ]

  const updateOption = (index: number, field: string, val: string) => {
    const updated = [...options]
    updated[index] = { ...updated[index], [field]: val }
    onChange({ ...config, options: updated })
  }

  const addOption = () => {
    const nextLabel = String.fromCharCode(65 + options.length)
    const newOpt = { id: `opt-${Date.now()}`, label: nextLabel, text: '', rationale: '' }
    onChange({ ...config, options: [...options, newOpt] })
  }

  const removeOption = (index: number) => {
    if (options.length <= 2) return
    const updated = options.filter((_, i) => i !== index)
    onChange({ ...config, options: updated })
  }

  return (
    <div className="space-y-4 text-xs">
      <div>
        <Label className="text-xs text-white">Enunciado (Markdown/LaTeX)</Label>
        <Textarea
          value={prompt}
          onChange={(e) => onChange({ ...config, prompt: e.target.value })}
          rows={3}
          placeholder="Ex: Considerando o critério de von Mises..."
          className="mt-1 bg-[#0C1317] border-[#294149] text-white"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-white font-semibold">Alternativas & Justificativas</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={addOption}
            className="h-7 text-xs border-[#294149]"
          >
            <Plus className="h-3 w-3 mr-1" /> Alternativa
          </Button>
        </div>

        {options.map((opt, idx) => (
          <div
            key={opt.id}
            className="p-3 border border-[#294149] rounded bg-[#0C1317]/60 space-y-2"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#01B59A] w-6">{opt.label})</span>
              <Input
                value={opt.text}
                onChange={(e) => updateOption(idx, 'text', e.target.value)}
                placeholder="Texto da alternativa..."
                className="h-8 bg-[#152228] border-[#294149] text-xs text-white"
              />
              <input
                type="radio"
                name="correctOpt"
                checked={correctOptionId === opt.id}
                onChange={() => onChange({ ...config, correctOptionId: opt.id })}
                title="Marcar como correta"
                className="accent-[#01B59A] h-4 w-4 shrink-0"
              />
              {options.length > 2 && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeOption(idx)}
                  className="h-7 w-7 text-[#C86F63]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <Input
              value={opt.rationale || ''}
              onChange={(e) => updateOption(idx, 'rationale', e.target.value)}
              placeholder="Justificativa do distrator / feedback..."
              className="h-7 bg-[#152228] border-[#294149]/70 text-[11px] text-[#A8BBC0]"
            />
          </div>
        ))}
      </div>

      <div>
        <Label className="text-xs text-white">Explicação Técnica Pós-Resposta</Label>
        <Textarea
          value={explanation}
          onChange={(e) => onChange({ ...config, explanation: e.target.value })}
          rows={2}
          placeholder="Fundamentação teórica, referências a normas (ex: NBR 8800)..."
          className="mt-1 bg-[#0C1317] border-[#294149] text-white"
        />
      </div>
    </div>
  )
}

// 2. Editor Numeric Response
export const NumericResponseBlockEditor: React.FC<BlockEditorProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-3 text-xs">
      <div>
        <Label className="text-xs text-white">Enunciado / Problema Numérico</Label>
        <Textarea
          value={(config.prompt as string) || ''}
          onChange={(e) => onChange({ ...config, prompt: e.target.value })}
          rows={3}
          className="mt-1 bg-[#0C1317] border-[#294149] text-white"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs text-white">Valor Esperado</Label>
          <Input
            type="number"
            step="any"
            value={typeof config.expectedValue === 'number' ? config.expectedValue : ''}
            onChange={(e) => onChange({ ...config, expectedValue: parseFloat(e.target.value) })}
            className="h-8 bg-[#0C1317] border-[#294149] text-white font-mono"
          />
        </div>
        <div>
          <Label className="text-xs text-white">Tolerância Absoluta (±)</Label>
          <Input
            type="number"
            step="any"
            value={typeof config.toleranceAbs === 'number' ? config.toleranceAbs : 0.05}
            onChange={(e) => onChange({ ...config, toleranceAbs: parseFloat(e.target.value) })}
            className="h-8 bg-[#0C1317] border-[#294149] text-white font-mono"
          />
        </div>
        <div>
          <Label className="text-xs text-white">Unidade de Medida</Label>
          <Input
            value={(config.unit as string) || ''}
            onChange={(e) => onChange({ ...config, unit: e.target.value })}
            placeholder="Ex: MPa, kN, mm"
            className="h-8 bg-[#0C1317] border-[#294149] text-white font-mono"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs text-white">Explicação da Resolução</Label>
        <Textarea
          value={(config.explanation as string) || ''}
          onChange={(e) => onChange({ ...config, explanation: e.target.value })}
          rows={2}
          className="mt-1 bg-[#0C1317] border-[#294149] text-white"
        />
      </div>
    </div>
  )
}

// 3. Editor Video Embed
export const VideoEmbedBlockEditor: React.FC<BlockEditorProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-3 text-xs">
      <div>
        <Label className="text-xs text-white">Título do Vídeo</Label>
        <Input
          value={(config.title as string) || ''}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          className="h-8 bg-[#0C1317] border-[#294149] text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-white">ID YouTube (ou link do vídeo)</Label>
          <Input
            value={(config.youtubeId as string) || ''}
            onChange={(e) => {
              let val = e.target.value.trim()
              if (val.includes('watch?v=')) {
                val = val.split('watch?v=')[1].split('&')[0]
              } else if (val.includes('youtu.be/')) {
                val = val.split('youtu.be/')[1].split('?')[0]
              }
              onChange({ ...config, youtubeId: val })
            }}
            placeholder="Ex: dQw4w9WgXcQ"
            className="h-8 bg-[#0C1317] border-[#294149] text-white font-mono"
          />
        </div>
        <div>
          <Label className="text-xs text-white">Duração Estimada (min)</Label>
          <Input
            type="number"
            value={typeof config.durationMinutes === 'number' ? config.durationMinutes : 15}
            onChange={(e) => onChange({ ...config, durationMinutes: parseInt(e.target.value, 10) })}
            className="h-8 bg-[#0C1317] border-[#294149] text-white"
          />
        </div>
      </div>
    </div>
  )
}

// 4. Editor Rich Text
export const RichTextBlockEditor: React.FC<BlockEditorProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-3 text-xs">
      <div>
        <Label className="text-xs text-white">Conteúdo Markdown & LaTeX</Label>
        <p className="text-[11px] text-[#A8BBC0] mb-1">
          Suporta fórmulas com $fórmula$ (inline) ou $$fórmula$$ (bloco). Tags de script ou
          javascript: são sanitizadas.
        </p>
        <Textarea
          value={(config.markdown as string) || ''}
          onChange={(e) => onChange({ ...config, markdown: e.target.value })}
          rows={8}
          className="bg-[#0C1317] border-[#294149] text-white font-mono text-xs"
        />
      </div>
    </div>
  )
}

// 5. Editor Genérico para outros tipos P0 (Fallback amigável estruturado)
export const GenericJsonBlockEditor: React.FC<BlockEditorProps> = ({ config, onChange }) => {
  return (
    <div className="space-y-3 text-xs">
      <Label className="text-xs text-white">Configuração do Bloco (Parâmetros)</Label>
      <div className="space-y-2">
        {Object.entries(config).map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return (
              <div key={key} className="space-y-1">
                <span className="font-mono text-[#01B59A]">{key}:</span>
                <Textarea
                  value={JSON.stringify(value, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value)
                      onChange({ ...config, [key]: parsed })
                    } catch {
                      // aguarda JSON válido
                    }
                  }}
                  rows={3}
                  className="bg-[#0C1317] border-[#294149] text-white font-mono text-xs"
                />
              </div>
            )
          }

          return (
            <div key={key} className="grid grid-cols-3 items-center gap-2">
              <Label className="font-mono text-[11px] text-[#A8BBC0] truncate">{key}</Label>
              <div className="col-span-2">
                <Input
                  value={String(value ?? '')}
                  onChange={(e) => onChange({ ...config, [key]: e.target.value })}
                  className="h-8 bg-[#0C1317] border-[#294149] text-white text-xs"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
