/**
 * Camada de Serviços Swappable — Mídia Centralizada (Fase 2)
 *
 * PONTO ÚNICO DE TROCA:
 * Quando o Supabase for conectado:
 * 1. Substituir leituras em localStorage por `supabase.from('media_assets').select('*')`
 * 2. Substituir upload por `supabase.storage.from('media_library').upload(...)`
 * 3. As regras de bloqueio de exclusão quando o item estiver referenciado
 *    por bloco publicado já estão modeladas em SQL (check_media_deletion_allowed)
 */

import { MediaAsset } from '@/types/cms'
import { INITIAL_DEMO_MEDIA_ASSETS } from '@/data/demoCmsData'
import { BlockService } from './blockService'
import { Role } from '@/lib/rbac'

const MEDIA_STORAGE_KEY = 'academy_demo_media_assets'

function getStoredAssets(): MediaAsset[] {
  try {
    const raw = localStorage.getItem(MEDIA_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_MEDIA_ASSETS))
      return INITIAL_DEMO_MEDIA_ASSETS
    }
    return JSON.parse(raw) as MediaAsset[]
  } catch {
    return INITIAL_DEMO_MEDIA_ASSETS
  }
}

function persistAssets(assets: MediaAsset[]): void {
  try {
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(assets))
  } catch {
    // fallback em memória
  }
}

export const MediaService = {
  /**
   * Valida permissão editorial: content_editor, admin, super_admin
   */
  assertEditorialAccess(role?: Role | null): void {
    if (!role || (role !== 'content_editor' && role !== 'admin' && role !== 'super_admin')) {
      throw new Error('Acesso negado: privilégios editoriais necessários.')
    }
  },

  async listMedia(params?: {
    search?: string
    type?: string
    tag?: string
    productId?: string
  }): Promise<MediaAsset[]> {
    let list = getStoredAssets()

    if (params?.search) {
      const q = params.search.toLowerCase()
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }

    if (params?.type && params.type !== 'all') {
      list = list.filter((m) => m.assetType === params.type)
    }

    if (params?.tag) {
      list = list.filter((m) => m.tags.includes(params.tag!))
    }

    if (params?.productId) {
      list = list.filter((m) => m.relatedProductId === params.productId)
    }

    return list
  },

  async getById(id: string): Promise<MediaAsset | null> {
    const list = getStoredAssets()
    return list.find((m) => m.id === id) || null
  },

  async createMedia(
    data: Omit<MediaAsset, 'id' | 'createdAt' | 'updatedAt' | 'isDemo'>,
    userRole?: Role | null,
  ): Promise<MediaAsset> {
    this.assertEditorialAccess(userRole)

    const newAsset: MediaAsset = {
      ...data,
      id: `med-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: true,
    }

    const list = [newAsset, ...getStoredAssets()]
    persistAssets(list)
    return newAsset
  },

  async updateMedia(
    id: string,
    updates: Partial<MediaAsset>,
    userRole?: Role | null,
  ): Promise<MediaAsset> {
    this.assertEditorialAccess(userRole)

    const list = getStoredAssets()
    const index = list.findIndex((m) => m.id === id)
    if (index === -1) throw new Error('Ativo de mídia não encontrado.')

    const updated = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    list[index] = updated
    persistAssets(list)
    return updated
  },

  async duplicateMedia(id: string, userRole?: Role | null): Promise<MediaAsset> {
    this.assertEditorialAccess(userRole)

    const original = await this.getById(id)
    if (!original) throw new Error('Ativo original não encontrado.')

    return this.createMedia(
      {
        ...original,
        title: `${original.title} (Cópia)`,
      },
      userRole,
    )
  },

  /**
   * Bloqueia exclusão quando o item for referenciado por bloco publicado
   */
  async deleteMedia(
    id: string,
    userRole?: Role | null,
  ): Promise<{ success: boolean; reason?: string }> {
    this.assertEditorialAccess(userRole)

    // Checa referências com BlockService
    const blocks = await BlockService.listBlocks()
    const referencingBlock = blocks.find(
      (b) => b.referencedMediaId === id && b.editorialStatus === 'published',
    )

    if (referencingBlock) {
      return {
        success: false,
        reason: `Mídia bloqueada para exclusão: referenciada pelo bloco publicado "${referencingBlock.title}" (ID: ${referencingBlock.id}). Desvincule ou arquive o bloco antes.`,
      }
    }

    const list = getStoredAssets().filter((m) => m.id !== id)
    persistAssets(list)
    return { success: true }
  },
}
