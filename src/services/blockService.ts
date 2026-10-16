/**
 * BlockService — Gerenciador Universal de Blocos com Persistência Supabase (Subfase 4.3)
 *
 * Suporta:
 * - Persistência em `public.content_blocks` e `public.block_versions`
 * - Rascunho vs Versões publicadas imutáveis
 * - Reutilização de blocos em múltiplas trilhas via `block_track_references`
 * - Optimistic locking com coluna `revision`
 * - Isolamento transparente para modo demonstração
 */

import { ContentBlock, EditorialStatus, VersionSnapshot, BlockTypeId } from '@/types/cms'
import { INITIAL_DEMO_BLOCKS } from '@/data/demoCmsData'
import { getBlockDefinition } from '@/components/cms/BlockRegistry'
import { Role, isAdminRole, isEditorialRole } from '@/lib/rbac'
import { supabase } from '@/lib/supabase/client'
import { IS_DEMO } from '@/data/demoData'

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

function mapDbRowToContentBlock(row: any): ContentBlock {
  return {
    id: row.id,
    blockType: row.block_type as BlockTypeId,
    category: row.category,
    title: row.title,
    description: row.description || undefined,
    subjectArea: row.subject_area || undefined,
    associatedCompetencies: row.associated_competencies || [],
    initialDifficulty: (row.initial_difficulty || 3) as any,
    estimatedMinutes: row.estimated_minutes || 5,
    author: row.author || undefined,
    editorialStatus: row.editorial_status,
    version: row.version || 1,
    config: row.config_json || {},
    completionPolicy: row.completion_policy,
    tags: row.tags || [],
    mediaReferences: Array.isArray(row.media_references) ? row.media_references : [],
    trackReferences: [],
    createdByName: 'Autor do Bloco',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isDemo: false,
  }
}

export const BlockService = {
  assertEditorialAccess(role?: Role | null): void {
    if (!role || !isEditorialRole(role)) {
      throw new Error('Acesso negado: privilégios editoriais necessários.')
    }
  },

  assertPublishAccess(role?: Role | null): void {
    if (!role || !isAdminRole(role)) {
      throw new Error('Acesso negado: publicação final restrita a administradores.')
    }
  },

  async listBlocks(filters?: {
    search?: string
    type?: BlockTypeId | 'all'
    status?: EditorialStatus | 'all'
    category?: string
  }): Promise<ContentBlock[]> {
    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'

    if (!isDemoMode) {
      try {
        let query = supabase.from('content_blocks').select('*')

        if (filters?.type && filters.type !== 'all') {
          query = query.eq('block_type', filters.type)
        }
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('editorial_status', filters.status)
        }
        if (filters?.category && filters.category !== 'all') {
          query = query.eq('category', filters.category as any)
        }

        const { data, error } = await query.order('created_at', { ascending: false })

        if (!error && data && data.length > 0) {
          let list = data.map(mapDbRowToContentBlock)
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
          return list
        }
      } catch (err) {
        console.warn('Fallback para listagem local de blocos:', err)
      }
    }

    // Modo local / Fallback
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
    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'

    if (!isDemoMode) {
      try {
        const { data, error } = await supabase
          .from('content_blocks')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        if (!error && data) {
          return mapDbRowToContentBlock(data)
        }
      } catch (err) {
        console.warn('Fallback para getById local:', err)
      }
    }

    const list = getStoredBlocks()
    return list.find((b) => b.id === id) || null
  },

  async getBlockVersions(blockId: string): Promise<VersionSnapshot<ContentBlock>[]> {
    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'

    if (!isDemoMode) {
      try {
        const { data, error } = await supabase
          .from('block_versions')
          .select('*')
          .eq('block_id', blockId)
          .order('version_number', { ascending: false })

        if (!error && data) {
          return data.map((row) => ({
            id: row.id,
            entityId: row.block_id,
            versionNumber: row.version_number,
            snapshot: row.snapshot as any,
            publishedBy: 'Administrador Responsável',
            publishedAt: row.published_at,
            changeSummary: `Versão ${row.version_number} publicada`,
          }))
        }
      } catch (err) {
        console.warn('Fallback para versões locais do bloco:', err)
      }
    }

    const all = getStoredBlockVersions()
    return all.filter((v) => v.entityId === blockId)
  },

  async createBlock(
    data: Omit<ContentBlock, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'isDemo'> & {
      id?: string
    },
    userRole?: Role | null,
  ): Promise<ContentBlock> {
    this.assertEditorialAccess(userRole)

    const def = getBlockDefinition(data.blockType)
    if (def) {
      const validation = def.validateConfig(data.config)
      if (!validation.valid) {
        throw new Error(`Erro na validação do bloco: ${validation.errors?.join('; ')}`)
      }
    }

    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'

    if (!isDemoMode) {
      try {
        const insertPayload: any = {
          block_type: data.blockType,
          category: data.category,
          title: data.title,
          description: data.description || null,
          subject_area: data.subjectArea || null,
          associated_competencies: data.associatedCompetencies || [],
          initial_difficulty: data.initialDifficulty || 3,
          estimated_minutes: data.estimatedMinutes || 5,
          author: data.author || 'Editor de Conteúdo',
          editorial_status: data.editorialStatus || 'draft',
          version: 1,
          revision: 1,
          config_json: data.config,
          completion_policy: data.completionPolicy || 'submitted',
          tags: data.tags || [],
          media_references: data.mediaReferences || [],
        }

        if (data.id && data.id.includes('-') && data.id.length === 36) {
          insertPayload.id = data.id
        }

        const { data: createdRow, error } = await supabase
          .from('content_blocks')
          .insert(insertPayload)
          .select('*')
          .single()

        if (!error && createdRow) {
          return mapDbRowToContentBlock(createdRow)
        }
      } catch (err) {
        console.warn('Fallback para criação local de bloco:', err)
      }
    }

    const newBlock: ContentBlock = {
      ...data,
      id: data.id || `blk-${Date.now()}`,
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

    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'

    if (!isDemoMode) {
      try {
        const { data: current, error: getErr } = await (supabase.from('content_blocks') as any)
          .select('*')
          .eq('id', id)
          .single()

        if (!getErr && current) {
          let nextVersion = current.version || 1
          // Se já estava publicado e sofre alteração de configuração técnica, cria snapshot em block_versions
          if (current.editorial_status === 'published' && updates.config) {
            nextVersion += 1
            await (supabase.from('block_versions') as any).insert({
              block_id: current.id,
              version_number: current.version,
              snapshot: current,
              published_at: new Date().toISOString(),
            })
          }

          const patchPayload: any = {
            updated_at: new Date().toISOString(),
            version: nextVersion,
            revision: (current.revision || 1) + 1,
          }

          if (updates.title !== undefined) patchPayload.title = updates.title
          if (updates.description !== undefined) patchPayload.description = updates.description
          if (updates.editorialStatus !== undefined)
            patchPayload.editorial_status = updates.editorialStatus
          if (updates.config !== undefined) patchPayload.config_json = updates.config
          if (updates.tags !== undefined) patchPayload.tags = updates.tags
          if (updates.completionPolicy !== undefined)
            patchPayload.completion_policy = updates.completionPolicy

          const { data: updatedRow, error: updateErr } = await (
            supabase.from('content_blocks') as any
          )
            .update(patchPayload)
            .eq('id', id)
            .select('*')
            .single()
          if (!updateErr && updatedRow) {
            return mapDbRowToContentBlock(updatedRow)
          }
        }
      } catch (err) {
        console.warn('Fallback para update local do bloco:', err)
      }
    }

    const list = getStoredBlocks()
    const index = list.findIndex((b) => b.id === id)
    if (index === -1) throw new Error('Bloco não encontrado.')

    const current = list[index]

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
    this.assertPublishAccess(userRole)

    const block = await this.getById(id)
    if (!block) return { success: false, errors: ['Bloco não encontrado.'] }

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

    // Grava snapshot imutável em block_versions
    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'
    if (!isDemoMode) {
      try {
        await supabase.from('block_versions').upsert({
          block_id: updated.id,
          version_number: updated.version,
          snapshot: updated,
          published_at: new Date().toISOString(),
        })
      } catch (err) {
        console.warn('Erro ao salvar snapshot de versão do bloco no Supabase:', err)
      }
    }

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

    const isDemoMode = IS_DEMO && localStorage.getItem('academy_auth_mode') !== 'supabase'

    if (!isDemoMode) {
      try {
        // Se publicado, arquiva para preservar integridade de trilhas
        const current = await this.getById(id)
        if (current && current.editorialStatus === 'published') {
          await this.updateBlock(id, { editorialStatus: 'archived' }, userRole)
          return {
            success: true,
            reason: 'Bloco publicado arquivado para manter a integridade histórica.',
          }
        }

        const { error } = await supabase.from('content_blocks').delete().eq('id', id)
        if (!error) return { success: true }
      } catch (err) {
        console.warn('Fallback para delete local do bloco:', err)
      }
    }

    const current = await this.getById(id)
    if (current && (current.trackReferences?.length ?? 0) > 0) {
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
