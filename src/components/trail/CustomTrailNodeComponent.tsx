import React, { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { TrailNodeData } from '@/types/trailGraph'
import { getNodeTypeDefinition } from './nodeTypesRegistry'
import { Badge } from '@/components/ui/badge'
import { Clock, Award, AlertCircle } from 'lucide-react'

export interface CustomNodeData extends TrailNodeData {
  isSelected?: boolean
  hasError?: boolean
  errorMessage?: string
}

export const CustomTrailNodeComponent = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData
  const def = getNodeTypeDefinition(nodeData.nodeType)
  const Icon = def.icon

  return (
    <div
      className={`relative min-w-[220px] max-w-[280px] rounded-xl border-2 bg-[#0C1317] p-3 shadow-xl transition-all ${
        selected
          ? 'border-[#01B59A] ring-2 ring-[#01B59A]/30 shadow-[#01B59A]/10'
          : nodeData.hasError
            ? 'border-rose-500 shadow-rose-950/20'
            : 'border-[#294149] hover:border-[#294149]/90'
      }`}
    >
      {/* Alça de Entrada (Target) se permitido */}
      {def.hasInputs && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !bg-[#01B59A] !border-2 !border-[#0C1317] hover:!scale-125 transition-transform"
        />
      )}

      {/* Topo: Ícone + Tipo + Badge de Status */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
            style={{ backgroundColor: def.bgHex, color: def.colorHex }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-mono font-semibold text-[#A8BBC0] uppercase tracking-wider truncate">
            {def.shortLabel}
          </span>
        </div>

        {nodeData.rendererStatus === 'planned' && (
          <Badge
            variant="outline"
            className="text-[9px] border-amber-500/40 text-amber-400 bg-amber-500/10 px-1.5 py-0"
          >
            Planejado
          </Badge>
        )}
      </div>

      {/* Título do Nó */}
      <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
        {nodeData.title || 'Sem título'}
      </h4>

      {/* Descrição resumida */}
      {nodeData.description && (
        <p className="mt-1 text-[10px] text-[#A8BBC0] line-clamp-2 leading-relaxed">
          {nodeData.description}
        </p>
      )}

      {/* Rodapé do card: Duração e XP */}
      <div className="mt-3 flex items-center justify-between border-t border-[#294149]/60 pt-2 text-[10px] font-mono text-[#A8BBC0]">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-[#A8BBC0]/70" />
          <span>{nodeData.estimatedMinutes || def.defaultMinutes} min</span>
        </div>
        <div className="flex items-center gap-1 text-[#01B59A] font-semibold">
          <Award className="h-3 w-3" />
          <span>+{nodeData.xpReward || def.defaultXp} XP</span>
        </div>
      </div>

      {/* Indicador de Erro de Validação */}
      {nodeData.hasError && (
        <div className="mt-2 flex items-center gap-1.5 rounded bg-rose-500/10 p-1.5 text-[10px] text-rose-400 border border-rose-500/30">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span className="truncate">{nodeData.errorMessage || 'Erro na configuração do nó'}</span>
        </div>
      )}

      {/* Alça de Saída (Source) se permitido */}
      {def.hasOutputs && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !bg-[#01B59A] !border-2 !border-[#0C1317] hover:!scale-125 transition-transform"
        />
      )}
    </div>
  )
})

CustomTrailNodeComponent.displayName = 'CustomTrailNodeComponent'
