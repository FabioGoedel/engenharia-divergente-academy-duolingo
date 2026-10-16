import React from 'react'
import { Link } from 'react-router-dom'
import { Check, Lock, Play, RotateCcw, Sparkles, BookOpen, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export type LearningPathNodeStatus = 'completed' | 'current' | 'available' | 'locked' | 'review'

export interface LearningPathNodeData {
  id: string
  title: string
  shortLabel?: string
  description?: string
  status: LearningPathNodeStatus
  estimatedMinutes?: number
  xpReward?: number
  actionUrl: string
  isRequired?: boolean
  unitTitle?: string
}

interface LearningPathProps {
  nodes: LearningPathNodeData[]
  onNodeSelect?: (node: LearningPathNodeData) => void
  selectedNodeId?: string | null
}

/**
 * Trilhas estilo Duolingo sóbrio e técnico:
 * Percurso vertical sinuoso (offset horizontal suave), nós circulares limpos,
 * conexões contínuas e popover/painel compacto ao clicar.
 */
export const LearningPath: React.FC<LearningPathProps> = ({
  nodes,
  onNodeSelect,
  selectedNodeId,
}) => {
  // Padrão sinuoso de deslocamento horizontal para simular o caminho Duolingo
  const getHorizontalOffset = (index: number) => {
    const pattern = [0, 24, 40, 24, 0, -24, -40, -24]
    return pattern[index % pattern.length]
  }

  return (
    <div className="relative py-8 flex flex-col items-center max-w-md mx-auto w-full select-none">
      {nodes.map((node, index) => {
        const offset = getHorizontalOffset(index)
        const isSelected = selectedNodeId === node.id
        const isCurrent = node.status === 'current'
        const isCompleted = node.status === 'completed'
        const isReview = node.status === 'review'
        const isLocked = node.status === 'locked'

        return (
          <div
            key={node.id}
            className="relative flex flex-col items-center my-3 group"
            style={{ transform: `translateX(${offset}px)` }}
          >
            {/* Linha de conexão vertical para o próximo nó */}
            {index < nodes.length - 1 && (
              <div
                className={`absolute top-14 left-1/2 -translate-x-1/2 w-1.5 h-10 -z-0 rounded-full transition-colors ${
                  isCompleted ? 'bg-primary' : 'bg-border/60'
                }`}
              />
            )}

            {/* Nó Circular */}
            <button
              type="button"
              onClick={() => onNodeSelect && onNodeSelect(node)}
              className={`relative z-10 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-4 transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
                isCompleted
                  ? 'border-primary bg-primary text-primary-foreground hover:scale-105'
                  : isCurrent
                    ? 'border-primary bg-card text-primary ring-4 ring-primary/30 animate-pulse hover:scale-105'
                    : isReview
                      ? 'border-amber-500 bg-amber-500/20 text-amber-500 hover:scale-105'
                      : isLocked
                        ? 'border-border/60 bg-muted/60 text-muted-foreground/60 cursor-not-allowed opacity-75'
                        : 'border-primary/50 bg-card text-foreground hover:border-primary hover:scale-105'
              } ${isSelected ? 'scale-110 ring-4 ring-primary' : ''}`}
              aria-label={`${node.title} - ${node.status}`}
            >
              {isCompleted ? (
                <Check className="h-6 w-6 stroke-[3]" />
              ) : isCurrent ? (
                <Play className="h-6 w-6 fill-current translate-x-0.5" />
              ) : isReview ? (
                <RotateCcw className="h-6 w-6 stroke-[2.5]" />
              ) : isLocked ? (
                <Lock className="h-5 w-5" />
              ) : (
                <BookOpen className="h-5 w-5" />
              )}

              {/* Indicador de etapa atual no topo do nó */}
              {isCurrent && (
                <span className="absolute -top-2.5 bg-primary text-primary-foreground font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                  Iniciar
                </span>
              )}
            </button>

            {/* Rótulo resumido do nó */}
            <span
              className={`mt-2 text-xs font-medium text-center max-w-[140px] truncate transition-colors ${
                isCurrent
                  ? 'text-primary font-bold'
                  : isCompleted
                    ? 'text-foreground'
                    : isLocked
                      ? 'text-muted-foreground/60'
                      : 'text-muted-foreground'
              }`}
            >
              {node.title}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Painel compacto exibido ao clicar ou focar em um nó
 */
export const MissionPreview: React.FC<{
  node: LearningPathNodeData | null
  onClose?: () => void
}> = ({ node, onClose }) => {
  if (!node) return null

  const isCompleted = node.status === 'completed'
  const isLocked = node.status === 'locked'

  return (
    <div className="fixed sm:sticky bottom-4 inset-x-4 sm:inset-x-auto z-40 max-w-sm w-full mx-auto p-4 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-xl space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-primary/40 text-primary mb-1"
          >
            {node.shortLabel || 'Missão'}
          </Badge>
          <h3 className="font-bold text-sm text-foreground leading-snug">{node.title}</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xs p-1"
          >
            ✕
          </button>
        )}
      </div>

      {node.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {node.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
        <div className="flex items-center gap-3">
          {node.estimatedMinutes && (
            <span className="flex items-center gap-1 font-mono">
              <Clock className="h-3 w-3" />
              {node.estimatedMinutes} min
            </span>
          )}
          {node.xpReward && (
            <span className="flex items-center gap-1 font-mono text-primary font-bold">
              <Sparkles className="h-3 w-3" />+{node.xpReward} XP
            </span>
          )}
        </div>

        {!isLocked ? (
          <Button
            asChild
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs h-8 px-4"
          >
            <Link to={node.actionUrl}>
              {isCompleted ? 'Revisar' : 'Começar'} <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        ) : (
          <span className="text-[11px] text-muted-foreground italic flex items-center gap-1">
            <Lock className="h-3 w-3" /> Conclua a missão anterior
          </span>
        )}
      </div>
    </div>
  )
}
