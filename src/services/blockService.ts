/**
 * Camada de Serviços Swappable — Gerenciador de Blocos (Fase 2)
 *
 * PONTO ÚNICO DE TROCA:
 * Quando o Supabase for conectado:
 * 1. `content_blocks` salva as instâncias de bloco.
 * 2. Publicações criam snapshots imutáveis em `block_versions`.
 * 3. Validação de config é executada tanto no cliente (via BlockRegistryItem.validateConfig)
 *    quanto via trigger ou edge function.
 */

import { ContentBlock, EditorialStatus, VersionSnapshot, BlockTypeId } from '@/types/cms'
import { INITIAL_DEMO_BLOCKS } from '@/data/demoCmsData'
import { getBlockDefinition } from '@/components/cms/BlockRegistry'
import { Role } from '@/lib/rbac'

const BLOCKS_STORAGE_KEY = 'academy_demo_content_blocks'
const BLOCK_VERSIONS_STORAGE_KEY = 'academy_demo_block_versions'

function getStoredBlocks(): ContentBlock[] {
  try {
    const raw = localStorage.getItem(BLOCKS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(BLOCKS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_BLOCKS))
      return INITIAL_DEMO_BLOCKS
    }
    return JSON.parse(raw) as ContentBlock[]
  } catch {
    return INITIAL_DEMO_BLOCKS
  }
}

function persistBlocks(blocks: ContentBlock[]): void {
  try {
    localStorage.setItem(BLOCKS_STORAGE_KEY, JSON.stringify(blocks))
  } catch {
    // fallback
  }
}

function getStoredBlockVersions(): VersionSnapshot<ContentBlock>[] {
  try {
    const raw = localStorage.getItem(BLOCK_VERSIONS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistBlockVersions(versions: VersionSnapshot<ContentBlock>[]): void {
  try {
    localStorage.setItem(BLOCK_VERSIONS_STORAGE_KEY, JSON.stringify(versions))
  } catch {
    // fallback
  }
}

export const BlockService = {
  assertEditorialAccess(role?: Role | null): void {
    if (!role || (role !== 'content_editor' && role !== 'admin' && role !== 'super_admin')) {
      throw new Error('Acesso negado: privilégios editoriais necessários.')
    }
  },

  async listBlocks(filters?: {
    search?: string
    type?: BlockTypeId | 'all'
    status?: EditorialStatus | 'all'
    category?: string
  }): Promise<ContentBlock[]> {
    let list = getStoredBlocks()

    if (filters?.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q)) ||
          b.blockType.toLowerCase().includes(q),
      )
    }

    if (filters?.type && filters.type !== 'all') {
      list = list.filter((b) => b.blockType === filters.type)
    }

    if (filters?.status && filters.status !== 'all') {
      list = list.filter((b) => b.editorialStatus === filters.status)
    }

    if (filters?.category && filters.category !== 'all') {
      list = list.filter((b) => b.category === filters.category)
    }

    return list
  },

  async getById(id: string): Promise<ContentBlock | null> {
    const list = getStoredBlocks()
    return list.find((b) => b.id === id) || null
  },

  async getBlockVersions(blockId: string): Promise<VersionSnapshot<ContentBlock>[]> {
    const all = getStoredBlockVersions()
    return all.filter((v) => v.entityId === blockId)
  },

  async createBlock(
    data: Omit<ContentBlock, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'isDemo'>,
    userRole?: Role | null,
  ): Promise<ContentBlock> {
    this.assertEditorialAccess(userRole)

    // Valida configuração contra o schema do tipo
    const def = getBlockDefinition(data.blockType)
    if (def) {
      const validation = def.validateConfig(data.config)
      if (!validation.valid) {
        throw new Error(`Erro na validação do bloco: ${validation.errors?.join('; ')}`)
      }
    }

    const newBlock: ContentBlock = {
      ...data,
      id: `blk-${Date.now()}`,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: true,
    }

    const list = [newBlock, ...getStoredBlocks()]
    persistBlocks(list)
    return newBlock
  },

  async updateBlock(
    id: string,
    updates: Partial<ContentBlock>,
    userRole?: Role | null,
    actorName?: string,
  ): Promise<ContentBlock> {
    this.assertEditorialAccess(userRole)

    const list = getStoredBlocks()
    const index = list.findIndex((b) => b.id === id)
    if (index === -1) throw new Error('Bloco não encontrado.')

    const current = list[index]

    // Validação de config caso tenha mudado
    if (updates.config) {
      const def = getBlockDefinition(updates.blockType || current.blockType)
      if (def) {
        const validation = def.validateConfig(updates.config)
        if (!validation.valid) {
          throw new Error(`Validação falhou: ${validation.errors?.join('; ')}`)
        }
      }
    }

    let newVersion = current.version
    // Se estiver publicado e houver alteração técnica, arquiva versão imutável
    if (current.editorialStatus === 'published' && updates.config) {
      newVersion += 1
      const versions = getStoredBlockVersions()
      versions.push({
        id: `bver-${Date.now()}`,
        entityId: current.id,
        versionNumber: current.version,
        snapshot: current,
        publishedBy: actorName || 'Editor Responsável',
        publishedAt: new Date().toISOString(),
        changeSummary: 'Nova versão gerada após ajuste em configuração.',
      })
      persistBlockVersions(versions)
    }

    const updated: ContentBlock = {
      ...current,
      ...updates,
      version: newVersion,
      updatedAt: new Date().toISOString(),
    }

    list[index] = updated
    persistBlocks(list)
    return updated
  },

  async publishBlock(
    id: string,
    publisherName: string,
    userRole?: Role | null,
  ): Promise<{ success: boolean; block?: ContentBlock; errors?: string[] }> {
    this.assertEditorialAccess(userRole)

    const block = await this.getById(id)
    if (!block) return { success: false, errors: ['Bloco não encontrado.'] }

    // Validação do tipo de bloco
    const def = getBlockDefinition(block.blockType)
    if (def) {
      const validation = def.validateConfig(block.config)
      if (!validation.valid) {
        return { success: false, errors: validation.errors }
      }
    }

    const updated = await this.updateBlock(
      id,
      { editorialStatus: 'published' },
      userRole,
      publisherName,
    )

    return { success: true, block: updated }
  },

  async cloneBlock(id: string, userRole?: Role | null): Promise<ContentBlock> {
    this.assertEditorialAccess(userRole)

    const original = await this.getById(id)
    if (!original) throw new Error('Bloco original não encontrado.')

    return this.createBlock(
      {
        ...original,
        title: `${original.title} (Clone)`,
        editorialStatus: 'draft',
      },
      userRole,
    )
  },

  async deleteBlock(
    id: string,
    userRole?: Role | null,
  ): Promise<{ success: boolean; reason?: string }> {
    this.assertEditorialAccess(userRole)

    const current = await this.getById(id)
    if (current && (current.trackReferences?.length ?? 0) > 0) {
      // Se possui referências em cursos, arquiva
      await this.updateBlock(id, { editorialStatus: 'archived' }, userRole)
      return {
        success: true,
        reason:
          'O bloco está referenciado em trilhas ativas; foi arquivado com sucesso para manter a integridade.',
      }
    }

    const list = getStoredBlocks().filter((b) => b.id !== id)
    persistBlocks(list)
    return { success: true }
  },
}
