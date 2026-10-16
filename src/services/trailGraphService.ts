/**
 * TrailGraphService — Persistência Real de Trilhas no Supabase (Subfase 4.3)
 *
 * Suporta:
 * - Persistência no Supabase (trail_graphs e trail_graph_versions)
 * - Isolamento transparente para modo Demo (localStorage)
 * - Optimistic locking com coluna de revisão (prevenção de sobrescrita concorrente)
 * - Validação canônica do grafo via GraphValidator
 * - Publicação de snapshots atômicos imutáveis via RPC `rpc_publish_trail_graph`
 * - RLS e checagens seguras de papéis editoriais no backend
 */

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
import { supabase } from '@/lib/supabase/client'
import { IS_DEMO } from '@/data/demoData'

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

      if (srcNode && srcNode.data.nodeType === 'track_end') {
        errors.push({
          nodeId: srcNode.id,
          edgeId: edge.id,
          code: 'END_NODE_OUTGOING_EDGE',
          message: 'O nó final de conclusão não pode possuir conexões de saída.',
          severity: 'error',
        })
      }

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

  /**
   * Converte linha do banco para a entidade TrailGraph de domínio
   */
  private static mapRowToTrailGraph(row: any): TrailGraph {
    return {
      id: row.id,
      trackId: row.track_id,
      title: row.title,
      headline: row.title,
      description: row.description || '',
      trackSlug: row.track_slug,
      units: [],
      version: row.version,
      revision: row.revision ?? 1,
      status: row.status,
      nodes: Array.isArray(row.nodes) ? row.nodes : [],
      edges: Array.isArray(row.edges) ? row.edges : [],
      publishedVersion: row.published_version,
      publishedAt: row.published_at,
      publishedBy: row.published_by,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      isDemo: false,
    }
  }

  public static async getGraphByTrackId(trackId: string): Promise<TrailGraph | null> {
    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'

    if (!isDemoMode) {
      try {
        const { data, error } = await (supabase.from('trail_graphs' as any) as any)
          .select('*')
          .or(`track_id.eq.${trackId},id.eq.${trackId},track_slug.eq.${trackId}`)
          .maybeSingle()

        if (!error && data) {
          // Se tiver nós/arestas gravados, usa; se vazios, mescla com o canônico
          const graph = this.mapRowToTrailGraph(data)
          if (graph.nodes.length === 0 && trackId === 'track-mef-01') {
            return {
              ...BEAM_BENDING_CANONICAL_GRAPH,
              version: graph.version,
              revision: graph.revision,
              status: graph.status,
            }
          }
          return graph
        }
      } catch (err) {
        console.warn('Fallback para local ao buscar trilha:', err)
      }
    }

    const list = this.getStoredGraphs()
    return (
      list.find((g) => g.trackId === trackId || g.id === trackId || g.trackSlug === trackId) || null
    )
  }

  public static async listAllGraphs(): Promise<TrailGraph[]> {
    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'

    if (!isDemoMode) {
      try {
        const { data, error } = await (supabase.from('trail_graphs' as any) as any)
          .select('*')
          .order('updated_at', { ascending: false })

        if (!error && data && data.length > 0) {
          return data.map((row) => this.mapRowToTrailGraph(row))
        }
      } catch (err) {
        console.warn('Fallback para local ao listar trilhas:', err)
      }
    }

    return this.getStoredGraphs()
  }

  /**
   * Salva rascunho de trilha com Optimistic Locking
   */
  public static async saveGraphDraft(
    graph: TrailGraph,
    userRole?: Role | null,
    expectedRevision?: number,
  ): Promise<{
    success: boolean
    graph: TrailGraph
    validation: GraphValidationReport
    conflict?: boolean
    message?: string
  }> {
    this.assertEditorialAccess(userRole)

    const parsed = TrailGraphSchema.parse({
      ...graph,
      updatedAt: new Date().toISOString(),
    })

    const validation = GraphValidator.validate(parsed)
    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'

    if (!isDemoMode) {
      try {
        // Invoca RPC segura com controle de concorrência
        const { data: rpcResult, error: rpcError } = await (supabase.rpc as any)(
          'rpc_save_trail_graph_draft',
          {
            p_track_id: parsed.trackId,
            p_title: parsed.title,
            p_description: parsed.description || '',
            p_track_slug: parsed.trackSlug,
            p_nodes: parsed.nodes,
            p_edges: parsed.edges,
            p_expected_revision: expectedRevision ?? parsed.revision ?? 1,
          },
        )

        if (rpcError) {
          throw new Error(`Falha ao salvar rascunho no Supabase: ${rpcError.message}`)
        }

        if (rpcResult && rpcResult.conflict) {
          return {
            success: false,
            graph: parsed,
            validation,
            conflict: true,
            message: rpcResult.message,
          }
        }

        const newRevision = rpcResult?.revision || (parsed.revision || 1) + 1
        const updatedGraph: TrailGraph = {
          ...parsed,
          revision: newRevision,
          updatedAt: new Date().toISOString(),
        }

        // Atualiza cache local espelho
        const list = this.getStoredGraphs()
        const idx = list.findIndex((g) => g.trackId === parsed.trackId)
        if (idx >= 0) list[idx] = updatedGraph
        else list.push(updatedGraph)
        this.persistGraphs(list)

        return { success: true, graph: updatedGraph, validation }
      } catch (err: any) {
        console.warn('Fallback para gravação local:', err)
      }
    }

    // Modo local / Fallback
    const list = this.getStoredGraphs()
    const index = list.findIndex((g) => g.id === parsed.id || g.trackId === parsed.trackId)
    const newRev = (parsed.revision || 1) + 1
    const finalGraph = { ...parsed, revision: newRev }
    if (index >= 0) {
      list[index] = finalGraph
    } else {
      list.push(finalGraph)
    }

    this.persistGraphs(list)
    return { success: true, graph: finalGraph, validation }
  }

  /**
   * Publica Versão Imutável de Trilha (Snapshot Atômico)
   */
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

    const validation = GraphValidator.validate(graph, availableBlockIds)
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
      }
    }

    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'

    if (!isDemoMode) {
      try {
        const { data: rpcRes, error: rpcErr } = await (supabase.rpc as any)(
          'rpc_publish_trail_graph',
          {
            p_track_id: trackId,
            p_changelog: changelog || `Publicação da versão ${graph.version + 1}`,
            p_publisher_name: publisherName,
          },
        )

        if (rpcErr) {
          throw new Error(rpcErr.message)
        }

        const nextVersion = rpcRes.version
        const publishedAt = rpcRes.published_at || new Date().toISOString()

        const snapshot: TrailGraphVersionSnapshot = {
          id: rpcRes.snapshot_id || `tgv-${trackId}-v${nextVersion}`,
          trackId: graph.trackId,
          version: nextVersion,
          graphJson: {
            ...graph,
            version: nextVersion,
            status: 'published',
            publishedAt,
            publishedBy: publisherName,
          },
          status: 'published',
          publishedBy: publisherName,
          publishedAt,
          changelog: changelog || `Publicação da versão ${nextVersion}`,
          isDemo: false,
        }

        return { success: true, publishedVersion: snapshot }
      } catch (err: any) {
        console.warn('Erro na RPC de publicação, avaliando fallback local se demo:', err)
        if (!isDemoMode) {
          return {
            success: false,
            errors: [{ code: 'RPC_ERROR', message: err.message, severity: 'error' }],
          }
        }
      }
    }

    // Fluxo Demo Local
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
    versions.forEach((v) => {
      if (v.trackId === graph.trackId && v.status === 'published') {
        v.status = 'archived'
      }
    })
    versions.push(snapshot)
    this.persistVersions(versions)

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
    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'

    if (!isDemoMode) {
      try {
        let query = (supabase.from('trail_graph_versions' as any) as any)
          .select('*')
          .eq('track_id', trackId)
          .eq('status', 'published')

        if (versionNumber !== undefined) {
          query = query.eq('version', versionNumber)
        } else {
          query = query.order('version', { ascending: false }).limit(1)
        }

        const { data, error } = await query.maybeSingle()
        if (!error && data) {
          return {
            id: data.id,
            trackId: data.track_id,
            version: data.version,
            graphJson: data.graph_snapshot as any,
            status: data.status as any,
            publishedBy: data.published_by_name || 'Admin',
            publishedAt: data.published_at,
            changelog: data.changelog || '',
            isDemo: false,
          }
        }
      } catch (err) {
        console.warn('Fallback para versão local:', err)
      }
    }

    const versions = this.getStoredVersions()
    const trackVersions = versions.filter((v) => v.trackId === trackId)
    if (versionNumber !== undefined) {
      return trackVersions.find((v) => v.version === versionNumber) || null
    }
    return trackVersions.sort((a, b) => b.version - a.version)[0] || null
  }

  public static async listVersions(trackId: string): Promise<TrailGraphVersionSnapshot[]> {
    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'

    if (!isDemoMode) {
      try {
        const { data, error } = await (supabase.from('trail_graph_versions' as any) as any)
          .select('*')
          .eq('track_id', trackId)
          .order('version', { ascending: false })

        if (!error && data) {
          return data.map((d) => ({
            id: d.id,
            trackId: d.track_id,
            version: d.version,
            graphJson: d.graph_snapshot as any,
            status: d.status as any,
            publishedBy: d.published_by_name || 'Admin',
            publishedAt: d.published_at,
            changelog: d.changelog || '',
            isDemo: false,
          }))
        }
      } catch (err) {
        console.warn('Fallback ao listar versões:', err)
      }
    }

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
