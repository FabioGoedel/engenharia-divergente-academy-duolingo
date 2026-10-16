/**
 * Camada de Serviços Swappable — Mídia Centralizada e Storage Real (Subfase 4.4)
 *
 * Integração direta com:
 * - Supabase Storage (buckets: 'media_library' e 'protected_materials')
 * - PostgreSQL: public.media_assets e public.media_asset_versions
 * - Edge Function: signed-media-url para emissão segura de URLs temporárias
 * - Detecção de duplicatas por hash SHA-256
 * - Bloqueio de exclusão destrutiva de recursos vinculados a blocos publicados
 */

import { supabase } from '@/lib/supabase/client'
import { MediaAsset } from '@/types/cms'
import { INITIAL_DEMO_MEDIA_ASSETS } from '@/data/demoCmsData'
import { BlockService } from './blockService'
import { Role } from '@/lib/rbac'
import { classifyFile, validateSafeFileName, calculateFileSha256 } from './mediaClassifier'

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
    // fallback
  }
}

export interface UploadMediaOptions {
  folderPath?: string
  relatedProductId?: string
  isRestricted?: boolean
  tags?: string[]
  description?: string
  isMandatoryReading?: boolean
  allowDownload?: boolean
}

export interface MediaSignedUrlResponse {
  assetId: string
  signedUrl: string
  expiresIn: number
  bucket: string
  title: string
  isExternal?: boolean
}

export const MediaService = {
  assertEditorialAccess(role?: Role | null): void {
    if (!role || (role !== 'content_editor' && role !== 'admin' && role !== 'super_admin')) {
      throw new Error('Acesso negado: privilégios editoriais necessários.')
    }
  },

  /**
   * Lista recursos de mídia do Supabase com fallback seguro
   */
  async listMedia(params?: {
    search?: string
    type?: string
    tag?: string
    productId?: string
    categoryTag?: string
    folderPath?: string
    includeArchived?: boolean
  }): Promise<MediaAsset[]> {
    try {
      let query = (supabase as any)
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false })

      if (!params?.includeArchived) {
        query = query.or('is_archived.is.null,is_archived.eq.false')
      }

      if (params?.productId) {
        query = query.eq('related_product_id', params.productId)
      }

      if (params?.folderPath && params.folderPath !== 'all') {
        query = query.eq('folder_path', params.folderPath)
      }

      const { data, error } = await query

      if (!error && data && data.length > 0) {
        let items: MediaAsset[] = data.map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description || '',
          assetType: row.asset_type,
          provider: row.provider,
          externalId: row.external_id,
          publicUrl: row.public_url,
          thumbnailUrl: row.thumbnail_url,
          durationSeconds: row.duration_seconds,
          transcriptText: row.transcript_text,
          licenseInfo: row.license_info || 'Uso exclusivo Engenharia Divergente Academy',
          accessRules: row.access_rules || { requiresEntitlement: true },
          tags: row.tags || [],
          relatedProductId: row.related_product_id,
          fileSizeBytes: row.file_size_bytes,
          isPendingStorage: Boolean(row.is_pending_storage),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          storageBucket: row.storage_bucket,
          storagePath: row.storage_path,
          fileHash: row.file_hash,
          mimeType: row.mime_type,
          originalFilename: row.original_filename,
          fileExtension: row.file_extension,
          folderPath: row.folder_path || '/',
          categoryTag: row.category_tag || 'documents',
          isArchived: Boolean(row.is_archived),
          isMandatoryReading: Boolean(row.is_mandatory_reading),
          allowDownload: row.allow_download !== false,
          version: row.version || 1,
          rootAssetId: row.root_asset_id,
          isDemo: false,
        }))

        if (params?.search) {
          const q = params.search.toLowerCase()
          items = items.filter(
            (m) =>
              m.title.toLowerCase().includes(q) ||
              m.description?.toLowerCase().includes(q) ||
              m.tags.some((t) => t.toLowerCase().includes(q)) ||
              m.originalFilename?.toLowerCase().includes(q),
          )
        }

        if (params?.type && params.type !== 'all') {
          items = items.filter((m) => m.assetType === params.type)
        }

        if (params?.categoryTag && params.categoryTag !== 'all') {
          items = items.filter((m) => m.categoryTag === params.categoryTag)
        }

        if (params?.tag) {
          items = items.filter((m) => m.tags.includes(params.tag!))
        }

        return items
      }
    } catch (err) {
      console.warn('Fallback para armazenamento local de mídias:', err)
    }

    // Fallback demo local
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
    return list
  },

  async getById(id: string): Promise<MediaAsset | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('media_assets')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (!error && data) {
        return {
          id: data.id,
          title: data.title,
          description: data.description || '',
          assetType: data.asset_type,
          provider: data.provider,
          externalId: data.external_id,
          publicUrl: data.public_url,
          thumbnailUrl: data.thumbnail_url,
          durationSeconds: data.duration_seconds,
          transcriptText: data.transcript_text,
          licenseInfo: data.license_info,
          accessRules: data.access_rules || { requiresEntitlement: true },
          tags: data.tags || [],
          relatedProductId: data.related_product_id,
          fileSizeBytes: data.file_size_bytes,
          isPendingStorage: Boolean(data.is_pending_storage),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          storageBucket: data.storage_bucket,
          storagePath: data.storage_path,
          fileHash: data.file_hash,
          mimeType: data.mime_type,
          originalFilename: data.original_filename,
          fileExtension: data.file_extension,
          folderPath: data.folder_path,
          categoryTag: data.category_tag,
          isArchived: Boolean(data.is_archived),
          isMandatoryReading: Boolean(data.is_mandatory_reading),
          allowDownload: data.allow_download !== false,
          version: data.version || 1,
          rootAssetId: data.root_asset_id,
        }
      }
    } catch {
      // segue para fallback
    }

    const localList = getStoredAssets()
    return localList.find((m) => m.id === id) || null
  },

  /**
   * Upload de arquivo físico para o Supabase Storage real
   */
  async uploadFileToStorage(
    file: File | Blob,
    filename: string,
    options?: UploadMediaOptions,
    userRole?: Role | null,
  ): Promise<MediaAsset> {
    this.assertEditorialAccess(userRole)

    // 1. Validação de segurança do nome do arquivo
    const safetyCheck = validateSafeFileName(filename)
    if (!safetyCheck.valid) {
      throw new Error(safetyCheck.reason || 'Arquivo recusado por segurança.')
    }

    // 2. Classificação técnica do arquivo
    const classification = classifyFile(filename, (file as File).type)
    const hash = await calculateFileSha256(file)

    // 3. Detecção de duplicatas por SHA-256 no banco
    const { data: existingDuplicate } = await (supabase as any)
      .from('media_assets')
      .select('*')
      .eq('file_hash', hash)
      .eq('is_archived', false)
      .maybeSingle()

    if (existingDuplicate) {
      console.info('Arquivo duplicado detectado pelo hash SHA-256:', existingDuplicate.id)
      return {
        id: existingDuplicate.id,
        title: existingDuplicate.title,
        description: existingDuplicate.description,
        assetType: existingDuplicate.asset_type,
        provider: existingDuplicate.provider,
        externalId: existingDuplicate.external_id,
        publicUrl: existingDuplicate.public_url,
        thumbnailUrl: existingDuplicate.thumbnail_url,
        licenseInfo: existingDuplicate.license_info,
        accessRules: existingDuplicate.access_rules,
        tags: existingDuplicate.tags || [],
        relatedProductId: existingDuplicate.related_product_id,
        fileSizeBytes: existingDuplicate.file_size_bytes,
        isPendingStorage: false,
        createdAt: existingDuplicate.created_at,
        updatedAt: existingDuplicate.updated_at,
        storageBucket: existingDuplicate.storage_bucket,
        storagePath: existingDuplicate.storage_path,
        fileHash: existingDuplicate.file_hash,
        mimeType: existingDuplicate.mime_type,
        originalFilename: existingDuplicate.original_filename,
        fileExtension: existingDuplicate.file_extension,
        folderPath: existingDuplicate.folder_path,
        categoryTag: existingDuplicate.category_tag,
        isArchived: existingDuplicate.is_archived,
        version: existingDuplicate.version,
      }
    }

    // 4. Decide o bucket (restrito -> protected_materials; público/imagem -> media_library)
    const isRestricted =
      options?.isRestricted !== false &&
      (classification.isEngineeringCad ||
        classification.assetType === 'pdf_document' ||
        classification.assetType === 'cad_model' ||
        classification.assetType === 'spreadsheet')

    const bucket = isRestricted ? 'protected_materials' : 'media_library'
    const folder = (options?.folderPath || '/materials').replace(/^\/|\/$/g, '')
    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${folder}/${Date.now()}_${cleanFilename}`

    // 5. Envia ao Storage Supabase
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file, {
        contentType: classification.mimeType,
        upsert: false,
      })

    if (uploadErr) {
      throw new Error(`Falha no upload para o Supabase Storage: ${uploadErr.message}`)
    }

    // 6. Obtém URL inicial ou pública
    let publicUrl = ''
    if (bucket === 'media_library') {
      const { data: pubUrlData } = supabase.storage.from(bucket).getPublicUrl(storagePath)
      publicUrl = pubUrlData.publicUrl
    } else {
      // Para materiais protegidos, a URL pública é um endpoint seguro de acesso
      publicUrl = `/storage/protected/${storagePath}`
    }

    // Thumbnail padrão
    let thumbnailUrl = 'https://img.usecurling.com/p/640/360?q=engineering%20document'
    if (classification.category === 'cad') {
      thumbnailUrl = 'https://img.usecurling.com/p/640/360?q=solidworks%20cad%20model'
    } else if (classification.category === 'spreadsheets') {
      thumbnailUrl = 'https://img.usecurling.com/p/640/360?q=engineering%20spreadsheet'
    } else if (classification.category === 'images' && bucket === 'media_library') {
      thumbnailUrl = publicUrl
    }

    const { data: userData } = await supabase.auth.getUser()

    // 7. Persiste metadados em public.media_assets
    const { data: insertedRow, error: insertErr } = await (supabase as any)
      .from('media_assets')
      .insert({
        title: filename.replace(/\.[^.]+$/, ''),
        description: options?.description || classification.label,
        asset_type: classification.assetType,
        provider: 'supabase_storage',
        external_id: uploadData.path,
        public_url: publicUrl,
        thumbnail_url: thumbnailUrl,
        license_info: 'Uso exclusivo Engenharia Divergente Academy',
        access_rules: {
          requires_entitlement: isRestricted,
        },
        tags: options?.tags || [classification.category, 'subfase-4.4'],
        related_product_id: options?.relatedProductId || null,
        file_size_bytes: file.size,
        is_pending_storage: false,
        storage_bucket: bucket,
        storage_path: uploadData.path,
        file_hash: hash,
        mime_type: classification.mimeType,
        original_filename: filename,
        file_extension: filename.split('.').pop()?.toLowerCase(),
        folder_path: options?.folderPath || '/',
        category_tag: classification.category,
        is_archived: false,
        is_mandatory_reading: Boolean(options?.isMandatoryReading),
        allow_download: options?.allowDownload !== false,
        version: 1,
        created_by: userData?.user?.id || null,
      })
      .select('*')
      .single()

    if (insertErr || !insertedRow) {
      // Compensação: tenta remover arquivo do Storage se falhou no banco
      await supabase.storage.from(bucket).remove([storagePath])
      throw new Error(`Falha ao registrar metadados da mídia: ${insertErr?.message}`)
    }

    return {
      id: insertedRow.id,
      title: insertedRow.title,
      description: insertedRow.description,
      assetType: insertedRow.asset_type,
      provider: insertedRow.provider,
      externalId: insertedRow.external_id,
      publicUrl: insertedRow.public_url,
      thumbnailUrl: insertedRow.thumbnail_url,
      licenseInfo: insertedRow.license_info,
      accessRules: insertedRow.access_rules,
      tags: insertedRow.tags || [],
      relatedProductId: insertedRow.related_product_id,
      fileSizeBytes: insertedRow.file_size_bytes,
      isPendingStorage: false,
      createdAt: insertedRow.created_at,
      updatedAt: insertedRow.updated_at,
      storageBucket: insertedRow.storage_bucket,
      storagePath: insertedRow.storage_path,
      fileHash: insertedRow.file_hash,
      mimeType: insertedRow.mime_type,
      originalFilename: insertedRow.original_filename,
      fileExtension: insertedRow.file_extension,
      folderPath: insertedRow.folder_path,
      categoryTag: insertedRow.category_tag,
      version: insertedRow.version,
    }
  },

  /**
   * Solicita URL assinada temporária através da Edge Function protegida
   */
  async getSignedUrl(
    assetId: string,
    action: 'view' | 'download' = 'view',
    expiresInSeconds: number = 3600,
  ): Promise<MediaSignedUrlResponse> {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token

    if (!token) {
      throw new Error('Sessão expirada ou não autenticada.')
    }

    const { data, error } = await supabase.functions.invoke('signed-media-url', {
      body: {
        assetId,
        action,
        expiresInSeconds,
      },
    })

    if (error) {
      throw new Error(`Falha ao obter URL assinada: ${error.message}`)
    }

    if (data?.error) {
      throw new Error(data.error)
    }

    return data as MediaSignedUrlResponse
  },

  async createMedia(
    data: Omit<MediaAsset, 'id' | 'createdAt' | 'updatedAt' | 'isDemo'>,
    userRole?: Role | null,
  ): Promise<MediaAsset> {
    this.assertEditorialAccess(userRole)

    try {
      const { data: row, error } = await (supabase as any)
        .from('media_assets')
        .insert({
          title: data.title,
          description: data.description || '',
          asset_type: data.assetType,
          provider: data.provider,
          external_id: data.externalId,
          public_url: data.publicUrl,
          thumbnail_url: data.thumbnailUrl,
          duration_seconds: data.durationSeconds,
          transcript_text: data.transcriptText,
          license_info: data.licenseInfo,
          access_rules: data.accessRules,
          tags: data.tags,
          related_product_id: data.relatedProductId || null,
          file_size_bytes: data.fileSizeBytes,
          is_pending_storage: Boolean(data.isPendingStorage),
          storage_bucket: data.storageBucket || 'protected_materials',
          storage_path: data.storagePath,
          category_tag: data.categoryTag || 'documents',
          folder_path: data.folderPath || '/',
          version: 1,
        })
        .select('*')
        .single()

      if (!error && row) {
        return {
          id: row.id,
          title: row.title,
          description: row.description,
          assetType: row.asset_type,
          provider: row.provider,
          externalId: row.external_id,
          publicUrl: row.public_url,
          thumbnailUrl: row.thumbnail_url,
          durationSeconds: row.duration_seconds,
          transcriptText: row.transcript_text,
          licenseInfo: row.license_info,
          accessRules: row.access_rules,
          tags: row.tags || [],
          relatedProductId: row.related_product_id,
          fileSizeBytes: row.file_size_bytes,
          isPendingStorage: row.is_pending_storage,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          storageBucket: row.storage_bucket,
          storagePath: row.storage_path,
          categoryTag: row.category_tag,
          folderPath: row.folder_path,
          version: row.version,
        }
      }
    } catch {
      // segue para fallback
    }

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

    try {
      const { data: row, error } = await (supabase as any)
        .from('media_assets')
        .update({
          title: updates.title,
          description: updates.description,
          tags: updates.tags,
          related_product_id: updates.relatedProductId,
          folder_path: updates.folderPath,
          category_tag: updates.categoryTag,
          is_mandatory_reading: updates.isMandatoryReading,
          allow_download: updates.allowDownload,
          is_archived: updates.isArchived,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()

      if (!error && row) {
        return {
          id: row.id,
          title: row.title,
          description: row.description,
          assetType: row.asset_type,
          provider: row.provider,
          externalId: row.external_id,
          publicUrl: row.public_url,
          thumbnailUrl: row.thumbnail_url,
          durationSeconds: row.duration_seconds,
          tags: row.tags || [],
          relatedProductId: row.related_product_id,
          isArchived: row.is_archived,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          licenseInfo: row.license_info,
          accessRules: row.access_rules,
          isPendingStorage: false,
        }
      }
    } catch {
      // segue fallback
    }

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
   * Exclusão protegida: checa integridade referencial com blocos publicados
   */
  async deleteMedia(
    id: string,
    userRole?: Role | null,
  ): Promise<{ success: boolean; reason?: string }> {
    this.assertEditorialAccess(userRole)

    // 1. Verifica via RPC no banco
    try {
      const { data: checkRes } = await (supabase.rpc as any)('check_media_deletion_allowed', {
        p_asset_id: id,
      })
      if (checkRes && !checkRes.allowed) {
        return {
          success: false,
          reason: checkRes.reason,
        }
      }
    } catch {
      // fallback
    }

    // 2. Checa com BlockService
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

    // 3. Tenta remover do Supabase
    try {
      const { data: asset } = await (supabase as any)
        .from('media_assets')
        .select('storage_bucket, storage_path')
        .eq('id', id)
        .maybeSingle()

      if (asset?.storage_bucket && asset?.storage_path) {
        await supabase.storage.from(asset.storage_bucket).remove([asset.storage_path])
      }

      await supabase.from('media_assets').delete().eq('id', id)
    } catch (err) {
      console.warn('Erro ao deletar mídia no Supabase:', err)
    }

    const list = getStoredAssets().filter((m) => m.id !== id)
    persistAssets(list)
    return { success: true }
  },

  /**
   * Arquivamento seguro (sem exclusão física)
   */
  async archiveMedia(id: string, userRole?: Role | null): Promise<boolean> {
    this.assertEditorialAccess(userRole)
    await this.updateMedia(id, { isArchived: true }, userRole)
    return true
  },
}
