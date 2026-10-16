import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, BookOpen, Clock } from 'lucide-react'
import { CoursesService } from '@/services/coursesService'
import { TrackDetail } from '@/data/demoData'
import { TrailGraph } from '@/types/trailGraph'
import { TrailGraphService } from '@/services/trailGraphService'
import { ProgressService } from '@/services/progressService'
import { useAuth } from '@/contexts/AuthContext'
import {
  LearningPath,
  LearningPathNodeData,
  LearningPathNodeStatus,
  MissionPreview,
} from '@/components/trail/LearningPath'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function TrackVisualMapPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const [track, setTrack] = useState<TrackDetail | null>(null)
  const [trailGraph, setTrailGraph] = useState<TrailGraph | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<LearningPathNodeData | null>(null)
  const [pathNodes, setPathNodes] = useState<LearningPathNodeData[]>([])

  useEffect(() => {
    async function load() {
      if (!slug) return
      setLoading(true)

      try {
        const trackData = await CoursesService.getTrackBySlug(slug)
        setTrack(trackData)

        const graph = await TrailGraphService.getGraphByTrackId(slug)
        setTrailGraph(graph)

        // Carrega progresso real do aluno
        let realProgress: Record<string, { status: string; score?: number }> = {}
        if (user && !user.isDemo) {
          realProgress = await ProgressService.getStudentTrailProgress(user.id, slug)
        }

        // Converte os nós do grafo em itens da trilha Duolingo
        if (graph && graph.nodes.length > 0) {
          let foundCurrent = false

          const converted: LearningPathNodeData[] = graph.nodes.map((node, idx) => {
            const nodeProg = realProgress[node.id] || realProgress[node.data.missionId || '']
            const isCompletedReal = nodeProg?.status === 'completed'

            let status: LearningPathNodeStatus = 'locked'
            if (isCompletedReal) {
              status = 'completed'
            } else if (!foundCurrent) {
              // Primeiro nó não concluído é o nó Atual/Disponível
              status = 'current'
              foundCurrent = true
            } else {
              status = 'locked'
            }

            return {
              id: node.id,
              title: node.data.title,
              shortLabel: `Missão ${idx + 1}`,
              description: node.data.description,
              status,
              estimatedMinutes: node.data.estimatedMinutes || 5,
              xpReward: node.data.xpReward || 15,
              actionUrl: node.data.missionId
                ? `/app/atividade/${node.data.missionId}`
                : node.data.blockId
                  ? `/app/bloco?id=${node.data.blockId}`
                  : `/app/atividade/mis-resmat-flexao-01`,
              isRequired: node.data.rules?.isRequired,
            }
          })

          setPathNodes(converted)
          // Seleciona por padrão o nó atual
          const activeNode = converted.find((n) => n.status === 'current') || converted[0]
          setSelectedNode(activeNode || null)
        } else if (trackData && trackData.modules.length > 0) {
          // Trilha fallback a partir dos módulos estruturados
          let foundCurrent = false
          const converted: LearningPathNodeData[] = trackData.modules.map((mod, idx) => {
            let status: LearningPathNodeStatus = 'locked'
            // Em conta real sem progresso, a primeira fica disponível
            if (idx === 0) {
              status = 'current'
              foundCurrent = true
            } else if (!foundCurrent) {
              status = 'current'
              foundCurrent = true
            }

            return {
              id: mod.id,
              title: mod.title,
              shortLabel: `Etapa ${idx + 1}`,
              description: mod.description,
              status,
              estimatedMinutes: 5,
              xpReward: 15,
              actionUrl: `/app/atividade/mis-resmat-flexao-01`,
            }
          })
          setPathNodes(converted)
          setSelectedNode(converted[0] || null)
        }
      } catch (err) {
        console.warn('Erro ao carregar mapa da trilha:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [slug, user])

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-3" />
        <p className="text-xs text-muted-foreground font-medium">Carregando trilha...</p>
      </div>
    )
  }

  if (!track) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Trilha não encontrada</h2>
        <p className="text-xs text-muted-foreground">
          Não foi possível carregar a trilha solicitada.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/app/trilhas">Voltar para Trilhas</Link>
        </Button>
      </div>
    )
  }

  const completedCount = pathNodes.filter((n) => n.status === 'completed').length
  const progressPercent =
    pathNodes.length > 0 ? Math.round((completedCount / pathNodes.length) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Topo Limpo: Navegação e Cabeçalho Curto */}
      <div>
        <Link
          to="/app/trilhas"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium mb-3 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Voltar para trilhas</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {track.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{track.headline}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                Progresso
              </span>
              <span className="text-sm font-bold font-mono text-primary">{progressPercent}%</span>
            </div>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trilha Interativa Estilo Duolingo */}
      <div className="relative py-4">
        {/* Cabeçalho da Unidade 1 */}
        <div className="text-center mb-6">
          <Badge
            variant="outline"
            className="text-xs font-mono border-primary/40 text-primary mb-1"
          >
            Unidade 1
          </Badge>
          <h2 className="text-base font-bold text-foreground">Fundamentos & Aplicação</h2>
        </div>

        <LearningPath
          nodes={pathNodes}
          selectedNodeId={selectedNode?.id}
          onNodeSelect={(node) => setSelectedNode(node)}
        />
      </div>

      {/* Painel Compacto de Detalhes da Missão Selecionada */}
      <MissionPreview node={selectedNode} onClose={() => setSelectedNode(null)} />
    </div>
  )
}
