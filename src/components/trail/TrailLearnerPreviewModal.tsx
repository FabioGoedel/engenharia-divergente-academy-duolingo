import React, { useState } from 'react'
import { TrailGraph, TrailNode, LearnerTrailState, LearnerNodeProgress } from '@/types/trailGraph'
import { DeterministicProgressionEngine } from '@/services/progressionEngine'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getNodeTypeDefinition } from './nodeTypesRegistry'
import {
  User,
  Sparkles,
  Award,
  Clock,
  CheckCircle2,
  Lock,
  RotateCcw,
  AlertTriangle,
  Play,
  ArrowRight,
} from 'lucide-react'

export type SimulationProfileId =
  | 'beginner'
  | 'high_performer'
  | 'struggling'
  | 'hint_reliant'
  | 'revision_needed'

export interface SimulationProfile {
  id: SimulationProfileId
  label: string
  description: string
  badgeColor: string
  defaultScores: {
    accuracy: number
    hintsUsed: number
    timeMultiplier: number
  }
}

export const SIMULATION_PROFILES: SimulationProfile[] = [
  {
    id: 'beginner',
    label: 'Aluno Iniciante',
    description:
      'Está começando a trilha; executa passos com acurácia mediana (65%) e poucas dicas.',
    badgeColor: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    defaultScores: { accuracy: 65, hintsUsed: 1, timeMultiplier: 1.2 },
  },
  {
    id: 'high_performer',
    label: 'Alto Desempenho (Domínio Pleno)',
    description: 'Resolve os exercícios com excelência (≥90%), sem dicas e no menor tempo.',
    badgeColor: 'border-[#01B59A]/40 text-[#01B59A] bg-[#01B59A]/10',
    defaultScores: { accuracy: 95, hintsUsed: 0, timeMultiplier: 0.8 },
  },
  {
    id: 'struggling',
    label: 'Com Dificuldades (Precisa de Apoio)',
    description: 'Enfrenta barreiras conceituais (acurácia <50%), aciona a ramificação de reforço.',
    badgeColor: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
    defaultScores: { accuracy: 40, hintsUsed: 2, timeMultiplier: 1.5 },
  },
  {
    id: 'hint_reliant',
    label: 'Pede Dicas Frequentemente',
    description:
      'Consegue pontuação satisfatória (80%), porém recorre a múltiplas dicas em cada etapa.',
    badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    defaultScores: { accuracy: 80, hintsUsed: 4, timeMultiplier: 1.1 },
  },
  {
    id: 'revision_needed',
    label: 'Precisa Revisar Fundamentos',
    description: 'Desempenho intermediário (55-65%); é encaminhado para checkpoints de revisão.',
    badgeColor: 'border-orange-500/40 text-orange-400 bg-orange-500/10',
    defaultScores: { accuracy: 60, hintsUsed: 2, timeMultiplier: 1.3 },
  },
]

interface TrailLearnerPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  graph: TrailGraph
}

export const TrailLearnerPreviewModal: React.FC<TrailLearnerPreviewModalProps> = ({
  isOpen,
  onClose,
  graph,
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<SimulationProfileId>('high_performer')
  const [simulatedState, setSimulatedState] = useState<LearnerTrailState>(() =>
    createInitialSimulatedState(graph.trackId),
  )

  const activeProfile =
    SIMULATION_PROFILES.find((p) => p.id === selectedProfileId) || SIMULATION_PROFILES[0]

  // Avaliação determinística da progressão com o motor
  const evaluation = DeterministicProgressionEngine.evaluateTrail(graph, simulatedState)

  function createInitialSimulatedState(trackId: string): LearnerTrailState {
    return {
      userId: 'simulated-student-preview',
      trackId,
      currentActiveNodeId: graph.nodes[0]?.id,
      nodesProgress: {},
      totalXpEarned: 0,
      unlockedAchievementNodeIds: [],
      lastUpdatedAt: new Date().toISOString(),
    }
  }

  const handleSimulateProfileExecution = (profile: SimulationProfile) => {
    setSelectedProfileId(profile.id)
    const newState = createInitialSimulatedState(graph.trackId)
    let cumulativeXp = 0

    // Simula a execução nó por nó conforme as regras do perfil
    for (const node of graph.nodes) {
      if (node.data.nodeType === 'start') {
        newState.nodesProgress[node.id] = {
          nodeId: node.id,
          status: 'completed',
          attempts: 1,
          bestScorePercentage: 100,
          hintsUsedCount: 0,
          timeSpentSeconds: 120,
          competencyScores: {},
          completedAt: new Date().toISOString(),
          loopCycleCount: 0,
        }
        cumulativeXp += node.data.xpReward
        continue
      }

      // Se for o perfil "struggling", falha na avaliação para acionar o caminho de reforço
      let score = profile.defaultScores.accuracy
      if (
        profile.id === 'struggling' &&
        (node.id === 'node-avaliacao' || node.id === 'node-missao-pratica')
      ) {
        score = 45
      }

      const result = DeterministicProgressionEngine.submitNodeAttempt(
        node,
        {
          scorePercentage: score,
          hintsUsed: profile.defaultScores.hintsUsed,
          timeSpentSeconds:
            (node.data.estimatedMinutes || 10) * 60 * profile.defaultScores.timeMultiplier,
        },
        newState.nodesProgress[node.id],
      )

      if (result.isPassed) {
        newState.nodesProgress[node.id] = result.updatedProgress
        cumulativeXp += node.data.xpReward
      } else {
        newState.nodesProgress[node.id] = result.updatedProgress
        // Interrompe avanço se o nó obrigatório for reprovado
        if (node.data.rules?.isRequired) break
      }
    }

    newState.totalXpEarned = cumulativeXp
    setSimulatedState(newState)
  }

  const handleResetSimulation = () => {
    setSimulatedState(createInitialSimulatedState(graph.trackId))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-[#0C1317] border-[#294149] text-[#E6EAED] p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <DialogHeader className="border-b border-[#294149] p-4 bg-[#152228]/60">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#01B59A] uppercase tracking-wider mb-1">
                <Sparkles className="h-4 w-4" />
                <span>Simulador Pedagógico • Visualizar como Aluno</span>
              </div>
              <DialogTitle className="text-lg font-bold text-white">{graph.title}</DialogTitle>
              <DialogDescription className="text-xs text-[#A8BBC0] mt-0.5">
                Modo de simulação estrita: NÃO gera XP real, matrículas ou métricas no banco.
              </DialogDescription>
            </div>

            <Badge
              variant="outline"
              className="border-amber-500/40 text-amber-400 bg-amber-500/10 text-xs"
            >
              Simulação Sem Impacto Real
            </Badge>
          </div>
        </DialogHeader>

        {/* Barra de Perfis de Simulação */}
        <div className="border-b border-[#294149] p-3 bg-[#0C1317] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A8BBC0] font-mono">
              Selecione um Perfil de Estudante para Simular:
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetSimulation}
              className="h-7 text-xs border-[#294149] hover:bg-[#152228]"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Reiniciar Simulação
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {SIMULATION_PROFILES.map((prof) => (
              <button
                key={prof.id}
                onClick={() => handleSimulateProfileExecution(prof)}
                className={`flex flex-col text-left rounded-lg border p-2 text-xs transition-all ${
                  selectedProfileId === prof.id
                    ? `${prof.badgeColor} border-current ring-1 ring-current`
                    : 'border-[#294149] bg-[#152228]/40 hover:bg-[#152228] text-[#A8BBC0]'
                }`}
              >
                <span className="font-bold text-white truncate">{prof.label}</span>
                <span className="text-[10px] opacity-80 mt-1 line-clamp-2 leading-tight">
                  {prof.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Resumo da Progressão do Perfil */}
        <div className="border-b border-[#294149] px-4 py-2 bg-[#152228]/30 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[#A8BBC0]">Conclusão: </span>
              <span className="font-bold text-[#01B59A]">
                {evaluation.overallCompletionPercentage}%
              </span>
            </div>
            <div>
              <span className="text-[#A8BBC0]">Nós Concluídos: </span>
              <span className="font-bold text-white">
                {evaluation.completedNodeIds.length} de {graph.nodes.length}
              </span>
            </div>
            <div>
              <span className="text-[#A8BBC0]">XP Simulado: </span>
              <span className="font-bold text-[#C69B4B]">+{simulatedState.totalXpEarned} XP</span>
            </div>
          </div>

          {evaluation.recommendedNextNodeId && (
            <div className="text-[11px] text-[#01B59A] flex items-center gap-1 font-sans">
              <span>Próxima recomendada:</span>
              <span className="font-bold font-mono">
                {graph.nodes.find((n) => n.id === evaluation.recommendedNextNodeId)?.data.title}
              </span>
            </div>
          )}
        </div>

        {/* Lista Visual dos Nós Simulados (Mapa do Aluno) */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3 max-w-2xl mx-auto">
            {graph.nodes.map((node, index) => {
              const def = getNodeTypeDefinition(node.data.nodeType)
              const Icon = def.icon
              const evalResult = evaluation.evaluatedNodes[node.id]
              const progress = simulatedState.nodesProgress[node.id]
              const isCompleted = evalResult?.status === 'completed'
              const isAvailable =
                evalResult?.status === 'available' || evalResult?.status === 'in_progress'
              const isLocked = evalResult?.status === 'locked'

              return (
                <div
                  key={node.id}
                  className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${
                    isCompleted
                      ? 'border-[#01B59A]/60 bg-[#01B59A]/5'
                      : isAvailable
                        ? 'border-[#01B59A] bg-[#152228] shadow-md ring-1 ring-[#01B59A]/30'
                        : 'border-[#294149]/60 bg-[#0C1317]/50 opacity-60'
                  }`}
                >
                  {/* Ícone de status */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold border ${
                      isCompleted
                        ? 'border-[#01B59A] bg-[#01B59A]/20 text-[#01B59A]'
                        : isAvailable
                          ? 'border-[#01B59A] bg-[#01B59A] text-black font-extrabold'
                          : 'border-[#294149] bg-[#152228] text-[#A8BBC0]'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : isLocked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Detalhes do Nó */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-[#01B59A] uppercase tracking-wider">
                          {def.shortLabel}
                        </span>
                        {node.data.rules?.isRequired && (
                          <span className="text-[9px] text-[#A8BBC0] font-mono">• Obrigatório</span>
                        )}
                      </div>

                      {progress?.bestScorePercentage !== undefined && (
                        <span className="text-[11px] font-mono font-bold text-[#01B59A]">
                          Score: {progress.bestScorePercentage}%
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white mt-0.5">{node.data.title}</h4>
                    <p className="text-xs text-[#A8BBC0] mt-0.5 line-clamp-2">
                      {node.data.description}
                    </p>

                    {/* Feedback pedagógico da simulação */}
                    {evalResult && (
                      <div className="mt-2 text-[10px] font-mono text-[#A8BBC0]">
                        <span className="text-white/60">Motivo: </span>
                        <span>{evalResult.reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
