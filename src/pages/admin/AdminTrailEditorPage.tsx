import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { TrailGraph, TrailNode, TrailEdge, TrailNodeType, TrailNodeData } from '@/types/trailGraph'
import {
  TrailGraphService,
  GraphValidationReport,
  GraphValidationError,
} from '@/services/trailGraphService'
import { BlockService } from '@/services/blockService'
import { ContentBlock } from '@/types/cms'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

import { CustomTrailNodeComponent } from '@/components/trail/CustomTrailNodeComponent'
import { TrailLeftPanel } from '@/components/trail/TrailLeftPanel'
import { TrailRightPanel } from '@/components/trail/TrailRightPanel'
import { TrailLearnerPreviewModal } from '@/components/trail/TrailLearnerPreviewModal'
import { getNodeTypeDefinition } from '@/components/trail/nodeTypesRegistry'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Undo2,
  Redo2,
  Trash2,
  LayoutGrid,
} from 'lucide-react'

const nodeTypes = {
  customTrailNode: CustomTrailNodeComponent,
}

export default function AdminTrailEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAdmin, isEditorial } = useAuth()
  const { toast } = useToast()

  const [graph, setGraph] = useState<TrailGraph | null>(null)
  const [availableBlocks, setAvailableBlocks] = useState<ContentBlock[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [validationReport, setValidationReport] = useState<GraphValidationReport | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [publishChangelog, setPublishChangelog] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Histórico para Desfazer / Refazer
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Carrega trilha e blocos da biblioteca
  useEffect(() => {
    async function init() {
      if (!id) return
      let g = await TrailGraphService.getGraphByTrackId(id)
      if (!g) {
        // Se id for "novo" ou não existir, busca qualquer existente ou fallback
        const all = await TrailGraphService.listAllGraphs()
        g = all[0] || null
      }
      if (g) {
        setGraph(g)
        // Converte TrailNode para React Flow Node
        const flowNodes: Node[] = g.nodes.map((n) => ({
          id: n.id,
          type: 'customTrailNode',
          position: n.position,
          data: n.data,
        }))
        const flowEdges: Edge[] = g.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          type: 'smoothstep',
          animated: e.conditionType === 'always',
          style: {
            stroke:
              e.conditionType === 'on_failure'
                ? '#F97316'
                : e.conditionType === 'on_success'
                  ? '#01B59A'
                  : '#294149',
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: e.conditionType === 'on_failure' ? '#F97316' : '#01B59A',
          },
        }))
        setNodes(flowNodes)
        setEdges(flowEdges)
        setHistory([{ nodes: flowNodes, edges: flowEdges }])
        setHistoryIndex(0)
      }

      const blocks = await BlockService.listBlocks()
      setAvailableBlocks(blocks)
    }
    init()
  }, [id, setNodes, setEdges])

  // Sincroniza nós e arestas de volta para o modelo TrailGraph de domínio
  const buildCurrentTrailGraph = useCallback((): TrailGraph | null => {
    if (!graph) return null
    const domainNodes: TrailNode[] = nodes.map((n) => ({
      id: n.id,
      unitId: 'unit-1',
      position: n.position,
      data: n.data as unknown as TrailNodeData,
    }))
    const domainEdges: TrailEdge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      conditionType: e.id.includes('revisao') ? 'on_failure' : 'always',
      label: typeof e.label === 'string' ? e.label : undefined,
      isOptionalBranch: false,
    }))
    return {
      ...graph,
      nodes: domainNodes,
      edges: domainEdges,
      updatedAt: new Date().toISOString(),
    }
  }, [graph, nodes, edges])

  // Desfazer
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1]
      setNodes(prev.nodes)
      setEdges(prev.edges)
      setHistoryIndex(historyIndex - 1)
    }
  }, [history, historyIndex, setNodes, setEdges])

  // Refazer
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1]
      setNodes(next.nodes)
      setEdges(next.edges)
      setHistoryIndex(historyIndex + 1)
    }
  }, [history, historyIndex, setNodes, setEdges])

  // Conectar arestas no canvas
  const onConnect = useCallback(
    (connection: Connection) => {
      // Validação rápida: nó inicial não recebe conexões
      const targetNode = nodes.find((n) => n.id === connection.target)
      const targetData = targetNode?.data as unknown as TrailNodeData | undefined
      if (targetData?.nodeType === 'start') {
        toast({
          title: 'Conexão inválida',
          description: 'O nó inicial de partida não pode receber conexões de entrada.',
          variant: 'destructive',
        })
        return
      }

      const newEdge: Edge = {
        ...connection,
        id: `edge-${Date.now()}`,
        type: 'smoothstep',
        style: { stroke: '#01B59A', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#01B59A' },
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [nodes, setEdges, toast],
  )

  // Adicionar novo nó
  const handleAddNode = useCallback(
    (type: TrailNodeType, block?: ContentBlock) => {
      const def = getNodeTypeDefinition(type)
      const newNodeId = `node-${type}-${Date.now().toString().slice(-5)}`
      const newNode: Node = {
        id: newNodeId,
        type: 'customTrailNode',
        position: {
          x: 200 + nodes.length * 60,
          y: 180 + (nodes.length % 2 === 0 ? 0 : 80),
        },
        data: {
          title: block ? block.title : def.title,
          description: block ? block.description || '' : def.description,
          nodeType: type,
          estimatedMinutes: block?.estimatedMinutes || def.defaultMinutes,
          xpReward: def.defaultXp,
          competencies: block?.associatedCompetencies || [],
          blockId: block?.id,
          blockType: block?.blockType,
          blockVersion: block?.version,
          rules: {
            requireAllPrerequisites: true,
            prerequisiteNodeIds: [],
            isRequired: true,
            requireZeroHints: false,
            maxLoopCycles: 3,
          },
          onErrorBehavior: 'retry_allowed',
          supplementaryResources: [],
          rendererStatus: 'available',
        },
      }

      setNodes((nds) => [...nds, newNode])
      setSelectedNodeId(newNodeId)
      toast({
        title: 'Nó adicionado',
        description: `O nó "${def.shortLabel}" foi posicionado no canvas.`,
      })
    },
    [nodes.length, setNodes, toast],
  )

  // Duplicar nó
  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      const original = nodes.find((n) => n.id === nodeId)
      if (!original) return
      const dupId = `node-dup-${Date.now().toString().slice(-5)}`
      const originalData = original.data as unknown as TrailNodeData
      const dupNode: Node = {
        id: dupId,
        type: 'customTrailNode',
        position: { x: original.position.x + 40, y: original.position.y + 40 },
        data: {
          ...originalData,
          title: `${originalData.title} (Cópia)`,
        },
      }
      setNodes((nds) => [...nds, dupNode])
      setSelectedNodeId(dupId)
      toast({ title: 'Nó duplicado com sucesso' })
    },
    [nodes, setNodes, toast],
  )

  // Excluir nó
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId))
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
      setSelectedNodeId(null)
      toast({ title: 'Nó removido do fluxo' })
    },
    [setNodes, setEdges, toast],
  )

  // Atualizar dados de um nó
  const handleUpdateNodeData = useCallback(
    (nodeId: string, updatedData: TrailNodeData) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              data: updatedData,
            }
          }
          return n
        }),
      )
    },
    [setNodes],
  )

  // Salvar Rascunho com Optimistic Locking e tratamento de conflito
  const handleSaveDraft = async () => {
    const currentGraph = buildCurrentTrailGraph()
    if (!currentGraph) return
    setIsSaving(true)
    try {
      const res = await TrailGraphService.saveGraphDraft(
        currentGraph,
        user?.role,
        currentGraph.revision,
      )

      if (res.conflict) {
        toast({
          title: 'Conflito de Edição Concorrente!',
          description:
            res.message ||
            'Outro usuário ou sessão salvou uma alteração nesta trilha. Recarregue os dados para sincronizar antes de sobrescrever.',
          variant: 'destructive',
        })
        return
      }

      setGraph(res.graph)
      setValidationReport(res.validation)
      toast({
        title: 'Trilha salva no Supabase com sucesso',
        description: res.validation.isValid
          ? `Estrutura salva na revisão r${res.graph.revision}. Sem erros impeditivos.`
          : `Revisão r${res.graph.revision} salva. Atenção: ${res.validation.errors.length} erro(s) pendentes para publicação.`,
      })
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar rascunho',
        description: err instanceof Error ? err.message : 'Falha na persistência.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Publicar Versão Imutável com snapshot
  const handleConfirmPublish = async () => {
    if (!graph) return
    setIsPublishing(true)
    try {
      const currentGraph = buildCurrentTrailGraph()
      if (currentGraph) {
        await TrailGraphService.saveGraphDraft(currentGraph, user?.role)
      }

      const res = await TrailGraphService.publishGraphVersion(
        graph.trackId,
        user?.name || 'Administrador Responsável',
        publishChangelog,
        user?.role,
        availableBlocks.map((b) => b.id),
      )

      if (!res.success) {
        setValidationReport({
          isValid: false,
          errors: res.errors || [],
          warnings: [],
        })
        toast({
          title: 'Bloqueio de Publicação',
          description: 'Corrija os erros apontados no grafo antes de publicar.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Versão Publicada com Sucesso!',
          description: `Snapshot imutável v${res.publishedVersion?.version} registrado para os alunos.`,
        })
        setPublishModalOpen(false)
        setPublishChangelog('')
        // Recarrega trilha atualizada
        const updated = await TrailGraphService.getGraphByTrackId(graph.trackId)
        if (updated) setGraph(updated)
      }
    } catch (err: unknown) {
      toast({
        title: 'Acesso negado ou erro ao publicar',
        description: err instanceof Error ? err.message : 'Falha na autorização.',
        variant: 'destructive',
      })
    } finally {
      setIsPublishing(false)
    }
  }

  // Organização automática simples das posições
  const handleAutoLayout = () => {
    setNodes((nds) =>
      nds.map((n, i) => ({
        ...n,
        position: {
          x: 100 + i * 260,
          y: i % 2 === 0 ? 200 : 280,
        },
      })),
    )
    toast({ title: 'Layout organizado linearmente' })
  }

  const selectedNode = useMemo(() => {
    const raw = nodes.find((n) => n.id === selectedNodeId)
    if (!raw) return null
    return {
      id: raw.id,
      unitId: 'unit-1',
      position: raw.position,
      data: raw.data as unknown as TrailNodeData,
    } as TrailNode
  }, [nodes, selectedNodeId])

  return (
    <div className="flex h-[calc(100vh-60px)] flex-col bg-[#0C1317] text-[#E6EAED]">
      {/* Barra de Ferramentas Superior */}
      <div className="flex items-center justify-between border-b border-[#294149] bg-[#0C1317] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-[#A8BBC0] hover:text-white"
          >
            <Link to="/admin/cursos">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              <span>Voltar aos Cursos</span>
            </Link>
          </Button>

          <div className="h-4 w-[1px] bg-[#294149]" />

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white truncate max-w-xs md:max-w-md">
                {graph?.title || 'Editor Visual de Trilhas'}
              </h2>
              <Badge
                variant="outline"
                className={`text-[9px] uppercase font-mono ${
                  graph?.status === 'published'
                    ? 'border-[#01B59A]/40 text-[#01B59A] bg-[#01B59A]/10'
                    : 'border-[#C69B4B]/40 text-[#C69B4B] bg-[#C69B4B]/10'
                }`}
              >
                {graph?.status === 'published' ? `Publicado v${graph.version}` : 'Rascunho'}
              </Badge>
            </div>
            <p className="text-[10px] text-[#A8BBC0] font-mono">
              {nodes.length} nós • {edges.length} conexões • Modelo JSON Tipado
            </p>
          </div>
        </div>

        {/* Ações Centrais / Histórico */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="h-8 w-8 p-0 text-[#A8BBC0] hover:text-white"
            title="Desfazer"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="h-8 w-8 p-0 text-[#A8BBC0] hover:text-white"
            title="Refazer"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAutoLayout}
            className="h-8 text-xs text-[#A8BBC0] hover:text-white"
            title="Auto Organizar Canvas"
          >
            <LayoutGrid className="h-3.5 w-3.5 mr-1" /> Auto Organizar
          </Button>
        </div>

        {/* Botões de Ação Final */}
        <div className="flex items-center gap-2">
          {/* Pré-visualizar como aluno */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPreviewModalOpen(true)}
            className="h-8 text-xs border-[#294149] bg-[#152228]/50 text-white hover:bg-[#152228]"
          >
            <Eye className="h-3.5 w-3.5 mr-1 text-[#01B59A]" />
            <span>Visualizar como Aluno</span>
          </Button>

          {/* Salvar Rascunho */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="h-8 text-xs border-[#01B59A]/40 text-[#01B59A] hover:bg-[#01B59A]/10"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Grafo'}</span>
          </Button>

          {/* Publicar (restrito a admin+) */}
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => setPublishModalOpen(true)}
              className="h-8 text-xs bg-[#01B59A] text-black font-semibold hover:bg-[#01B59A]/90"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              <span>Publicar Snapshot</span>
            </Button>
          )}
        </div>
      </div>

      {/* Relatório de Erros de Validação se houver */}
      {validationReport && !validationReport.isValid && (
        <div className="flex items-center gap-2 bg-rose-950/80 border-b border-rose-800 px-4 py-1.5 text-xs text-rose-200">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <span className="font-semibold">Atenção:</span>
          <span>
            {validationReport.errors.length} erro(s) impedem a publicação:{' '}
            {validationReport.errors.map((e) => e.message).join(' | ')}
          </span>
        </div>
      )}

      {/* Área Principal dos 3 Painéis */}
      <div className="flex flex-1 overflow-hidden">
        {/* Painel Esquerdo: Biblioteca de Blocos e 9 Nós */}
        <TrailLeftPanel availableBlocks={availableBlocks} onAddNode={handleAddNode} />

        {/* Canvas Central com @xyflow/react */}
        <div className="flex-1 h-full bg-[#080D0F] relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Background color="#294149" gap={20} size={1} />
            <Controls className="!bg-[#0C1317] !border-[#294149] !text-white !fill-white" />
            <MiniMap
              nodeColor={() => '#01B59A'}
              maskColor="rgba(12, 19, 23, 0.7)"
              className="!bg-[#0C1317] !border-[#294149]"
            />
          </ReactFlow>
        </div>

        {/* Painel Direito: Propriedades do Nó Selecionado */}
        <TrailRightPanel
          selectedNode={selectedNode}
          allNodes={nodes.map((n) => ({
            id: n.id,
            unitId: 'unit-1',
            position: n.position,
            data: n.data as unknown as TrailNodeData,
          }))}
          availableBlocks={availableBlocks}
          onUpdateNodeData={handleUpdateNodeData}
          onDuplicateNode={handleDuplicateNode}
          onDeleteNode={handleDeleteNode}
        />
      </div>

      {/* Modal de Simulação do Aluno */}
      {graph && (
        <TrailLearnerPreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          graph={buildCurrentTrailGraph() || graph}
        />
      )}

      {/* Modal de Confirmação de Publicação */}
      <Dialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
        <DialogContent className="max-w-md bg-[#0C1317] border-[#294149] text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#01B59A]" />
              Publicar Snapshot Imutável da Trilha
            </DialogTitle>
            <DialogDescription className="text-xs text-[#A8BBC0]">
              A publicação cria um snapshot imutável em{' '}
              <code className="text-[#01B59A]">trail_graph_versions</code>. Alunos matriculados
              receberão esta versão sem modificações silenciosas posteriores.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs text-[#A8BBC0]">Changelog da Versão</Label>
              <Input
                placeholder="Ex: Inclusão de portão adaptativo e nós de revisão de vigas"
                value={publishChangelog}
                onChange={(e) => setPublishChangelog(e.target.value)}
                className="text-xs bg-[#152228] border-[#294149] text-white"
              />
            </div>
            <div className="rounded bg-[#152228] p-2.5 text-[11px] text-[#A8BBC0] font-mono border border-[#294149]">
              <div>
                Publicador: <span className="text-white">{user?.name}</span>
              </div>
              <div>
                Papel: <span className="text-[#01B59A]">{user?.role}</span>
              </div>
              <div>
                Próxima Versão: <span className="text-white">v{(graph?.version || 1) + 1}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPublishModalOpen(false)}
              className="text-xs border-[#294149]"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={isPublishing}
              onClick={handleConfirmPublish}
              className="bg-[#01B59A] text-black font-semibold text-xs hover:bg-[#01B59A]/90"
            >
              {isPublishing ? 'Publicando...' : 'Confirmar e Publicar Snapshot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
