/**
 * Camada de Serviços Swappable — Fila de Revisão Editorial (Fase 2)
 *
 * PONTO ÚNICO DE TROCA:
 * Quando o Supabase for conectado:
 * Tabela `editorial_review_queue` gerencia o fluxo de aprovação
 * (rascunho → em revisão → publicado / rejeitado) com auditoria.
 */

import { EditorialReviewItem, EditorialStatus } from '@/types/cms'
import { INITIAL_DEMO_REVIEWS } from '@/data/demoCmsData'
import { QuestionBankService } from './questionBankService'
import { BlockService } from './blockService'
import { Role } from '@/lib/rbac'

const REVIEWS_STORAGE_KEY = 'academy_demo_editorial_reviews'

function getStoredReviews(): EditorialReviewItem[] {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_REVIEWS))
      return INITIAL_DEMO_REVIEWS
    }
    return JSON.parse(raw) as EditorialReviewItem[]
  } catch {
    return INITIAL_DEMO_REVIEWS
  }
}

function persistReviews(reviews: EditorialReviewItem[]): void {
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews))
  } catch {
    // fallback
  }
}

export const ReviewWorkflowService = {
  assertEditorialAccess(role?: Role | null): void {
    if (!role || (role !== 'content_editor' && role !== 'admin' && role !== 'super_admin')) {
      throw new Error('Acesso negado: privilégios editoriais necessários.')
    }
  },

  async listQueue(status?: EditorialStatus | 'all'): Promise<EditorialReviewItem[]> {
    const list = getStoredReviews()
    if (!status || status === 'all') return list
    return list.filter((r) => r.currentStatus === status)
  },

  async submitToReview(
    entityType: 'question' | 'block',
    entityId: string,
    title: string,
    requesterName: string,
    categoryOrType: string,
    notes?: string,
    userRole?: Role | null,
  ): Promise<EditorialReviewItem> {
    this.assertEditorialAccess(userRole)

    // Atualiza status da entidade para in_review
    if (entityType === 'question') {
      await QuestionBankService.updateQuestion(entityId, { editorialStatus: 'in_review' }, userRole)
    } else {
      await BlockService.updateBlock(entityId, { editorialStatus: 'in_review' }, userRole)
    }

    const newItem: EditorialReviewItem = {
      id: `rev-${Date.now()}`,
      entityType,
      entityId,
      title,
      categoryOrType,
      currentStatus: 'in_review',
      requestedBy: requesterName,
      requestedAt: new Date().toISOString(),
      notes,
      isDemo: true,
    }

    const list = [newItem, ...getStoredReviews()]
    persistReviews(list)
    return newItem
  },

  async approveReview(
    reviewId: string,
    reviewerName: string,
    notes?: string,
    userRole?: Role | null,
  ): Promise<{ success: boolean; errors?: string[] }> {
    this.assertEditorialAccess(userRole)

    const list = getStoredReviews()
    const item = list.find((r) => r.id === reviewId)
    if (!item) return { success: false, errors: ['Item de revisão não encontrado.'] }

    if (item.entityType === 'question') {
      const pub = await QuestionBankService.publishQuestion(item.entityId, reviewerName, userRole)
      if (!pub.success) return { success: false, errors: pub.errors }
    } else {
      const pub = await BlockService.publishBlock(item.entityId, reviewerName, userRole)
      if (!pub.success) return { success: false, errors: pub.errors }
    }

    item.currentStatus = 'published'
    item.assignedReviewer = reviewerName
    if (notes) item.notes = `${item.notes || ''} [Aprovado: ${notes}]`
    persistReviews(list)

    return { success: true }
  },

  async rejectReview(
    reviewId: string,
    reviewerName: string,
    reason: string,
    userRole?: Role | null,
  ): Promise<{ success: boolean }> {
    this.assertEditorialAccess(userRole)

    const list = getStoredReviews()
    const item = list.find((r) => r.id === reviewId)
    if (!item) return { success: false }

    if (item.entityType === 'question') {
      await QuestionBankService.updateQuestion(
        item.entityId,
        { editorialStatus: 'draft', reviewNotes: reason },
        userRole,
      )
    } else {
      await BlockService.updateBlock(item.entityId, { editorialStatus: 'draft' }, userRole)
    }

    item.currentStatus = 'draft'
    item.assignedReviewer = reviewerName
    item.notes = `${item.notes || ''} [Devolvido para ajustes: ${reason}]`
    persistReviews(list)

    return { success: true }
  },
}
