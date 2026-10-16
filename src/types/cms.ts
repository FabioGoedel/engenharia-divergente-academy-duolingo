/**
 * Engenharia Divergente Academy — Tipos Canônicos da Fase 2 (CMS & Multimídia)
 *
 * Em conformidade com o PROMPT MESTRE e a ESPECIFICACAO_TECNICA.md v1.0.
 *
 * Ponto de troca: as interfaces aqui mapeiam com precisão as tabelas:
 * - public.media_assets
 * - public.question_bank / question_versions
 * - public.content_blocks / block_versions
 * - public.editorial_review_queue
 */

// 1. Estados editoriais e categorias
export type EditorialStatus = 'draft' | 'in_review' | 'published' | 'archived'

export type BlockCategory = 'assessment' | 'media' | 'interaction' | 'flow' | 'marketing'

export type BlockCompletionPolicy = 'submitted' | 'watched' | 'checked' | 'manual' | 'composite'

export type BlockPriority = 'P0' | 'P1' | 'P2'

// 2. Tipos de Mídia
export type MediaAssetType =
  | 'youtube_video'
  | 'private_video'
  | 'pdf_document'
  | 'audio'
  | 'image'
  | 'cad_model'
  | 'spreadsheet'
  | 'archive'
  | 'exercise_file'

export type MediaStorageProvider =
  | 'youtube'
  | 'cloudflare_stream'
  | 's3_storage'
  | 'external_url'
  | 'supabase_storage'
  | 'vimeo'

export interface MediaAsset {
  id: string
  title: string
  description?: string
  assetType: MediaAssetType
  provider: MediaStorageProvider
  externalId: string
  publicUrl: string
  thumbnailUrl?: string
  durationSeconds?: number
  transcriptText?: string
  licenseInfo: string
  accessRules: {
    requiresEntitlement: boolean
    allowedProductIds?: string[]
  }
  tags: string[]
  relatedProductId?: string
  fileSizeBytes?: number
  isPendingStorage: boolean
  createdByName?: string
  createdAt: string
  updatedAt: string
  isDemo?: boolean
  // Campos aditivos da Subfase 4.4
  storageBucket?: 'media_library' | 'protected_materials' | string
  storagePath?: string
  fileHash?: string
  mimeType?: string
  originalFilename?: string
  fileExtension?: string
  folderPath?: string
  categoryTag?:
    | 'videos'
    | 'documents'
    | 'images'
    | 'cad'
    | 'spreadsheets'
    | 'archives'
    | 'exercises'
    | string
  isArchived?: boolean
  isMandatoryReading?: boolean
  allowDownload?: boolean
  version?: number
  rootAssetId?: string
}

// 3. Tipos do Banco de Questões
export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'numeric_response'
  | 'ordered_steps'

export interface QuestionOption {
  id: string
  label: string // 'A', 'B', etc.
  textMarkdown: string
  distractorRationale?: string // Justificativa didática do distrator ou da resposta correta
}

// Chave privada protegida — NUNCA trafega para o aluno!
export interface QuestionPrivateKey {
  correctOptionIds?: string[] // Para single_choice, multiple_choice, true_false
  numericExpectedValue?: number
  numericToleranceAbs?: number
  numericToleranceRel?: number
  numericUnit?: string
  correctStepOrder?: string[] // IDs ordenados para ordered_steps
  rubricNotes?: string // Rubrica técnica do revisor
}

// Questão para o Admin / Editor
export interface QuestionBankItem {
  id: string
  externalId: string // ex: "MEF-L3-Q042"
  title: string
  questionType: QuestionType
  subjectArea: string // Ex: "Mecânica dos Sólidos", "Método dos Elementos Finitos"
  competencyCode: string // Ex: "COMP-MEF-02"
  prerequisites: string[]
  authoringLevel: 1 | 2 | 3 | 4 | 5 // L1 revisão guiada → L5 julgamento de engenharia
  promptMarkdown: string // Suporta LaTeX ($...$ ou $$...$$) e Markdown
  options: QuestionOption[]
  privateKey: QuestionPrivateKey // PROTEGIDO NO SERVIDOR
  hint?: string
  explanationMarkdown: string // Explicação pós-resposta
  numericUnit?: string
  numericToleranceAbs?: number
  numericToleranceRel?: number
  estimatedSeconds: number
  xpReward: number
  tags: string[]
  editorialStatus: EditorialStatus
  version: number
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  createdAt: string
  updatedAt: string
  // Telemetria (marcada explicitamente como pendente na Fase 2)
  telemetryStats?: {
    totalAttempts: number
    accuracyRate: number
    isContested: boolean
    perceivedDifficulty: 'muito_facil' | 'facil' | 'adequada' | 'dificil' | 'muito_dificil'
    isPendingTelemetry: boolean
  }
  revision?: number
  isDemo?: boolean
}

// Questão sanitizada para o payload do Aluno (SEM privateKey e SEM distractorRationale exposto prematuramente)
export interface QuestionStudentPayload {
  id: string
  externalId: string
  title: string
  questionType: QuestionType
  subjectArea: string
  competencyCode: string
  authoringLevel: number
  promptMarkdown: string
  options: Array<{
    id: string
    label: string
    textMarkdown: string
  }>
  hint?: string
  numericUnit?: string
  estimatedSeconds: number
  xpReward: number
  version: number
}

// 4. Catálogo de Tipos de Bloco (BlockRegistry)
export type BlockTypeId =
  // P0 - Funcionais nesta Fase 2
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'numeric_response'
  | 'ordered_steps'
  | 'rich_text'
  | 'video_embed'
  | 'pdf_reader'
  | 'checklist'
  | 'image'
  | 'formula_reference'
  | 'milestone_video'
  | 'cta'
  | 'conditional_gate'
  // P1 - Planejados (Especificação Técnica §5)
  | 'match_pairs'
  | 'fill_equation'
  | 'hotspot_image'
  | 'drag_drop'
  | 'compare_models'
  | 'error_detection'
  | 'engineering_decision'
  | 'mind_map'
  | 'flashcards'
  | 'audio'
  | 'download'
  | 'competency_assessment'
  | 'adaptive_review'
  | 'ai_tutor'
  // P2 - Planejados (Especificação Técnica §5)
  | 'beam_load_simulator'
  | 'stress_contour_interpretation'
  | 'parameter_slider'
  | 'graph_plotter'
  | 'unit_conversion'
  | 'interactive_fbd'
  | 'external_lti_scorm_adapter'
  | 'rubric_free_text'

export interface BlockTypeDefinition {
  type: BlockTypeId
  version: string
  title: string
  description: string
  category: BlockCategory
  priority: BlockPriority
  completionPolicy: BlockCompletionPolicy
  supportedOutputs: string[]
  defaultConfig: Record<string, unknown>
}

// 5. Instância de Bloco de Conteúdo (content_blocks)
export interface ContentBlock {
  id: string
  blockType: BlockTypeId
  category: BlockCategory
  title: string
  description?: string
  subjectArea?: string // Área do conhecimento (ex: "Mecânica dos Sólidos", "MEF")
  associatedCompetencies?: string[] // Competências associadas (ex: ["COMP-MEF-01", "COMP-MAT-02"])
  initialDifficulty?: 1 | 2 | 3 | 4 | 5 // Dificuldade inicial L1-L5
  estimatedMinutes?: number // Tempo estimado em minutos
  author?: string // Autor / Criador do conteúdo
  editorialStatus: EditorialStatus
  version: number
  config: Record<string, unknown>
  completionPolicy: BlockCompletionPolicy
  tags: string[]
  referencedMediaId?: string
  referencedQuestionId?: string
  mediaReferences?: Array<{
    mediaId?: string
    title?: string
    url: string
    type?: string
  }>
  createdByName?: string
  createdAt: string
  updatedAt: string
  // Referências de uso (em quais cursos/módulos este bloco aparece)
  trackReferences?: Array<{
    courseTitle: string
    courseSlug: string
    moduleTitle: string
  }>
  revision?: number
  isDemo?: boolean
}

// Snapshot de versão imutável
export interface VersionSnapshot<T> {
  id: string
  entityId: string
  versionNumber: number
  snapshot: T
  publishedBy: string
  publishedAt: string
  changeSummary?: string
}

// 6. Workflow de Revisão Editorial
export interface EditorialReviewItem {
  id: string
  entityType: 'question' | 'block'
  entityId: string
  title: string
  categoryOrType: string
  currentStatus: EditorialStatus
  requestedBy: string
  assignedReviewer?: string
  requestedAt: string
  notes?: string
  isDemo: true
}
