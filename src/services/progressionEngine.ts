import {
  TrailGraph,
  TrailNode,
  TrailEdge,
  LearnerTrailState,
  LearnerNodeProgress,
  LearnerNodeStatus,
  ProgressionRule,
} from '@/types/trailGraph'

export interface ProgressionEvaluationResult {
  nodeId: string
  status: LearnerNodeStatus
  unlockedNextNodeIds: string[]
  remediationNodeIds: string[]
  reason: string
  missingPrerequisites: string[]
  competenciesSatisfied: boolean
  isLoopLimitExceeded: boolean
}

/**
 * MOTOR DETERMINÍSTICO DE PROGRESSÃO PEDAGÓGICA (v1)
 *
 * Princípios do Projeto:
 * 1. Seguro: interpretador puramente funcional, sem eval(), Function() ou execução de código arbitrário.
 * 2. XP NUNCA é critério único de domínio (avalia acurácia, competências, tentativas e dicas).
 * 3. Adaptativo com salvaguardas anti-loop: revisões possuem teto máximo de repetições (maxLoopCycles)
 *    e saída obrigatória para apoio ou continuidade.
 * 4. Independente da UI: pode rodar no cliente, no motor de testes e em futura Edge Function Supabase.
 */
export class DeterministicProgressionEngine {
  /**
   * Avalia o estado pedagógico completo da trilha para um aluno
   */
  public static evaluateTrail(
    graph: TrailGraph,
    learnerState: LearnerTrailState,
  ): {
    evaluatedNodes: Record<string, ProgressionEvaluationResult>
    availableNodeIds: string[]
    completedNodeIds: string[]
    recommendedNextNodeId?: string
    overallCompletionPercentage: number
  } {
    const nodesById = new Map<string, TrailNode>()
    graph.nodes.forEach((n) => nodesById.set(n.id, n))

    const incomingEdgesByTarget = new Map<string, TrailEdge[]>()
    const outgoingEdgesBySource = new Map<string, TrailEdge[]>()

    graph.edges.forEach((edge) => {
      if (!incomingEdgesByTarget.has(edge.target)) {
        incomingEdgesByTarget.set(edge.target, [])
      }
      incomingEdgesByTarget.get(edge.target)!.push(edge)

      if (!outgoingEdgesBySource.has(edge.source)) {
        outgoingEdgesBySource.set(edge.source, [])
      }
      outgoingEdgesBySource.get(edge.source)!.push(edge)
    })

    const evaluatedNodes: Record<string, ProgressionEvaluationResult> = {}
    const completedNodeIds: string[] = []
    const availableNodeIds: string[] = []

    // 1. Avalia cada nó do grafo
    for (const node of graph.nodes) {
      const evaluation = this.evaluateSingleNode(
        node,
        graph,
        learnerState,
        incomingEdgesByTarget.get(node.id) || [],
        outgoingEdgesBySource.get(node.id) || [],
      )

      evaluatedNodes[node.id] = evaluation

      if (evaluation.status === 'completed') {
        completedNodeIds.push(node.id)
      } else if (evaluation.status === 'available' || evaluation.status === 'in_progress') {
        availableNodeIds.push(node.id)
      }
    }

    // 2. Recomendação do próximo passo
    // Dá prioridade para o nó que o aluno já iniciou ou o primeiro disponível na ordem topológica/visual
    let recommendedNextNodeId: string | undefined = learnerState.currentActiveNodeId
    if (!recommendedNextNodeId || !availableNodeIds.includes(recommendedNextNodeId)) {
      recommendedNextNodeId = availableNodeIds[0]
    }

    // 3. Percentual de conclusão baseado nos nós obrigatórios
    const requiredNodes = graph.nodes.filter((n) => n.data.rules?.isRequired ?? true)
    const completedRequired = requiredNodes.filter((n) => completedNodeIds.includes(n.id))
    const overallCompletionPercentage =
      requiredNodes.length > 0
        ? Math.round((completedRequired.length / requiredNodes.length) * 100)
        : 0

    return {
      evaluatedNodes,
      availableNodeIds,
      completedNodeIds,
      recommendedNextNodeId,
      overallCompletionPercentage,
    }
  }

  /**
   * Avalia a elegibilidade e status de um único nó
   */
  public static evaluateSingleNode(
    node: TrailNode,
    graph: TrailGraph,
    learnerState: LearnerTrailState,
    incomingEdges: TrailEdge[],
    outgoingEdges: TrailEdge[],
  ): ProgressionEvaluationResult {
    const nodeProgress: LearnerNodeProgress | undefined = learnerState.nodesProgress[node.id]
    const rules = (node.data.rules || {
      requireAllPrerequisites: true,
      prerequisiteNodeIds: [],
      isRequired: true,
      requireZeroHints: false,
      maxLoopCycles: 3,
    }) as ProgressionRule

    // 1. Se o nó já estiver marcado como concluído pelo aluno e satisfizer as regras
    if (nodeProgress?.status === 'completed') {
      const branches = this.calculateOutgoingBranches(node, outgoingEdges, nodeProgress)
      return {
        nodeId: node.id,
        status: 'completed',
        unlockedNextNodeIds: branches.unlocked,
        remediationNodeIds: branches.remediation,
        reason: 'Nó concluído com êxito pelo aluno.',
        missingPrerequisites: [],
        competenciesSatisfied: true,
        isLoopLimitExceeded: false,
      }
    }

    // 2. O nó inicial da trilha é sempre acessível
    if (node.data.nodeType === 'start') {
      return {
        nodeId: node.id,
        status: (nodeProgress?.status as LearnerNodeStatus) || 'available',
        unlockedNextNodeIds: outgoingEdges.map((e) => e.target),
        remediationNodeIds: [],
        reason: 'Ponto de partida da trilha sempre disponível.',
        missingPrerequisites: [],
        competenciesSatisfied: true,
        isLoopLimitExceeded: false,
      }
    }

    // 3. Checa pré-requisitos explícitos e arestas de entrada
    const explicitPrereqs = rules.prerequisiteNodeIds || []
    const edgePrereqs = incomingEdges.map((e) => e.source)
    const combinedPrereqs = Array.from(new Set([...explicitPrereqs, ...edgePrereqs]))

    const missingPrerequisites: string[] = []

    for (const prereqId of combinedPrereqs) {
      const prereqProgress = learnerState.nodesProgress[prereqId]
      // Encontra a aresta que leva a este nó
      const edge = incomingEdges.find((e) => e.source === prereqId)

      if (!prereqProgress || prereqProgress.status !== 'completed') {
        missingPrerequisites.push(prereqId)
        continue
      }

      // Se a aresta tem condição específica (ex: on_failure, on_success), avalia
      if (edge) {
        const conditionMet = this.isEdgeConditionMet(edge, prereqProgress)
        if (!conditionMet) {
          missingPrerequisites.push(prereqId)
        }
      }
    }

    // Se faltarem pré-requisitos, nó está BLOQUEADO
    if (rules.requireAllPrerequisites && missingPrerequisites.length > 0) {
      return {
        nodeId: node.id,
        status: 'locked',
        unlockedNextNodeIds: [],
        remediationNodeIds: [],
        reason: `Bloqueado por pré-requisitos pendentes: ${missingPrerequisites.join(', ')}`,
        missingPrerequisites,
        competenciesSatisfied: false,
        isLoopLimitExceeded: false,
      }
    }

    // 4. Salvaguarda contra ciclo infinito em nós de revisão
    const loopCycles = nodeProgress?.loopCycleCount || 0
    const maxCycles = rules.maxLoopCycles || 3
    const isLoopLimitExceeded = loopCycles >= maxCycles

    if (isLoopLimitExceeded) {
      // Força avanço pedagógico com apoio ao atingir o teto de repetições
      return {
        nodeId: node.id,
        status: 'available',
        unlockedNextNodeIds: outgoingEdges.map((e) => e.target),
        remediationNodeIds: [],
        reason: `Limite de ${maxCycles} ciclos de revisão atingido. Liberação assistida concedida.`,
        missingPrerequisites: [],
        competenciesSatisfied: true,
        isLoopLimitExceeded: true,
      }
    }

    // 5. Avalia competências exigidas
    let competenciesSatisfied = true
    if ('minCompetencyMastery' in rules && rules.minCompetencyMastery) {
      for (const [compCode, requiredScore] of Object.entries(rules.minCompetencyMastery)) {
        const currentScore = nodeProgress?.competencyScores?.[compCode] || 0
        const reqNum = Number(requiredScore)
        if (currentScore < reqNum) {
          competenciesSatisfied = false
          break
        }
      }
    }

    // 6. Determina se está disponível ou em progresso
    const status: LearnerNodeStatus =
      nodeProgress?.status === 'in_progress' ? 'in_progress' : 'available'

    return {
      nodeId: node.id,
      status,
      unlockedNextNodeIds: [],
      remediationNodeIds: [],
      reason: 'Pré-requisitos satisfeitos. Atividade pronta para execução.',
      missingPrerequisites: [],
      competenciesSatisfied,
      isLoopLimitExceeded: false,
    }
  }

  /**
   * Avalia a conclusão de uma tentativa do aluno em um nó
   */
  public static submitNodeAttempt(
    node: TrailNode,
    attempt: {
      scorePercentage?: number
      hintsUsed: number
      timeSpentSeconds: number
      competencyScores?: Record<string, number>
    },
    currentState?: LearnerNodeProgress,
  ): {
    isPassed: boolean
    status: LearnerNodeStatus
    branch: 'mastery' | 'partial' | 'remediation'
    feedback: string
    updatedProgress: LearnerNodeProgress
  } {
    const rules = (node.data.rules || {
      requireAllPrerequisites: true,
      prerequisiteNodeIds: [],
      isRequired: true,
      requireZeroHints: false,
      maxLoopCycles: 3,
    }) as ProgressionRule

    const currentAttempts = (currentState?.attempts || 0) + 1
    const loopCount =
      (currentState?.loopCycleCount || 0) + (node.data.nodeType === 'review_checkpoint' ? 1 : 0)
    const score = attempt.scorePercentage ?? 100
    const bestScore = Math.max(currentState?.bestScorePercentage || 0, score)

    // Critérios pedagógicos de aprovação
    const meetsMinScore = rules.minAccuracyPercentage ? score >= rules.minAccuracyPercentage : true
    const meetsZeroHints = rules.requireZeroHints ? attempt.hintsUsed === 0 : true
    const meetsMaxHints =
      rules.maxHintsAllowed !== undefined ? attempt.hintsUsed <= rules.maxHintsAllowed : true

    let meetsCompetencies = true
    if ('minCompetencyMastery' in rules && rules.minCompetencyMastery && attempt.competencyScores) {
      for (const [comp, min] of Object.entries(rules.minCompetencyMastery)) {
        const minNum = Number(min)
        if ((attempt.competencyScores[comp] || 0) < minNum) {
          meetsCompetencies = false
          break
        }
      }
    }

    const isPassed = meetsMinScore && meetsZeroHints && meetsMaxHints && meetsCompetencies

    // Classificação adaptativa
    let branch: 'mastery' | 'partial' | 'remediation'
    if (score >= 80 && isPassed) {
      branch = 'mastery'
    } else if (score >= 50 && score < 80) {
      branch = 'partial'
    } else {
      branch = 'remediation'
    }

    let feedback = ''
    if (isPassed) {
      feedback = 'Excelente desempenho! Domínio pedagógico verificado.'
    } else if (!meetsZeroHints || !meetsMaxHints) {
      feedback = 'A atividade exigia resolução sem/com poucas dicas para validação de domínio.'
    } else if (!meetsMinScore) {
      feedback = `Acurácia de ${score}% inferior à pontuação mínima exigida (${rules.minAccuracyPercentage}%).`
    } else {
      feedback = 'Competências mínimas de engenharia não atingidas plenamente.'
    }

    const updatedProgress: LearnerNodeProgress = {
      nodeId: node.id,
      status: isPassed ? 'completed' : 'needs_review',
      attempts: currentAttempts,
      bestScorePercentage: bestScore,
      hintsUsedCount: (currentState?.hintsUsedCount || 0) + attempt.hintsUsed,
      timeSpentSeconds: (currentState?.timeSpentSeconds || 0) + attempt.timeSpentSeconds,
      competencyScores: {
        ...(currentState?.competencyScores || {}),
        ...(attempt.competencyScores || {}),
      },
      lastAttemptAt: new Date().toISOString(),
      completedAt: isPassed ? new Date().toISOString() : undefined,
      loopCycleCount: loopCount,
    }

    return {
      isPassed,
      status: updatedProgress.status,
      branch,
      feedback,
      updatedProgress,
    }
  }

  /**
   * Verifica se a condição de uma aresta é satisfeita
   */
  private static isEdgeConditionMet(edge: TrailEdge, sourceProgress: LearnerNodeProgress): boolean {
    const score = sourceProgress.bestScorePercentage ?? 100

    switch (edge.conditionType) {
      case 'always':
        return sourceProgress.status === 'completed'
      case 'on_success':
        return sourceProgress.status === 'completed' && score >= 70
      case 'on_failure':
        return sourceProgress.status === 'needs_review' || score < 50
      case 'on_partial':
        return score >= 50 && score < 80
      case 'optional_enrichment':
        return sourceProgress.status === 'completed'
      case 'on_competency_met':
        return sourceProgress.status === 'completed'
      default:
        return sourceProgress.status === 'completed'
    }
  }

  /**
   * Calcula as ramificações de saída liberadas a partir de um nó concluído
   */
  private static calculateOutgoingBranches(
    node: TrailNode,
    outgoingEdges: TrailEdge[],
    nodeProgress: LearnerNodeProgress,
  ): { unlocked: string[]; remediation: string[] } {
    const unlocked: string[] = []
    const remediation: string[] = []

    for (const edge of outgoingEdges) {
      if (edge.conditionType === 'on_failure') {
        remediation.push(edge.target)
      } else if (this.isEdgeConditionMet(edge, nodeProgress)) {
        unlocked.push(edge.target)
      }
    }

    // Também verifica regras adaptativas explícitas no nó
    const adaptive = node.data.rules?.adaptiveBranching
    if (adaptive) {
      const score = nodeProgress.bestScorePercentage ?? 100
      if (score >= 80 && adaptive.onMasteryNodeId) {
        unlocked.push(adaptive.onMasteryNodeId)
      } else if (score >= 50 && score < 80 && adaptive.onPartialNodeId) {
        unlocked.push(adaptive.onPartialNodeId)
      } else if (score < 50 && adaptive.onRemediationNodeId) {
        remediation.push(adaptive.onRemediationNodeId)
      }
    }

    return {
      unlocked: Array.from(new Set(unlocked)),
      remediation: Array.from(new Set(remediation)),
    }
  }
}
