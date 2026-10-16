import { z } from 'zod'

/**
 * 9 Tipos canônicos de nós do grafo pedagógico
 * (Extensíveis com contratos padronizados de entrada/saída/conclusão)
 */
export const TrailNodeTypeEnum = z.enum([
  'start', // 1. Início da trilha
  'learning_content', // 2. Conteúdo de aprendizagem (vídeo, texto, pdf)
  'single_question', // 3. Questão individual do banco
  'mission_set', // 4. Missão / conjunto de questões interativas
  'multimaterial_content', // 5. Conteúdo multimaterial composto
  'progression_gate', // 6. Condição / Portão de progressão
  'review_checkpoint', // 7. Nó de revisão adaptativa / reforço
  'milestone_achievement', // 8. Marco de conquista / badge / celebração
  'track_end', // 9. Final de unidade ou trilha
])

export type TrailNodeType = z.infer<typeof TrailNodeTypeEnum>

/**
 * Regras pedagógicas de progressão determinísticas (sem eval arbitrário)
 */
export const ProgressionRuleSchema = z.object({
  // Conclusão obrigatória de nós antecessores
  requireAllPrerequisites: z.boolean().default(true),
  prerequisiteNodeIds: z.array(z.string()).default([]),

  // Percentual mínimo de acerto (0 a 100)
  minAccuracyPercentage: z.number().min(0).max(100).optional(),

  // Domínio mínimo de competências específicas (código da competência -> score 0-100)
  minCompetencyMastery: z.record(z.string(), z.number().min(0).max(100)).optional(),

  // Tentativas mínimas e máximas
  minAttempts: z.number().min(0).optional(),
  maxAttempts: z.number().min(1).optional(),

  // Exigência de resolução sem dicas
  requireZeroHints: z.boolean().default(false),

  // Máximo de dicas permitidas
  maxHintsAllowed: z.number().min(0).optional(),

  // Tempo mínimo de permanência (segundos)
  minTimeSpentSeconds: z.number().min(0).optional(),

  // Obrigatoriedade
  isRequired: z.boolean().default(true),

  // Limite de repetições em nós de revisão (evitar loop infinito)
  maxLoopCycles: z.number().min(1).default(3),

  // Ramificação adaptativa condicionada ao resultado
  adaptiveBranching: z
    .object({
      onMasteryNodeId: z.string().optional(), // score >= 80% -> desafio avançado
      onPartialNodeId: z.string().optional(), // score 50-79% -> exercício equivalente
      onRemediationNodeId: z.string().optional(), // score < 50% -> revisão de fundamentos
    })
    .optional(),
})

export type ProgressionRule = z.infer<typeof ProgressionRuleSchema>

/**
 * Metadados pedagógicos de cada nó
 */
export const TrailNodeDataSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().default(''),
  nodeType: TrailNodeTypeEnum,
  estimatedMinutes: z.number().min(1).default(15),
  xpReward: z.number().min(0).default(50),
  competencies: z.array(z.string()).default([]),

  // Referência desacoplada ao bloco da biblioteca
  blockId: z.string().optional(),
  blockVersion: z.number().optional(),
  blockType: z.string().optional(),

  // Referência opcional à missão canônica (ex: beamBendingMissionData)
  missionId: z.string().optional(),

  // Referência opcional à questão do banco
  questionId: z.string().optional(),

  // Regras de conclusão e desbloqueio
  rules: ProgressionRuleSchema.default({
    requireAllPrerequisites: true,
    prerequisiteNodeIds: [],
    isRequired: true,
    requireZeroHints: false,
    maxLoopCycles: 3,
  }),

  // Comportamento em erro e recursos de apoio
  onErrorBehavior: z
    .enum(['retry_allowed', 'divert_to_review', 'block_progress', 'show_explanation'])
    .default('retry_allowed'),

  supplementaryResources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        type: z.enum(['pdf', 'video', 'link', 'formula_sheet']),
      }),
    )
    .default([]),

  // Mensagem ou vídeo de conquista ao concluir
  achievementMessage: z.string().optional(),
  achievementBadgeUrl: z.string().optional(),

  // Status de renderizador: 'available' ou 'planned' (para blocos P1/P2 planejados)
  rendererStatus: z.enum(['available', 'planned']).default('available'),
})
export type TrailNodeData = z.infer<typeof TrailNodeDataSchema>

/**
 * Posição visual no canvas (desacoplada da lógica pedagógica)
 */
export const NodeVisualPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

export type NodeVisualPosition = z.infer<typeof NodeVisualPositionSchema>

/**
 * Nó do grafo persistido no domínio
 */
export const TrailNodeSchema = z.object({
  id: z.string(),
  unitId: z.string().default('unit-1'),
  position: NodeVisualPositionSchema,
  data: TrailNodeDataSchema,
})

export type TrailNode = z.infer<typeof TrailNodeSchema>

/**
 * Conexão/Aresta entre nós com rótulo semântico e condição
 */
export const TrailEdgeConditionTypeEnum = z.enum([
  'always', // Sempre liberado se o nó de origem for concluído
  'on_success', // Se aprovado / domínio
  'on_failure', // Se reprovado / precisa reforço
  'on_partial', // Domínio intermediário
  'on_competency_met', // Competência atingida
  'optional_enrichment', // Caminho opcional / enriquecimento
])

export type TrailEdgeConditionType = z.infer<typeof TrailEdgeConditionTypeEnum>

export const TrailEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  conditionType: TrailEdgeConditionTypeEnum.default('always'),
  label: z.string().optional(),
  isOptionalBranch: z.boolean().default(false),
})

export type TrailEdge = z.infer<typeof TrailEdgeSchema>

/**
 * Unidade temática da trilha
 */
export const TrailUnitSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(''),
  order: z.number(),
})

export type TrailUnit = z.infer<typeof TrailUnitSchema>

/**
 * Estrutura completa do Grafo da Trilha (JSON tipado)
 */
export const TrailGraphSchema = z.object({
  id: z.string(),
  trackId: z.string(),
  trackSlug: z.string(),
  title: z.string(),
  headline: z.string().default(''),
  description: z.string().default(''),
  units: z.array(TrailUnitSchema).default([]),
  nodes: z.array(TrailNodeSchema),
  edges: z.array(TrailEdgeSchema),
  version: z.number().default(1),
  revision: z.number().default(1),
  status: z.enum(['draft', 'in_review', 'published', 'archived']).default('draft'),
  publishedVersion: z.number().optional(),
  publishedAt: z.string().optional(),
  publishedBy: z.string().optional(),
  updatedAt: z.string(),
  createdAt: z.string(),
  isDemo: z.boolean().default(true),
})

export type TrailGraph = z.infer<typeof TrailGraphSchema>

/**
 * Snapshot imutável de versão publicada (trail_graph_versions)
 */
export const TrailGraphVersionSnapshotSchema = z.object({
  id: z.string(),
  trackId: z.string(),
  version: z.number(),
  graphJson: TrailGraphSchema,
  status: z.enum(['published', 'archived']).default('published'),
  publishedBy: z.string(),
  publishedAt: z.string(),
  changelog: z.string().default('Versão aprovada e publicada'),
  isDemo: z.boolean().default(true),
})

export type TrailGraphVersionSnapshot = z.infer<typeof TrailGraphVersionSnapshotSchema>

/**
 * Estado individual do aluno em um nó
 */
export type LearnerNodeStatus =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'completed'
  | 'needs_review'

export interface LearnerNodeProgress {
  nodeId: string
  status: LearnerNodeStatus
  attempts: number
  bestScorePercentage?: number
  hintsUsedCount: number
  timeSpentSeconds: number
  competencyScores: Record<string, number>
  lastAttemptAt?: string
  completedAt?: string
  loopCycleCount: number
}

export interface LearnerTrailState {
  userId: string
  trackId: string
  currentActiveNodeId?: string
  nodesProgress: Record<string, LearnerNodeProgress>
  totalXpEarned: number
  unlockedAchievementNodeIds: string[]
  completedAt?: string
  lastUpdatedAt: string
}
