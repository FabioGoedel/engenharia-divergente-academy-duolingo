import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lock,
  RotateCcw,
  BookOpen,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { CoursesService } from '@/services/coursesService'
import { TrackDetail, TrackModule } from '@/data/demoData'
import { TrailGraph, LearnerTrailState } from '@/types/trailGraph'
import { TrailGraphService } from '@/services/trailGraphService'
import { DeterministicProgressionEngine } from '@/services/progressionEngine'
import { getNodeTypeDefinition } from '@/components/trail/nodeTypesRegistry'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function TrackVisualMapPage() {
  const { slug } = useParams<{ slug: string }>()
  const [track, setTrack] = useState<TrackDetail | null>(null)
  const [trailGraph, setTrailGraph] = useState<TrailGraph | null>(null)
  const [learnerState, setLearnerState] = useState<LearnerTrailState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (slug) {
        const data = await CoursesService.getTrackBySlug(slug)
        setTrack(data)

        // Carrega o Grafo Pedagógico correspondente se existir
        const g = await TrailGraphService.getGraphByTrackId(slug)
        if (g) {
          setTrailGraph(g)
          // Cria estado inicial do aluno para exibição do mapa gamificado
          const initialLearner: LearnerTrailState = {
            userId: 'current-student',
            trackId: g.trackId,
            currentActiveNodeId: g.nodes[1]?.id || g.nodes[0]?.id,
            nodesProgress: {
              [g.nodes[0]?.id]: {
                nodeId: g.nodes[0]?.id,
                status: 'completed',
                attempts: 1,
                hintsUsedCount: 0,
                timeSpentSeconds: 60,
                competencyScores: {},
                completedAt: new Date().toISOString(),
                loopCycleCount: 0,
              },
            },
            totalXpEarned: 15,
            unlockedAchievementNodeIds: [],
            lastUpdatedAt: new Date().toISOString(),
          }
          setLearnerState(initialLearner)
        }
      }
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-3" />
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
          Carregando mapa visual da trilha...
        </p>
      </div>
    )
  }

  if (!track) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Trilha não encontrada</h2>
        <p className="text-xs text-muted-foreground">
          O identificador da trilha solicitada não consta no catálogo demonstrativo.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/app/trilhas">Voltar ao Catálogo</Link>
        </Button>
      </div>
    )
  }

  const renderModuleStatusBadge = (state: TrackModule['state']) => {
    switch (state) {
      case 'concluido':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#1D957A]/15 text-[#1D957A] border border-[#1D957A]/30">
            <CheckCircle2 className="h-3 w-3" />
            Concluído
          </span>
        )
      case 'disponivel':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#01B59A]/15 text-[#01B59A] border border-[#01B59A]/30">
            <Sparkles className="h-3 w-3" />
            Disponível
          </span>
        )
      case 'revisao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#C69B4B]/15 text-[#C69B4B] border border-[#C69B4B]/30">
            <RotateCcw className="h-3 w-3" />
            Em Revisão
          </span>
        )
      case 'bloqueado':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-muted text-muted-foreground border border-border">
            <Lock className="h-3 w-3" />
            Bloqueado
          </span>
        )
    }
  }

  return (
    <div className="space-y-8">
      {/* Botão de Retorno e Título */}
      <div>
        <Link
          to="/app/trilhas"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Voltar para todas as trilhas</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider mb-1">
              <span>Mapa Visual de Trilha</span>
              <span>•</span>
              <span>{track.level}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {track.title}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-3xl">
              {track.headline}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                track.hasEntitlement
                  ? 'border-[#01B59A]/40 text-[#01B59A] bg-[#01B59A]/10 font-mono text-xs px-3 py-1'
                  : 'border-[#C69B4B]/40 text-[#C69B4B] bg-[#C69B4B]/10 font-mono text-xs px-3 py-1'
              }
            >
              {track.hasEntitlement ? 'Entitlement Ativo' : 'Bloqueado por Entitlement'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Se Trilha For Bloqueada: Aviso Rigoroso */}
      {!track.hasEntitlement && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-500 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-foreground">
              Acesso Fechado • Política de Entitlements da Engenharia Divergente
            </p>
            <p className="text-muted-foreground leading-relaxed">{track.entitlementReason}</p>
            <p className="text-[11px] text-muted-foreground pt-1">
              Status do módulo de compra/checkout:{' '}
              <span className="font-mono text-[#C69B4B] font-semibold">PENDENTE — Fase 2</span>.
            </p>
          </div>
        </div>
      )}

      {/* Grid com Metadados e Pré-requisitos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-mono uppercase text-muted-foreground">
              Carga Horária Total
            </p>
            <p className="text-xl font-bold text-foreground font-mono">{track.totalHours} Horas</p>
            <p className="text-[11px] text-muted-foreground">
              Teoria, exercícios e análises numéricas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-mono uppercase text-muted-foreground">
              Módulos Estruturados
            </p>
            <p className="text-xl font-bold text-foreground font-mono">
              {track.modules.length} Etapas
            </p>
            <p className="text-[11px] text-muted-foreground">Progressão sequencial sem atalhos</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-mono uppercase text-muted-foreground">
              Pré-requisitos Recomendados
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {track.prerequisites.map((p, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground font-mono border border-border"
                >
                  {p}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAPA GAMIFICADO DO ALUNO GERADO PELO GRAFO PEDAGÓGICO (ESTILO DUOLINGO SÓBRIO / TÉCNICO) */}
      {trailGraph && learnerState ? (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  Jornada de Aprendizagem Adaptativa
                </h2>
                <Badge
                  variant="outline"
                  className="border-[#01B59A]/40 text-[#01B59A] bg-[#01B59A]/10 text-[10px] font-mono"
                >
                  Motor Grafo v{trailGraph.version}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Mapa pedagógico gerado a partir do grafo determinístico com ramificações adaptativas
                e salvaguardas anti-loop.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-muted-foreground">Progresso:</span>
              <span className="text-primary font-bold">
                {
                  DeterministicProgressionEngine.evaluateTrail(trailGraph, learnerState)
                    .overallCompletionPercentage
                }
                %
              </span>
            </div>
          </div>

          {/* Trilha Linear/Gamificada com Nós Interativos */}
          <div className="space-y-6 relative before:absolute before:top-6 before:bottom-6 before:left-6 before:w-0.5 before:bg-border md:before:left-8">
            {trailGraph.nodes.map((node, index) => {
              const evalData = DeterministicProgressionEngine.evaluateTrail(
                trailGraph,
                learnerState,
              )
              const nodeEval = evalData.evaluatedNodes[node.id]
              const isCompleted = nodeEval?.status === 'completed'
              const isAvailable =
                nodeEval?.status === 'available' || nodeEval?.status === 'in_progress'
              const isLocked = nodeEval?.status === 'locked' || !track.hasEntitlement
              const def = getNodeTypeDefinition(node.data.nodeType)
              const Icon = def.icon

              return (
                <div key={node.id} className="relative flex items-start gap-4 md:gap-6 group">
                  {/* Marcador do Nó */}
                  <div
                    className={`relative z-10 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl border-2 font-mono font-bold text-sm md:text-base shrink-0 transition-transform group-hover:scale-105 shadow-sm ${
                      isCompleted
                        ? 'border-[#01B59A] bg-[#01B59A]/15 text-[#01B59A]'
                        : isAvailable
                          ? 'border-[#01B59A] bg-[#01B59A] text-black ring-4 ring-[#01B59A]/20'
                          : 'border-border bg-card text-muted-foreground opacity-70'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : isLocked ? (
                      <Lock className="h-5 w-5" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>

                  {/* Conteúdo Pedagógico do Nó */}
                  <Card
                    className={`flex-1 bg-card border-border transition-all ${
                      isAvailable ? 'border-primary shadow-sm' : ''
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider">
                              {def.shortLabel}
                            </span>
                            {node.data.rules?.isRequired && (
                              <span className="text-[9px] text-muted-foreground font-mono">
                                • Etapa Obrigatória
                              </span>
                            )}
                          </div>
                          <CardTitle className="text-sm md:text-base font-bold text-foreground">
                            {node.data.title}
                          </CardTitle>
                        </div>

                        <div className="shrink-0">
                          {renderModuleStatusBadge(
                            isCompleted ? 'concluido' : isAvailable ? 'disponivel' : 'bloqueado',
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {node.data.description}
                      </p>

                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border text-[11px] font-mono text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {node.data.estimatedMinutes} min
                          </span>
                          <span className="text-primary font-semibold flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />+{node.data.xpReward} XP
                          </span>
                        </div>

                        {/* Botão de Ação / Iniciar */}
                        {isAvailable && track.hasEntitlement && (
                          <Button
                            asChild
                            size="sm"
                            className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-mono font-bold text-xs shrink-0 h-8"
                          >
                            <Link
                              to={
                                node.data.missionId
                                  ? `/app/atividade/${node.data.missionId}`
                                  : node.data.blockId
                                    ? `/app/bloco?id=${node.data.blockId}`
                                    : `/app/atividade/mis-resmat-flexao-01`
                              }
                            >
                              {isCompleted ? 'Revisar Atividade' : 'Iniciar Atividade'}{' '}
                              <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Sequência Linear da Trilha</h2>
              <p className="text-xs text-muted-foreground">
                Estados demonstrativos: concluído, disponível, em revisão e bloqueado.
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Dataset Demo Identificado
            </span>
          </div>

          <div className="space-y-4 relative before:absolute before:top-4 before:bottom-4 before:left-6 before:w-0.5 before:bg-border md:before:left-8">
            {track.modules.map((mod, index) => {
              const isCompleted = mod.state === 'concluido'
              const isCurrent = mod.state === 'disponivel'
              const isReview = mod.state === 'revisao'
              const isLocked = mod.state === 'bloqueado' || !track.hasEntitlement

              return (
                <div key={mod.id} className="relative flex items-start gap-4 md:gap-6 group">
                  {/* Marcador Numérico do Nó */}
                  <div
                    className={`relative z-10 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl border-2 font-mono font-bold text-sm md:text-base shrink-0 transition-transform group-hover:scale-105 shadow-sm ${
                      isCompleted
                        ? 'border-[#1D957A] bg-[#1D957A]/15 text-[#1D957A]'
                        : isCurrent
                          ? 'border-[#01B59A] bg-[#01B59A] text-black ring-4 ring-[#01B59A]/20'
                          : isReview
                            ? 'border-[#C69B4B] bg-[#C69B4B]/15 text-[#C69B4B]'
                            : 'border-border bg-card text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : isLocked ? (
                      <Lock className="h-5 w-5" />
                    ) : (
                      <span>0{mod.order}</span>
                    )}
                  </div>

                  {/* Conteúdo do Módulo */}
                  <Card
                    className={`flex-1 bg-card border-border transition-all ${
                      isCurrent ? 'border-primary shadow-sm' : ''
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <CardTitle className="text-sm md:text-base font-bold text-foreground">
                          {mod.title}
                        </CardTitle>
                        {renderModuleStatusBadge(isLocked ? 'bloqueado' : mod.state)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {mod.description}
                      </p>

                      {/* Tópicos Chave */}
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          Tópicos abordados:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {mod.topics.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-muted/70 text-[11px] text-foreground font-mono border border-border"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border text-[11px] font-mono text-muted-foreground">
                        <span>Estimativa: {mod.estimatedHours} horas de dedicação</span>
                        {isCurrent && track.hasEntitlement && (
                          <span className="text-[#01B59A] font-semibold flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Próxima etapa ativa
                          </span>
                        )}
                      </div>

                      {/* Acesso à MISSÃO INTERATIVA Canônica de Resistência dos Materiais */}
                      {mod.id === 'mod-2' && track.hasEntitlement && (
                        <div className="mt-3 p-3 rounded-xl border border-[#01B59A]/40 bg-[#01B59A]/10 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-[#01B59A]">
                                <Sparkles className="h-3 w-3" /> Missão Interativa Prática
                              </span>
                              <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                Resistência dos Materiais — Flexão de Vigas
                              </h4>
                              <p className="text-[11px] text-muted-foreground">
                                5 exercícios progressivos com calculadora técnica e verificação de
                                tensões.
                              </p>
                            </div>

                            <Button
                              asChild
                              size="sm"
                              className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-mono font-bold text-xs shrink-0 h-8"
                            >
                              <Link to="/app/atividade/mis-resmat-flexao-01">
                                Iniciar Missão <ArrowRight className="h-3.5 w-3.5 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
