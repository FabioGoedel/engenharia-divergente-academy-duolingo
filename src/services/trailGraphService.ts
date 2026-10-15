import {
  TrailGraph,
  TrailNode,
  TrailEdge,
  TrailGraphVersionSnapshot,
  TrailGraphSchema,
} from '@/types/trailGraph'
import { getBlockDefinition } from '@/components/cms/BlockRegistry'
import { Role, isAdminRole, isEditorialRole } from '@/lib/rbac'
import { BEAM_BENDING_CANONICAL_GRAPH } from '@/data/canonicalBeamBendingTrailGraph'

export interface GraphValidationError {
  nodeId?: string
  edgeId?: string
  code: string
  message: string
  severity: 'error' | 'warning'
}

export interface GraphValidationReport {
  isValid: boolean
  errors: GraphValidationError[]
  warnings: GraphValidationError[]
}

const TRAIL_GRAPHS_STORAGE_KEY = 'academy_demo_trail_graphs'
const TRAIL_VERSIONS_STORAGE_KEY = 'academy_demo_trail_versions'

/**
 * Validador estático e rigoroso da estrutura do grafo pedagógico
 * (Regra 9 do briefing)
 */
export class GraphValidator {
  public static validate(
    graph: TrailGraph,
    availableBlockIds: string[] = [],
  ): GraphValidationReport {
    const errors: GraphValidationError[] = []
    const warnings: GraphValidationError[] = []

    const nodesById = new Map<string, TrailNode>()
    graph.nodes.forEach((n) => nodesById.set(n.id, n))

    // 1. Ponto inicial válido (deve haver exatamente 1 nó 'start')
    const startNodes = graph.nodes.filter((n) => n.data.nodeType === 'start')
    if (startNodes.length === 0) {
      errors.push({
        code: 'MISSING_START_NODE',
        message: 'A trilha precisa ter exatamente 1 nó inicial (Início da Trilha).',
        severity: 'error',
      })
    } else if (startNodes.length > 1) {
      errors.push({
        nodeId: startNodes[1].id,
        code: 'MULTIPLE_START_NODES',
        message: 'A trilha não pode conter mais de 1 nó de início.',
        severity: 'error',
      })
    }

    // 2. Nó de conclusão (deve haver pelo menos 1 nó 'track_end')
    const endNodes = graph.nodes.filter((n) => n.data.nodeType === 'track_end')
    if (endNodes.length === 0) {
      errors.push({
        code: 'MISSING_END_NODE',
        message: 'A trilha deve possuir pelo menos um nó de conclusão (Final de Unidade/Trilha).',
        severity: 'error',
      })
    }

    // 3. Mapeamento de arestas
    const outgoing = new Map<string, TrailEdge[]>()
    const incoming = new Map<string, TrailEdge[]>()

    graph.edges.forEach((edge) => {
      if (!outgoing.has(edge.source)) outgoing.set(edge.source, [])
      outgoing.get(edge.source)!.push(edge)

      if (!incoming.has(edge.target)) incoming.set(edge.target, [])
      incoming.get(edge.target)!.push(edge)

      // Validação de conexões incompatíveis
      const srcNode = nodesById.get(edge.source)
      const tgtNode = nodesById.get(edge.target)

      if (!srcNode) {
        errors.push({
          edgeId: edge.id,
          code: 'INVALID_SOURCE',
          message: `Aresta aponta para nó de origem inexistente: ${edge.source}`,
          severity: 'error',
        })
      }
      if (!tgtNode) {
        errors.push({
          edgeId: edge.id,
          code: 'INVALID_TARGET',
          message: `Aresta aponta para nó de destino inexistente: ${edge.target}`,
          severity: 'error',
        })
      }

      // Nó final não pode ter saídas
      if (srcNode && srcNode.data.nodeType === 'track_end') {
        errors.push({
          nodeId: srcNode.id,
          edgeId: edge.id,
          code: 'END_NODE_OUTGOING_EDGE',
          message: 'O nó final de conclusão não pode possuir conexões de saída.',
          severity: 'error',
        })
      }

      // Nó inicial não pode ter entradas
      if (tgtNode && tgtNode.data.nodeType === 'start') {
        errors.push({
          nodeId: tgtNode.id,
          edgeId: edge.id,
          code: 'START_NODE_INCOMING_EDGE',
          message: 'O nó inicial de partida não pode receber conexões de entrada.',
          severity: 'error',
        })
      }
    })

    // 4. Verificação de nós obrigatórios inacessíveis a partir do nó Start
    const visited = new Set<string>()
    if (startNodes.length === 1) {
      const queue = [startNodes[0].id]
      visited.add(startNodes[0].id)

      while (queue.length > 0) {
        const currId = queue.shift()!
        const outs = outgoing.get(currId) || []
        for (const edge of outs) {
          if (!visited.has(edge.target) && nodesById.has(edge.target)) {
            visited.add(edge.target)
            queue.push(edge.target)
          }
        }
      }
    }

    graph.nodes.forEach((node) => {
      // Nós órfãos / inacessíveis
      if (!visited.has(node.id) && node.data.nodeType !== 'start') {
        const isReq = node.data.rules?.isRequired ?? true
        if (isReq) {
          errors.push({
            nodeId: node.id,
            code: 'UNREACHABLE_REQUIRED_NODE',
            message: `O nó "${node.data.title}" é obrigatório, mas não possui caminho a partir do início.`,
            severity: 'error',
          })
        } else {
          warnings.push({
            nodeId: node.id,
            code: 'UNREACHABLE_OPTIONAL_NODE',
            message: `O nó opcional "${node.data.title}" não é alcançável no fluxo atual.`,
            severity: 'warning',
          })
        }
      }

      // 5. Verificação de referências de blocos da biblioteca
      if (node.data.blockId && availableBlockIds.length > 0) {
        if (!availableBlockIds.includes(node.data.blockId)) {
          warnings.push({
            nodeId: node.id,
            code: 'UNRESOLVED_BLOCK_ID',
            message: `Bloco referenciado "${node.data.blockId}" não foi encontrado na biblioteca local.`,
            severity: 'warning',
          })
        }
      }

      // 6. Compatibilidade com renderizadores de bloco
      if (node.data.blockType) {
        const blockDef = getBlockDefinition(node.data.blockType as never)
        if (!blockDef) {
          warnings.push({
            nodeId: node.id,
            code: 'UNKNOWN_BLOCK_TYPE',
            message: `Tipo de bloco "${node.data.blockType}" é planejado e será rotulado como "Planejado" ao aluno.`,
            severity: 'warning',
          })
        }
      }

      // 7. Validação de regras de revisão (prevenção de loop infinito)
      if (node.data.nodeType === 'review_checkpoint') {
        const maxLoops = node.data.rules?.maxLoopCycles ?? 3
        if (maxLoops < 1 || maxLoops > 10) {
          errors.push({
            nodeId: node.id,
            code: 'INVALID_LOOP_LIMIT',
            message:
              'O nó de revisão deve possuir limite de repetições configurado entre 1 e 10 ciclos.',
            severity: 'error',
          })
        }
      }

      // 8. Nós sem saída que não sejam track_end (caminhos sem saída não intencionais)
      if (node.data.nodeType !== 'track_end') {
        const outs = outgoing.get(node.id) || []
        if (outs.length === 0) {
          errors.push({
            nodeId: node.id,
            code: 'DEAD_END_NODE',
            message: `O nó "${node.data.title}" não possui nenhuma conexão de saída para continuar o fluxo.`,
            severity: 'error',
          })
        }
      }
    })

    // 9. Existência de rota do início até pelo menos um nó de conclusão
    let canReachEnd = false
    endNodes.forEach((endNode) => {
      if (visited.has(endNode.id)) {
        canReachEnd = true
      }
    })

    if (!canReachEnd && endNodes.length > 0) {
      errors.push({
        code: 'NO_PATH_TO_END',
        message: 'Não existe nenhum caminho contínuo do início até o nó final de conclusão.',
        severity: 'error',
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }
}

/**
 * SERVIÇO SWAPPABLE DE TRILHAS (TrailGraphService)
 *
 * Ponto Único de Troca para Supabase:
 * Tabelas gerenciadas:
 * - trail_graphs (track_id, graph_json, status, updated_at)
 * - trail_graph_versions (track_id, version, graph_json, status, published_by, published_at, changelog)
 * - learner_trail_progress (user_id, track_id, progress_json)
 */
export class TrailGraphService {
  public static assertEditorialAccess(role?: Role | null): void {
    if (!role || !isEditorialRole(role)) {
      throw new Error('Acesso negado: privilégios de edição editorial necessários.')
    }
  }

  public static assertPublishAccess(role?: Role | null): void {
    if (!role || !isAdminRole(role)) {
      throw new Error('Acesso negado: publicação de trilhas restrita a administradores.')
    }
  }

  public static async getGraphByTrackId(trackId: string): Promise<TrailGraph | null> {
    const list = this.getStoredGraphs()
    return (
      list.find((g) => g.trackId === trackId || g.id === trackId || g.trackSlug === trackId) || null
    )
  }

  public static async listAllGraphs(): Promise<TrailGraph[]> {
    return this.getStoredGraphs()
  }

  public static async saveGraphDraft(
    graph: TrailGraph,
    userRole?: Role | null,
  ): Promise<{ success: boolean; graph: TrailGraph; validation: GraphValidationReport }> {
    this.assertEditorialAccess(userRole)

    // Validação com Zod
    const parsed = TrailGraphSchema.parse({
      ...graph,
      updatedAt: new Date().toISOString(),
    })

    const validation = GraphValidator.validate(parsed)

    const list = this.getStoredGraphs()
    const index = list.findIndex((g) => g.id === parsed.id || g.trackId === parsed.trackId)
    if (index >= 0) {
      list[index] = parsed
    } else {
      list.push(parsed)
    }

    this.persistGraphs(list)
    return { success: true, graph: parsed, validation }
  }

  public static async publishGraphVersion(
    trackId: string,
    publisherName: string,
    changelog: string,
    userRole?: Role | null,
    availableBlockIds: string[] = [],
  ): Promise<{
    success: boolean
    publishedVersion?: TrailGraphVersionSnapshot
    errors?: GraphValidationError[]
  }> {
    this.assertPublishAccess(userRole)

    const graph = await this.getGraphByTrackId(trackId)
    if (!graph) {
      return {
        success: false,
        errors: [{ code: 'NOT_FOUND', message: 'Trilha não encontrada.', severity: 'error' }],
      }
    }

    // Validação estrita antes de publicar
    const validation = GraphValidator.validate(graph, availableBlockIds)
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
      }
    }

    const nextVersion = graph.version + 1
    const publishedAt = new Date().toISOString()

    const updatedGraph: TrailGraph = {
      ...graph,
      version: nextVersion,
      status: 'published',
      publishedAt,
      publishedBy: publisherName,
      updatedAt: publishedAt,
    }

    // Salva o snapshot imutável em trail_graph_versions
    const snapshot: TrailGraphVersionSnapshot = {
      id: `tgv-${trackId}-v${nextVersion}`,
      trackId: graph.trackId,
      version: nextVersion,
      graphJson: updatedGraph,
      status: 'published',
      publishedBy: publisherName,
      publishedAt,
      changelog: changelog || `Publicação da versão ${nextVersion}`,
      isDemo: true,
    }

    const versions = this.getStoredVersions()
    // Arquiva snapshots anteriores
    versions.forEach((v) => {
      if (v.trackId === graph.trackId && v.status === 'published') {
        v.status = 'archived'
      }
    })
    versions.push(snapshot)
    this.persistVersions(versions)

    // Atualiza o grafo atual
    const list = this.getStoredGraphs()
    const idx = list.findIndex((g) => g.trackId === graph.trackId)
    if (idx >= 0) list[idx] = updatedGraph
    this.persistGraphs(list)

    return { success: true, publishedVersion: snapshot }
  }

  public static async getPublishedVersion(
    trackId: string,
    versionNumber?: number,
  ): Promise<TrailGraphVersionSnapshot | null> {
    const versions = this.getStoredVersions()
    const trackVersions = versions.filter((v) => v.trackId === trackId)

    if (versionNumber !== undefined) {
      return trackVersions.find((v) => v.version === versionNumber) || null
    }

    // Retorna a mais recente versão publicada
    return trackVersions.sort((a, b) => b.version - a.version)[0] || null
  }

  public static async listVersions(trackId: string): Promise<TrailGraphVersionSnapshot[]> {
    const versions = this.getStoredVersions()
    return versions.filter((v) => v.trackId === trackId).sort((a, b) => b.version - a.version)
  }

  // --- Persistência local rotulada como demonstrativa ---
  private static getStoredGraphs(): TrailGraph[] {
    try {
      const raw = localStorage.getItem(TRAIL_GRAPHS_STORAGE_KEY)
      if (!raw) {
        const initial = [BEAM_BENDING_CANONICAL_GRAPH]
        this.persistGraphs(initial)
        return initial
      }
      return JSON.parse(raw)
    } catch {
      return [BEAM_BENDING_CANONICAL_GRAPH]
    }
  }

  public static persistGraphs(graphs: TrailGraph[]): void {
    try {
      localStorage.setItem(TRAIL_GRAPHS_STORAGE_KEY, JSON.stringify(graphs))
    } catch {
      // fallback
    }
  }

  private static getStoredVersions(): TrailGraphVersionSnapshot[] {
    try {
      const raw = localStorage.getItem(TRAIL_VERSIONS_STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  private static persistVersions(versions: TrailGraphVersionSnapshot[]): void {
    try {
      localStorage.setItem(TRAIL_VERSIONS_STORAGE_KEY, JSON.stringify(versions))
    } catch {
      // fallback
    }
  }
}
