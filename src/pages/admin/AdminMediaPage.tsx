import React, { useState, useEffect } from 'react'
import {
  FolderOpen,
  Search,
  Plus,
  Play,
  FileText,
  Music,
  Image as ImageIcon,
  Copy,
  Trash2,
  ExternalLink,
  Info,
  Clock,
  Tag,
  UploadCloud,
  Box,
  FileSpreadsheet,
  Archive,
  Lock,
  CheckCircle,
  AlertTriangle,
  FolderPlus,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { MediaAsset, MediaAssetType } from '@/types/cms'
import { MediaService } from '@/services/mediaService'
import { EnrollmentService, CourseProductOption } from '@/services/enrollmentService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

export const AdminMediaPage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()

  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [courses, setCourses] = useState<CourseProductOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [folderFilter, setFolderFilter] = useState<string>('all')

  // Modais
  const [selectedAssetForPreview, setSelectedAssetForPreview] = useState<MediaAsset | null>(null)
  const [isNewAssetOpen, setIsNewAssetOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Upload Físico Real
  const [uploadedFiles, setUploadedFiles] = useState<FileList | null>(null)
  const [uploadFolder, setUploadFolder] = useState('/materials')
  const [uploadRelatedCourse, setUploadRelatedCourse] = useState<string>('')
  const [uploadTags, setUploadTags] = useState('Subfase-4.4, Apostila')
  const [uploadIsRestricted, setUploadIsRestricted] = useState(true)

  // Cadastro Manual URL
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<MediaAssetType>('youtube_video')
  const [newUrl, setNewUrl] = useState('')
  const [newExternalId, setNewExternalId] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newTags, setNewTags] = useState('')
  const [newRelatedProduct, setNewRelatedProduct] = useState('')

  const loadMedia = async () => {
    setIsLoading(true)
    try {
      const [mediaData, products] = await Promise.all([
        MediaService.listMedia({
          search: searchTerm,
          type: typeFilter,
          categoryTag: categoryFilter,
          folderPath: folderFilter,
        }),
        EnrollmentService.listProducts(),
      ])
      setAssets(mediaData)
      setCourses(products)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMedia()
  }, [searchTerm, typeFilter, categoryFilter, folderFilter])

  // Upload físico real via Supabase Storage
  const handlePhysicalUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadedFiles || uploadedFiles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Selecione arquivos',
        description: 'Escolha um ou mais arquivos para envio ao Supabase Storage.',
      })
      return
    }

    setIsUploading(true)
    let successCount = 0
    let duplicateCount = 0
    const errors: string[] = []

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i]
        try {
          const res = await MediaService.uploadFileToStorage(
            file,
            file.name,
            {
              folderPath: uploadFolder,
              relatedProductId: uploadRelatedCourse || undefined,
              tags: uploadTags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
              isRestricted: uploadIsRestricted,
            },
            user?.role,
          )

          if (res) successCount++
        } catch (err: any) {
          errors.push(`${file.name}: ${err?.message || 'Falha no upload'}`)
        }
      }

      if (errors.length > 0) {
        toast({
          variant: 'destructive',
          title: `Upload parcial: ${successCount} enviados com sucesso`,
          description: errors.join('; '),
        })
      } else {
        toast({
          title: 'Arquivos enviados com sucesso!',
          description: `${successCount} arquivo(s) persistidos no Supabase Storage e associados ao catálogo.`,
        })
      }

      setIsUploadOpen(false)
      setUploadedFiles(null)
      loadMedia()
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newUrl.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Informe o título e a URL do recurso.',
      })
      return
    }

    try {
      await MediaService.createMedia(
        {
          title: newTitle,
          description: newDescription,
          assetType: newType,
          provider: newType === 'youtube_video' ? 'youtube' : 'external_url',
          externalId: newExternalId || `ext-${Date.now()}`,
          publicUrl: newUrl,
          thumbnailUrl: 'https://img.usecurling.com/p/640/360?q=engineering%20resource',
          licenseInfo: 'Engenharia Divergente — Uso Exclusivo',
          accessRules: { requiresEntitlement: true },
          tags: newTags
            ? newTags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : ['Mídia'],
          isPendingStorage: false,
          createdByName: user?.name,
          relatedProductId: newRelatedProduct || undefined,
        },
        user?.role,
      )

      toast({
        title: 'Mídia cadastrada com sucesso',
        description: 'O recurso agora está disponível para vinculação em blocos.',
      })

      setIsNewAssetOpen(false)
      setNewTitle('')
      setNewUrl('')
      setNewExternalId('')
      setNewDescription('')
      setNewTags('')
      loadMedia()
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar',
        description: err instanceof Error ? err.message : 'Falha na operação',
      })
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      await MediaService.duplicateMedia(id, user?.role)
      toast({ title: 'Mídia duplicada', description: 'Cópia criada no catálogo.' })
      loadMedia()
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erro ao duplicar',
        description: err instanceof Error ? err.message : 'Falha',
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await MediaService.deleteMedia(id, user?.role)
      if (!res.success) {
        toast({
          variant: 'destructive',
          title: 'Bloqueio de integridade',
          description: res.reason,
        })
      } else {
        toast({ title: 'Mídia removida com sucesso' })
        loadMedia()
      }
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Falha ao excluir',
      })
    }
  }

  const getTypeIcon = (type: MediaAssetType) => {
    switch (type) {
      case 'youtube_video':
      case 'private_video':
        return <Play className="h-4 w-4 text-[#01B59A]" />
      case 'pdf_document':
        return <FileText className="h-4 w-4 text-[#C69B4B]" />
      case 'cad_model':
        return <Box className="h-4 w-4 text-blue-400" />
      case 'spreadsheet':
        return <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
      case 'archive':
        return <Archive className="h-4 w-4 text-amber-400" />
      case 'audio':
        return <Music className="h-4 w-4 text-purple-400" />
      case 'image':
        return <ImageIcon className="h-4 w-4 text-cyan-400" />
      default:
        return <FileText className="h-4 w-4 text-[#A8BBC0]" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#294149] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Biblioteca Central de Mídia & Storage
            </h1>
            <Badge variant="outline" className="text-[10px] border-[#01B59A]/40 text-[#01B59A]">
              Subfase 4.4 Real
            </Badge>
          </div>
          <p className="text-xs text-[#A8BBC0] mt-1">
            Gestão unificada de arquivos de engenharia (CAD, STEP, SLDPRT), apostilas PDF, vídeos
            protegidos e planilhas com controle de integridade e RLS no Supabase.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsUploadOpen(true)}
            className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs"
          >
            <UploadCloud className="h-4 w-4 mr-1.5" /> Upload de Arquivos
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsNewAssetOpen(true)}
            className="border-[#294149] text-white hover:border-[#01B59A] text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Adicionar Link/Vídeo
          </Button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A8BBC0]" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome de arquivo, título, tags..."
            className="pl-9 bg-[#152228] border-[#294149] text-white text-xs"
          />
        </div>
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-3 focus:outline-none focus:ring-1 focus:ring-[#01B59A]"
          >
            <option value="all">Todas as categorias</option>
            <option value="cad">CAD / Simulação (STEP, SLDPRT)</option>
            <option value="documents">Documentos (PDF, Apostilas)</option>
            <option value="videos">Vídeos (YouTube e Protegidos)</option>
            <option value="spreadsheets">Planilhas (XLSX, CSV)</option>
            <option value="images">Diagramas e Imagens</option>
            <option value="archives">Pacotes Compactados</option>
          </select>
        </div>
        <div>
          <select
            value={folderFilter}
            onChange={(e) => setFolderFilter(e.target.value)}
            className="w-full h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-3 focus:outline-none focus:ring-1 focus:ring-[#01B59A]"
          >
            <option value="all">Todas as pastas</option>
            <option value="/materials">/materials</option>
            <option value="/cad_models">/cad_models</option>
            <option value="/diagrams">/diagrams</option>
            <option value="/zip_imports">/zip_imports</option>
          </select>
        </div>
      </div>

      {/* Grid de Ativos */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-[#A8BBC0]">
          Carregando acervo multimídia do Supabase...
        </div>
      ) : assets.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#294149] rounded-xl bg-[#152228]/30 space-y-3">
          <FolderOpen className="h-10 w-10 text-[#A8BBC0] mx-auto opacity-50" />
          <p className="text-sm text-white font-medium">Nenhum ativo de mídia encontrado</p>
          <p className="text-xs text-[#A8BBC0]">
            Utilize o botão de "Upload de Arquivos" para subir modelos CAD, PDFs e imagens ao
            Supabase.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group flex flex-col justify-between rounded-xl border border-[#294149] bg-[#152228]/80 hover:border-[#01B59A]/60 transition-all p-4 space-y-3"
            >
              {/* Topo do card */}
              <div className="space-y-2">
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black/60 border border-[#294149]">
                  {asset.thumbnailUrl ? (
                    <img
                      src={asset.thumbnailUrl}
                      alt={asset.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[#A8BBC0]">
                      {getTypeIcon(asset.assetType)}
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="bg-[#0C1317]/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono font-medium text-white flex items-center gap-1 border border-white/10">
                      {getTypeIcon(asset.assetType)}
                      {asset.categoryTag || asset.assetType}
                    </span>
                  </div>
                  {asset.storageBucket && (
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-[#01B59A]">
                        {asset.storageBucket}
                      </span>
                    </div>
                  )}
                  {asset.fileExtension && (
                    <div className="absolute bottom-2 right-2">
                      <Badge className="bg-[#01B59A] text-black text-[9px] font-mono font-bold uppercase">
                        .{asset.fileExtension}
                      </Badge>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white line-clamp-1">{asset.title}</h3>
                  {asset.originalFilename && (
                    <p className="text-[11px] font-mono text-[#01B59A] truncate">
                      {asset.originalFilename}
                    </p>
                  )}
                  {asset.description && (
                    <p className="text-xs text-[#A8BBC0] line-clamp-2 mt-1">{asset.description}</p>
                  )}
                </div>
              </div>

              {/* Tags & Metadados */}
              <div className="space-y-2 border-t border-[#294149]/60 pt-3 text-[11px] text-[#A8BBC0]">
                <div className="flex flex-wrap gap-1">
                  {asset.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0C1317] border border-[#294149] text-[10px]"
                    >
                      <Tag className="h-2.5 w-2.5 text-[#01B59A]" />
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span>Provedor: {asset.provider}</span>
                  {asset.fileSizeBytes ? (
                    <span>{(asset.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                  ) : null}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-between border-t border-[#294149]/60 pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedAssetForPreview(asset)}
                  className="h-7 text-xs border-[#294149] text-white hover:border-[#01B59A]"
                >
                  Detalhes / Preview
                </Button>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDuplicate(asset.id)}
                    className="h-7 w-7 text-[#A8BBC0] hover:text-white"
                    title="Duplicar Mídia"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(asset.id)}
                    className="h-7 w-7 text-[#C86F63] hover:bg-[#C86F63]/10"
                    title="Excluir Mídia"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Upload Físico Real */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md bg-[#0C1317] border-[#294149] text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-[#01B59A]" />
              Upload Real de Arquivos e Mídias
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePhysicalUpload} className="space-y-3 text-xs">
            <div>
              <Label className="text-xs text-white">
                Selecione os arquivos (PDF, SLDPRT, STEP, STL, XLSX, etc.) *
              </Label>
              <input
                type="file"
                multiple
                onChange={(e) => setUploadedFiles(e.target.files)}
                className="mt-1 w-full bg-[#152228] border border-[#294149] rounded p-2 text-xs text-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[#01B59A] file:text-black cursor-pointer"
                required
              />
              <p className="text-[10px] text-[#A8BBC0] mt-1">
                Suporte nativo a formatos de engenharia e documentos restritos. Hash SHA-256 e
                antiduplicação automáticos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-white">Pasta Lógica</Label>
                <Input
                  value={uploadFolder}
                  onChange={(e) => setUploadFolder(e.target.value)}
                  placeholder="/materials"
                  className="mt-1 bg-[#152228] border-[#294149] text-white text-xs font-mono"
                />
              </div>
              <div>
                <Label className="text-xs text-white">Curso Relacionado</Label>
                <select
                  value={uploadRelatedCourse}
                  onChange={(e) => setUploadRelatedCourse(e.target.value)}
                  className="mt-1 w-full h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-2"
                >
                  <option value="">Geral (Sem curso fixo)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs text-white">Tags (separadas por vírgula)</Label>
              <Input
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                placeholder="MEF, SOLIDWORKS, NBR 8800"
                className="mt-1 bg-[#152228] border-[#294149] text-white text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="checkRestricted"
                checked={uploadIsRestricted}
                onChange={(e) => setUploadIsRestricted(e.target.checked)}
                className="rounded border-[#294149] bg-[#152228] text-[#01B59A]"
              />
              <label htmlFor="checkRestricted" className="text-xs text-[#E6EAED] cursor-pointer">
                Armazenar em bucket privado (requer matrícula ativa do aluno)
              </label>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadOpen(false)}
                className="text-xs border-[#294149]"
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isUploading}
                className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs"
              >
                {isUploading ? 'Enviando ao Storage...' : 'Iniciar Upload'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Adicionar Mídia Manual */}
      <Dialog open={isNewAssetOpen} onOpenChange={setIsNewAssetOpen}>
        <DialogContent className="max-w-md bg-[#0C1317] border-[#294149] text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">
              Cadastrar Mídia Externa (YouTube / Vimeo / URL)
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateAsset} className="space-y-3 text-xs">
            <div>
              <Label className="text-xs text-white">Título do Recurso *</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Aula de Flambagem em Galpões"
                className="mt-1 bg-[#152228] border-[#294149] text-white text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-white">Tipo de Recurso</Label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as MediaAssetType)}
                  className="mt-1 w-full h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-2"
                >
                  <option value="youtube_video">Vídeo YouTube</option>
                  <option value="private_video">Vídeo Vimeo / Privado</option>
                  <option value="pdf_document">PDF / Apostila</option>
                  <option value="cad_model">Modelo CAD</option>
                  <option value="spreadsheet">Planilha</option>
                  <option value="image">Imagem</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-white">ID Externo</Label>
                <Input
                  value={newExternalId}
                  onChange={(e) => setNewExternalId(e.target.value)}
                  placeholder="Ex: kJQP7kiw5Fk"
                  className="mt-1 bg-[#152228] border-[#294149] text-white text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-white">URL do Recurso *</Label>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 bg-[#152228] border-[#294149] text-white text-xs"
                required
              />
            </div>

            <div>
              <Label className="text-xs text-white">Curso Relacionado</Label>
              <select
                value={newRelatedProduct}
                onChange={(e) => setNewRelatedProduct(e.target.value)}
                className="mt-1 w-full h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-2"
              >
                <option value="">Geral (Sem curso fixo)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs text-white">Tags (separadas por vírgula)</Label>
              <Input
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="MEF, NBR 8800, Aula Magna"
                className="mt-1 bg-[#152228] border-[#294149] text-white text-xs"
              />
            </div>

            <div>
              <Label className="text-xs text-white">Descrição Didática</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
                placeholder="Resumo do conteúdo..."
                className="mt-1 bg-[#152228] border-[#294149] text-white text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewAssetOpen(false)}
                className="text-xs border-[#294149]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs"
              >
                Salvar Mídia
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Preview Detalhado */}
      <Dialog
        open={!!selectedAssetForPreview}
        onOpenChange={(open) => !open && setSelectedAssetForPreview(null)}
      >
        <DialogContent className="max-w-2xl bg-[#0C1317] border-[#294149] text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              {selectedAssetForPreview && getTypeIcon(selectedAssetForPreview.assetType)}
              {selectedAssetForPreview?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedAssetForPreview && (
            <div className="space-y-4 text-xs">
              {/* Informações técnicas e segurança */}
              <div className="rounded-lg border border-[#294149] bg-[#152228] p-3 space-y-2">
                <p className="text-[#E6EAED]">{selectedAssetForPreview.description}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#A8BBC0]">
                  <div>Bucket: {selectedAssetForPreview.storageBucket || 'externo'}</div>
                  <div>
                    Caminho:{' '}
                    {selectedAssetForPreview.storagePath || selectedAssetForPreview.externalId}
                  </div>
                  <div>MIME Type: {selectedAssetForPreview.mimeType || '—'}</div>
                  <div>
                    Hash SHA-256:{' '}
                    {selectedAssetForPreview.fileHash
                      ? `${selectedAssetForPreview.fileHash.slice(0, 16)}...`
                      : 'N/A'}
                  </div>
                  <div>Versão: v{selectedAssetForPreview.version || 1}</div>
                  <div>
                    Restrito a Matriculados:{' '}
                    {selectedAssetForPreview.accessRules.requiresEntitlement ? 'Sim' : 'Não'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedAssetForPreview(null)}
              className="text-xs border-[#294149]"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
