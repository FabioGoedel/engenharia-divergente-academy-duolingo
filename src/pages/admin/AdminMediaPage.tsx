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
  AlertCircle,
  Clock,
  ShieldCheck,
  Tag,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { MediaAsset, MediaAssetType } from '@/types/cms'
import { MediaService } from '@/services/mediaService'
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
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Modais
  const [selectedAssetForPreview, setSelectedAssetForPreview] = useState<MediaAsset | null>(null)
  const [isNewAssetOpen, setIsNewAssetOpen] = useState(false)

  // Novo ativo form
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<MediaAssetType>('youtube_video')
  const [newUrl, setNewUrl] = useState('')
  const [newExternalId, setNewExternalId] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newTags, setNewTags] = useState('')

  const loadMedia = async () => {
    setIsLoading(true)
    try {
      const data = await MediaService.listMedia({
        search: searchTerm,
        type: typeFilter,
      })
      setAssets(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMedia()
  }, [searchTerm, typeFilter])

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
          isPendingStorage: newType === 'private_video' || newType === 'pdf_document',
          createdByName: user?.name,
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
      case 'audio':
        return <Music className="h-4 w-4 text-purple-400" />
      case 'image':
        return <ImageIcon className="h-4 w-4 text-blue-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#294149] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Biblioteca Central de Mídia
            </h1>
            <Badge variant="outline" className="text-[10px] border-[#01B59A]/40 text-[#01B59A]">
              Fase 2 CMS
            </Badge>
          </div>
          <p className="text-xs text-[#A8BBC0] mt-1">
            Gerenciador unificado de vídeos, apostilas em PDF, áudios e ilustrações técnicas com
            controle de integridade.
          </p>
        </div>
        <Button
          onClick={() => setIsNewAssetOpen(true)}
          className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Adicionar Mídia
        </Button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A8BBC0]" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por título, tags ou descrição..."
            className="pl-9 bg-[#152228] border-[#294149] text-white text-xs"
          />
        </div>
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-3 focus:outline-none focus:ring-1 focus:ring-[#01B59A]"
          >
            <option value="all">Todos os tipos</option>
            <option value="youtube_video">Vídeo YouTube</option>
            <option value="private_video">Vídeo Privado (Stream)</option>
            <option value="pdf_document">Documento PDF</option>
            <option value="audio">Áudio / Podcast</option>
            <option value="image">Imagem / Diagrama</option>
          </select>
        </div>
      </div>

      {/* Grid de Ativos */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-[#A8BBC0]">
          Carregando acervo multimídia...
        </div>
      ) : assets.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#294149] rounded-xl bg-[#152228]/30 space-y-3">
          <FolderOpen className="h-10 w-10 text-[#A8BBC0] mx-auto opacity-50" />
          <p className="text-sm text-white font-medium">Nenhum ativo de mídia encontrado</p>
          <p className="text-xs text-[#A8BBC0]">
            Tente alterar os termos da busca ou cadastre um novo recurso.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group flex flex-col justify-between rounded-xl border border-[#294149] bg-[#152228]/80 hover:border-[#01B59A]/60 transition-all p-4 space-y-3"
            >
              {/* Topo do card com thumb ou placeholder */}
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
                      {asset.assetType}
                    </span>
                  </div>
                  {asset.isPendingStorage && (
                    <div className="absolute bottom-2 right-2">
                      <Badge className="bg-[#C69B4B] text-black text-[9px] font-mono font-bold uppercase">
                        Storage Pendente
                      </Badge>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white line-clamp-1">{asset.title}</h3>
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
                  {asset.durationSeconds ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.round(asset.durationSeconds / 60)} min
                    </span>
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
                  Visualizar
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

      {/* Modal de Preview */}
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
              {/* Player / Render do tipo */}
              {selectedAssetForPreview.assetType === 'youtube_video' && (
                <div className="aspect-video w-full rounded overflow-hidden bg-black">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${selectedAssetForPreview.externalId}?rel=0`}
                    title={selectedAssetForPreview.title}
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
              )}

              {selectedAssetForPreview.assetType === 'private_video' && (
                <div className="p-4 rounded border border-[#C69B4B]/40 bg-[#152228] space-y-2">
                  <div className="flex items-center gap-2 text-[#C69B4B] font-bold">
                    <Info className="h-4 w-4" /> Adaptador de Vídeo Privado (Stream)
                  </div>
                  <p className="text-xs text-[#A8BBC0]">
                    Status: <span className="font-mono text-white">PENDENTE</span> de credenciais
                    Cloudflare Stream / AWS MediaConvert no backend.
                  </p>
                  <p className="text-[11px] font-mono text-[#A8BBC0]">
                    Endpoint configurado: {selectedAssetForPreview.publicUrl}
                  </p>
                </div>
              )}

              {selectedAssetForPreview.assetType === 'pdf_document' && (
                <div className="space-y-2">
                  <div className="h-64 overflow-hidden rounded border border-[#294149] bg-zinc-900">
                    <iframe
                      src={selectedAssetForPreview.publicUrl}
                      title={selectedAssetForPreview.title}
                      className="h-full w-full border-0"
                    />
                  </div>
                  <a
                    href={selectedAssetForPreview.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#01B59A] text-xs hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Abrir PDF em nova aba
                  </a>
                </div>
              )}

              {selectedAssetForPreview.assetType === 'image' && (
                <div className="rounded overflow-hidden bg-black/50 p-2 border border-[#294149]">
                  <img
                    src={selectedAssetForPreview.publicUrl}
                    alt={selectedAssetForPreview.title}
                    className="max-h-80 w-auto mx-auto object-contain"
                  />
                </div>
              )}

              {selectedAssetForPreview.assetType === 'audio' && (
                <div className="p-4 rounded border border-[#294149] bg-[#152228]">
                  <audio controls className="w-full">
                    <source src={selectedAssetForPreview.publicUrl} type="audio/mpeg" />
                    Seu navegador não suporta reprodução de áudio.
                  </audio>
                </div>
              )}

              {/* Informações detalhadas */}
              <div className="rounded-lg border border-[#294149] bg-[#152228]/50 p-3 space-y-2">
                <p className="text-[#E6EAED]">{selectedAssetForPreview.description}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#A8BBC0]">
                  <div>Licença: {selectedAssetForPreview.licenseInfo}</div>
                  <div>ID Externo: {selectedAssetForPreview.externalId}</div>
                  <div>Criado por: {selectedAssetForPreview.createdByName || 'Admin'}</div>
                  <div>
                    Entitlement Obrigatório:{' '}
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

      {/* Modal Adicionar Mídia */}
      <Dialog open={isNewAssetOpen} onOpenChange={setIsNewAssetOpen}>
        <DialogContent className="max-w-md bg-[#0C1317] border-[#294149] text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">
              Cadastrar Novo Ativo de Mídia
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
                  <option value="private_video">Vídeo Privado</option>
                  <option value="pdf_document">PDF / Apostila</option>
                  <option value="audio">Áudio</option>
                  <option value="image">Imagem / Diagrama</option>
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
              <Label className="text-xs text-white">URL Pública do Recurso *</Label>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 bg-[#152228] border-[#294149] text-white text-xs"
                required
              />
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
    </div>
  )
}
