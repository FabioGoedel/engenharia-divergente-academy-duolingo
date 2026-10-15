import React, { useState, useEffect } from 'react'
import { TrailNode, TrailNodeData, ProgressionRule } from '@/types/trailGraph'
import { getNodeTypeDefinition } from './nodeTypesRegistry'
import { ContentBlock } from '@/types/cms'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sliders,
  Trash2,
  Copy,
  Plus,
  BookOpen,
  Award,
  Clock,
  ShieldAlert,
  GitBranch,
} from 'lucide-react'

interface TrailRightPanelProps {
  selectedNode: TrailNode | null
  allNodes: TrailNode[]
  availableBlocks: ContentBlock[]
  onUpdateNodeData: (nodeId: string, updatedData: TrailNodeData) => void
  onDuplicateNode: (nodeId: string) => void
  onDeleteNode: (nodeId: string) => void
}

export const TrailRightPanel: React.FC<TrailRightPanelProps> = ({
  selectedNode,
  allNodes,
  availableBlocks,
  onUpdateNodeData,
  onDuplicateNode,
  onDeleteNode,
}) => {
  const [formData, setFormData] = useState<TrailNodeData | null>(null)

  useEffect(() => {
    if (selectedNode) {
      setFormData({ ...selectedNode.data })
    } else {
      setFormData(null)
    }
  }, [selectedNode])

  if (!selectedNode || !formData) {
    return (
      <div className="flex h-full w-88 flex-col items-center justify-center border-l border-[#294149] bg-[#0C1317] p-6 text-center text-[#A8BBC0]">
        <Sliders className="h-8 w-8 text-[#A8BBC0]/40 mb-2" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#E6EAED]">
          Nenhum Nó Selecionado
        </h3>
        <p className="mt-1 text-[11px] leading-relaxed">
          Clique sobre um nó no canvas central para configurar suas propriedades pedagógicas, regras
          de progressão e bloco associado.
        </p>
      </div>
    )
  }

  const def = getNodeTypeDefinition(formData.nodeType)
  const Icon = def.icon

  const handleFieldChange = <K extends keyof TrailNodeData>(key: K, value: TrailNodeData[K]) => {
    const updated = { ...formData, [key]: value }
    setFormData(updated)
    onUpdateNodeData(selectedNode.id, updated)
  }

  const handleRuleChange = <K extends keyof ProgressionRule>(key: K, value: ProgressionRule[K]) => {
    const currentRules = formData.rules || {
      requireAllPrerequisites: true,
      prerequisiteNodeIds: [],
      isRequired: true,
      requireZeroHints: false,
      maxLoopCycles: 3,
    }
    const updatedRules: ProgressionRule = {
      ...currentRules,
      [key]: value,
    }
    const updated: TrailNodeData = { ...formData, rules: updatedRules }
    setFormData(updated)
    onUpdateNodeData(selectedNode.id, updated)
  }

  return (
    <div className="flex h-full w-88 flex-col border-l border-[#294149] bg-[#0C1317] text-[#E6EAED]">
      {/* Topo do painel */}
      <div className="border-b border-[#294149] p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ backgroundColor: def.bgHex, color: def.colorHex }}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#A8BBC0] uppercase tracking-wider">
                Propriedades do Nó
              </span>
              <h3 className="text-xs font-bold text-white truncate max-w-[170px]">
                {formData.title || 'Sem título'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDuplicateNode(selectedNode.id)}
              className="h-7 w-7 p-0 text-[#A8BBC0] hover:text-white hover:bg-[#152228]"
              title="Duplicar Nó"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDeleteNode(selectedNode.id)}
              className="h-7 w-7 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              title="Excluir Nó"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {/* 1. Informações Básicas */}
          <div className="space-y-3 rounded-lg border border-[#294149] bg-[#152228]/40 p-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#01B59A] font-mono">
              Identificação & Metadados
            </h4>

            <div className="space-y-1">
              <Label className="text-[10px] text-[#A8BBC0]">Título da Atividade</Label>
              <Input
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="h-7 text-xs bg-[#152228] border-[#294149] text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] text-[#A8BBC0]">Descrição Pedagógica</Label>
              <Textarea
                rows={2}
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className="text-xs bg-[#152228] border-[#294149] text-white resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-[#A8BBC0] flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Minutos
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.estimatedMinutes}
                  onChange={(e) =>
                    handleFieldChange('estimatedMinutes', parseInt(e.target.value) || 10)
                  }
                  className="h-7 text-xs font-mono bg-[#152228] border-[#294149] text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-[#A8BBC0] flex items-center gap-1">
                  <Award className="h-3 w-3 text-[#01B59A]" /> XP Bônus
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.xpReward}
                  onChange={(e) => handleFieldChange('xpReward', parseInt(e.target.value) || 0)}
                  className="h-7 text-xs font-mono bg-[#152228] border-[#294149] text-white"
                />
              </div>
            </div>
          </div>

          {/* 2. Associação com Bloco da Biblioteca */}
          <div className="space-y-3 rounded-lg border border-[#294149] bg-[#152228]/40 p-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#38BDF8] font-mono">
              Bloco da Biblioteca Associado
            </h4>

            <div className="space-y-1">
              <Label className="text-[10px] text-[#A8BBC0]">Vincular Bloco Existente</Label>
              <Select
                value={formData.blockId || 'none'}
                onValueChange={(val) => {
                  if (val === 'none') {
                    handleFieldChange('blockId', undefined)
                    handleFieldChange('blockType', undefined)
                  } else {
                    const blk = availableBlocks.find((b) => b.id === val)
                    if (blk) {
                      handleFieldChange('blockId', blk.id)
                      handleFieldChange('blockType', blk.blockType)
                      handleFieldChange('blockVersion', blk.version)
                    }
                  }
                }}
              >
                <SelectTrigger className="h-7 text-xs bg-[#152228] border-[#294149] text-white">
                  <SelectValue placeholder="Selecione um bloco..." />
                </SelectTrigger>
                <SelectContent className="bg-[#152228] border-[#294149] text-white">
                  <SelectItem value="none">Nenhum bloco vinculado</SelectItem>
                  {availableBlocks.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">
                      {b.title} ({b.blockType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.blockId && (
              <div className="rounded bg-[#0C1317] p-2 text-[10px] font-mono space-y-1 text-[#A8BBC0] border border-[#294149]">
                <div>
                  ID: <span className="text-white">{formData.blockId}</span>
                </div>
                <div>
                  Tipo: <span className="text-[#01B59A]">{formData.blockType}</span>
                </div>
                <div>
                  Versão Referenciada:{' '}
                  <span className="text-white">v{formData.blockVersion || 1}</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Regras Pedagógicas de Progressão */}
          <div className="space-y-3 rounded-lg border border-[#294149] bg-[#152228]/40 p-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#F59E0B] font-mono flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5" />
              Regras Pedagógicas de Progressão
            </h4>

            {/* Obrigatoriedade */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-[11px] text-white">Nó Obrigatório</Label>
                <p className="text-[9px] text-[#A8BBC0]">
                  Exigido para avanço e conclusão da trilha
                </p>
              </div>
              <Switch
                checked={formData.rules?.isRequired ?? true}
                onCheckedChange={(checked) => handleRuleChange('isRequired', checked)}
              />
            </div>

            {/* Resolução sem dicas */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-[11px] text-white">Exigir Resolução sem Dicas</Label>
                <p className="text-[9px] text-[#A8BBC0]">Garante domínio autônomo do estudante</p>
              </div>
              <Switch
                checked={formData.rules?.requireZeroHints ?? false}
                onCheckedChange={(checked) => handleRuleChange('requireZeroHints', checked)}
              />
            </div>

            {/* Acurácia mínima */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-[#A8BBC0]">Acurácia Mínima Exigida (%)</Label>
                <span className="text-[10px] font-mono text-[#01B59A]">
                  {formData.rules?.minAccuracyPercentage ?? 0}%
                </span>
              </div>
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.rules?.minAccuracyPercentage ?? 0}
                onChange={(e) =>
                  handleRuleChange('minAccuracyPercentage', parseInt(e.target.value) || 0)
                }
                className="h-7 text-xs font-mono bg-[#152228] border-[#294149] text-white"
              />
            </div>

            {/* Limite de loops em revisão (anti-loop) */}
            <div className="space-y-1">
              <Label className="text-[10px] text-[#A8BBC0]">
                Limite de Ciclos de Revisão (Anti-Loop)
              </Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={formData.rules?.maxLoopCycles ?? 3}
                onChange={(e) => handleRuleChange('maxLoopCycles', parseInt(e.target.value) || 3)}
                className="h-7 text-xs font-mono bg-[#152228] border-[#294149] text-white"
              />
              <p className="text-[9px] text-[#A8BBC0]">
                Evita retenção perpétua; concede liberação assistida no teto estipulado.
              </p>
            </div>
          </div>

          {/* 4. Conquistas e Mensagem ao Concluir */}
          <div className="space-y-3 rounded-lg border border-[#294149] bg-[#152228]/40 p-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#10B981] font-mono">
              Celebração & Conquistas
            </h4>
            <div className="space-y-1">
              <Label className="text-[10px] text-[#A8BBC0]">Mensagem de Conquista</Label>
              <Input
                placeholder="Ex: Excelente! Você dominou o dimensionamento de seções."
                value={formData.achievementMessage || ''}
                onChange={(e) => handleFieldChange('achievementMessage', e.target.value)}
                className="h-7 text-xs bg-[#152228] border-[#294149] text-white"
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
