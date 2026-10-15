/**
 * Engenharia Divergente Academy — Schemas Zod Canônicos da Fase 2
 *
 * Contrato canônico: "ediv-content-package" (schema_version: "1.0.0")
 * Base de validação compartilhada para importação (Fase 4 fundação), blocos e questões.
 */

import { z } from 'zod'

// 1. Regex e validações pt-BR para números de engenharia
export const parseBrazilianNumericInput = (val: unknown): number | null => {
  if (typeof val === 'number') {
    if (Number.isNaN(val) || !Number.isFinite(val)) return null
    return val
  }
  if (typeof val !== 'string') return null
  const cleaned = val.trim().replace(/\s/g, '').replace(',', '.')
  const num = Number(cleaned)
  if (Number.isNaN(num) || !Number.isFinite(num)) return null
  return num
}

// 2. Schema de Mídia
export const MediaAssetSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3, 'O título da mídia deve conter pelo menos 3 caracteres'),
  description: z.string().optional(),
  assetType: z.enum(['youtube_video', 'private_video', 'pdf_document', 'audio', 'image']),
  provider: z.enum(['youtube', 'cloudflare_stream', 's3_storage', 'external_url']),
  externalId: z.string().min(1, 'Identificador externo é obrigatório'),
  publicUrl: z.string().url('URL inválida para o ativo de mídia'),
  thumbnailUrl: z.string().url('URL de thumbnail inválida').optional().or(z.literal('')),
  durationSeconds: z.number().int().nonnegative().optional(),
  transcriptText: z.string().optional(),
  licenseInfo: z.string().default('Uso exclusivo Engenharia Divergente Academy'),
  tags: z.array(z.string()).default([]),
  accessRules: z.object({
    requiresEntitlement: z.boolean().default(true),
    allowedProductIds: z.array(z.string()).optional(),
  }),
})

// 3. Schema de Questão
export const QuestionOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  textMarkdown: z.string().min(1, 'O texto da alternativa não pode ser vazio'),
  distractorRationale: z.string().optional(),
})

export const QuestionPrivateKeySchema = z.object({
  correctOptionIds: z.array(z.string()).optional(),
  numericExpectedValue: z.number().optional(),
  numericToleranceAbs: z.number().nonnegative().optional(),
  numericToleranceRel: z.number().min(0).max(100).optional(),
  numericUnit: z.string().optional(),
  correctStepOrder: z.array(z.string()).optional(),
  rubricNotes: z.string().optional(),
})

export const QuestionBankItemSchema = z
  .object({
    id: z.string().min(1),
    externalId: z.string().min(2, 'ID externo da questão é obrigatório (ex: MEF-01)'),
    title: z.string().min(4, 'O título da questão deve ter pelo menos 4 caracteres'),
    questionType: z.enum([
      'single_choice',
      'multiple_choice',
      'true_false',
      'numeric_response',
      'ordered_steps',
    ]),
    subjectArea: z.string().min(2, 'A área de conhecimento é obrigatória'),
    competencyCode: z.string().min(2, 'O código de competência é obrigatório'),
    prerequisites: z.array(z.string()).default([]),
    authoringLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    promptMarkdown: z.string().min(10, 'O enunciado deve ter pelo menos 10 caracteres'),
    options: z.array(QuestionOptionSchema).default([]),
    privateKey: QuestionPrivateKeySchema,
    hint: z.string().optional(),
    explanationMarkdown: z.string().min(5, 'A explicação da resolução é obrigatória'),
    numericUnit: z.string().optional(),
    numericToleranceAbs: z.number().nonnegative().optional(),
    numericToleranceRel: z.number().min(0).max(100).optional(),
    estimatedSeconds: z.number().int().min(10).default(180),
    xpReward: z.number().int().min(1).default(15),
    tags: z.array(z.string()).default([]),
    editorialStatus: z.enum(['draft', 'in_review', 'published', 'archived']).default('draft'),
    version: z.number().int().min(1).default(1),
  })
  .superRefine((data, ctx) => {
    // Validação de consistência entre tipo e chave de correção
    if (data.questionType === 'single_choice' || data.questionType === 'true_false') {
      const correct = data.privateKey.correctOptionIds
      if (!correct || correct.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Questões de escolha única / V/F exigem exatamente UMA alternativa correta.',
          path: ['privateKey', 'correctOptionIds'],
        })
      }
    } else if (data.questionType === 'multiple_choice') {
      const correct = data.privateKey.correctOptionIds
      if (!correct || correct.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Questões de múltipla escolha exigem pelo menos UMA alternativa correta.',
          path: ['privateKey', 'correctOptionIds'],
        })
      }
    } else if (data.questionType === 'numeric_response') {
      if (
        data.privateKey.numericExpectedValue === undefined ||
        Number.isNaN(data.privateKey.numericExpectedValue)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Questões numéricas exigem um valor esperado numérico válido.',
          path: ['privateKey', 'numericExpectedValue'],
        })
      }
    } else if (data.questionType === 'ordered_steps') {
      const order = data.privateKey.correctStepOrder
      if (!order || order.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Questões de ordenação de etapas exigem pelo menos 2 etapas no gabarito.',
          path: ['privateKey', 'correctStepOrder'],
        })
      }
    }
  })

// 4. Schema Canônico do Pacote de Conteúdo "ediv-content-package" (schema_version: "1.0.0")
export const EdivContentPackageSchema = z.object({
  schema_version: z.literal('1.0.0'),
  package_id: z.string().min(1),
  name: z.string().min(3),
  description: z.string().optional(),
  author: z.string().default('Engenharia Divergente'),
  exported_at: z.string(),
  media_assets: z.array(MediaAssetSchema).default([]),
  questions: z.array(QuestionBankItemSchema).default([]),
  blocks: z
    .array(
      z.object({
        id: z.string().min(1),
        block_type: z.string().min(1),
        title: z.string().min(1),
        category: z.enum(['assessment', 'media', 'interaction', 'flow', 'marketing']),
        config: z.record(z.string(), z.unknown()),
        version: z.number().int().min(1).default(1),
      }),
    )
    .default([]),
})

export type EdivContentPackage = z.infer<typeof EdivContentPackageSchema>

/**
 * Validador canônico reutilizável da fundação de importação
 */
export function validateCanonicalPackage(rawJson: unknown): {
  success: boolean
  errors?: string[]
  data?: EdivContentPackage
} {
  const result = EdivContentPackageSchema.safeParse(rawJson)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errors = result.error.issues.map(
    (issue) => `${issue.path.join('.') || 'raiz'}: ${issue.message}`,
  )
  return { success: false, errors }
}
