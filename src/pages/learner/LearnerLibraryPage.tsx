import React, { useState, useEffect } from 'react'
import {
  Search,
  BookOpen,
  FileText,
  Play,
  Box,
  FileSpreadsheet,
  Download,
  Lock,
  ExternalLink,
  Shield,
  Layers,
  Filter,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { MediaAsset } from '@/types/cms'
import { MediaService } from '@/services/mediaService'
import { EnrollmentService, CourseProductOption } from '@/services/enrollmentService'
import { IntegratedPdfViewer } from '@/components/media/IntegratedPdfViewer'
import { UniversalVideoPlayer } from '@/components/media/UniversalVideoPlayer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

export default function LearnerLibraryPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [materials, setMaterials] = useState<MediaAsset[]>([])
  const [courses, setCourses] = useState<CourseProductOption[]>([])
  const [userEntitledProductIds, setUserEntitledProductIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedCourse, setSelectedCourse] = useState<string>('all')

  // Modais de visualização
  const [activePdfAsset, setActivePdfAsset] = useState<MediaAsset | null>(null)
  const [activePdfSignedUrl, setActivePdfSignedUrl] = useState<string>('')
  const [activeVideoAsset, setActiveVideoAsset] = useState<MediaAsset | null>(null)
  const [isGettingUrl, setIsGettingUrl] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [mediaList, productList] = await Promise.all([
        MediaService.listMedia(),
        EnrollmentService.listProducts(),
      ])

      setMaterials(mediaList)
      setCourses(productList)

      // Identifica quais produtos o aluno tem direito
      const entitledSet = new Set<string>()
      for (const prod of productList) {
        // Se for o admin/editor ou aluno com entitlement
        const hasAccess = await EnrollmentService.checkUserProductAccess(prod.id)
        if (hasAccess || user?.role === 'admin' || user?.role === 'super_admin') {
          entitledSet.add(prod.id)
        }
      }
      setUserEntitledProductIds(entitledSet)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Verifica se o usuário tem direito a acessar um material
  const canAccessMaterial = (asset: MediaAsset): boolean => {
    if (user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'content_editor') {
      return true
    }
    if (!asset.accessRules?.requiresEntitlement) {
      return true
    }
    if (asset.relatedProductId) {
      return userEntitledProductIds.has(asset.relatedProductId)
    }
    // Se exige entitlement mas não tem produto vinculado, basta ter qualquer acesso de base
    return userEntitledProductIds.size > 0
  }

  const handleOpenMaterial = async (asset: MediaAsset) => {
    const hasAccess = canAccessMaterial(asset)

    if (!hasAccess) {
      toast({
        variant: 'destructive',
        title: 'Material Bloqueado',
        description:
          'Você precisa estar matriculado no curso correspondente para acessar este recurso.',
      })
      return
    }

    if (asset.assetType === 'pdf_document') {
      setIsGettingUrl(true)
      try {
        if (asset.provider === 'supabase_storage') {
          const res = await MediaService.getSignedUrl(asset.id, 'view', 3600)
          setActivePdfSignedUrl(res.signedUrl)
        } else {
          setActivePdfSignedUrl(asset.publicUrl)
        }
        setActivePdfAsset(asset)
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: 'Erro ao abrir material',
          description: err?.message || 'Falha na emissão de URL assinada.',
        })
      } finally {
        setIsGettingUrl(false)
      }
    } else if (asset.assetType === 'youtube_video' || asset.assetType === 'private_video') {
      setActiveVideoAsset(asset)
    } else {
      // Para CAD, planilhas, arquivos de engenharia -> dispara download autorizado
      handleDownloadMaterial(asset)
    }
  }

  const handleDownloadMaterial = async (asset: MediaAsset) => {
    if (!canAccessMaterial(asset)) {
      toast({
        variant: 'destructive',
        title: 'Download não autorizado',
        description: 'Matrícula necessária para baixar arquivos técnicos deste módulo.',
      })
      return
    }

    try {
      if (asset.provider === 'supabase_storage') {
        const res = await MediaService.getSignedUrl(asset.id, 'download', 600)
        window.open(res.signedUrl, '_blank')
        toast({
          title: 'Download iniciado',
          description: `Baixando "${asset.title}" com autorização temporária.`,
        })
      } else {
        window.open(asset.publicUrl, '_blank')
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro no download',
        description: err?.message || 'Falha ao solicitar autorização de download.',
      })
    }
  }

  // Filtragem da lista
  const filtered = materials.filter((m) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      const match =
        m.title.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
      if (!match) return false
    }

    if (selectedCategory !== 'all') {
      if (selectedCategory === 'cad' && m.assetType !== 'cad_model') return false
      if (
        selectedCategory === 'documents' &&
        m.assetType !== 'pdf_document' &&
        m.assetType !== 'exercise_file'
      )
        return false
      if (
        selectedCategory === 'videos' &&
        m.assetType !== 'youtube_video' &&
        m.assetType !== 'private_video'
      )
        return false
      if (selectedCategory === 'spreadsheets' && m.assetType !== 'spreadsheet') return false
      if (selectedCategory === 'archives' && m.assetType !== 'archive') return false
    }

    if (selectedCourse !== 'all') {
      if (m.relatedProductId !== selectedCourse) return false
    }

    return true
  })

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-[#294149] space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-[#01B59A] uppercase tracking-wider">
          <BookOpen className="h-4 w-4" />
          <span>Biblioteca Multimaterial & Arquivos Técnicos</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Biblioteca de Consulta
        </h1>
        <p className="text-xs md:text-sm text-[#A8BBC0]">
          Acervo centralizado de apostilas em PDF, modelos CAD (.SLDPRT, .STEP), planilhas de
          dimensionamento e videoaulas complementares aos seus cursos.
        </p>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A8BBC0]" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por título, norma técnica, tag..."
            className="pl-9 bg-[#152228] border-[#294149] text-white text-xs"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-3 focus:outline-none focus:ring-1 focus:ring-[#01B59A]"
          >
            <option value="all">Todas as categorias</option>
            <option value="documents">Documentos e Apostilas (PDF)</option>
            <option value="cad">Arquivos CAD / Simulação (STEP, SLDPRT)</option>
            <option value="videos">Vídeos e Aulas Explicativas</option>
            <option value="spreadsheets">Planilhas e Cálculos</option>
            <option value="archives">Pacotes Compactados (ZIP)</option>
          </select>
        </div>

        <div>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-3 focus:outline-none focus:ring-1 focus:ring-[#01B59A]"
          >
            <option value="all">Todos os cursos</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Materiais */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-[#A8BBC0]">
          Carregando materiais disponíveis no seu acervo...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#294149] rounded-xl bg-[#152228]/30 space-y-3">
          <BookOpen className="h-10 w-10 text-[#A8BBC0] mx-auto opacity-50" />
          <p className="text-sm text-white font-medium">Nenhum material encontrado</p>
          <p className="text-xs text-[#A8BBC0]">
            Ajuste os filtros de categoria ou curso para localizar seus arquivos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((asset) => {
            const hasAccess = canAccessMaterial(asset)

            return (
              <Card
                key={asset.id}
                className={`flex flex-col justify-between border transition-all ${
                  hasAccess
                    ? 'bg-[#152228]/80 border-[#294149] hover:border-[#01B59A]/60'
                    : 'bg-[#0C1317]/80 border-[#294149]/40 opacity-75'
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-[#0C1317] border border-[#294149] text-[#01B59A]">
                        {asset.assetType === 'cad_model' ? (
                          <Box className="h-5 w-5 text-blue-400" />
                        ) : asset.assetType === 'pdf_document' ? (
                          <FileText className="h-5 w-5 text-[#C69B4B]" />
                        ) : asset.assetType === 'youtube_video' ||
                          asset.assetType === 'private_video' ? (
                          <Play className="h-5 w-5 text-[#01B59A]" />
                        ) : (
                          <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <Badge
                          variant="outline"
                          className="text-[9px] uppercase font-mono border-white/10 text-[#A8BBC0]"
                        >
                          {asset.categoryTag || asset.assetType}
                        </Badge>
                        {asset.fileExtension && (
                          <span className="ml-1 text-[10px] font-mono text-[#01B59A] uppercase">
                            .{asset.fileExtension}
                          </span>
                        )}
                      </div>
                    </div>

                    {!hasAccess ? (
                      <Badge className="bg-[#C86F63]/20 text-[#C86F63] border border-[#C86F63]/30 text-[9px] flex items-center gap-1 font-mono uppercase">
                        <Lock className="h-3 w-3" /> Bloqueado
                      </Badge>
                    ) : (
                      <Badge className="bg-[#01B59A]/20 text-[#01B59A] border border-[#01B59A]/30 text-[9px] flex items-center gap-1 font-mono uppercase">
                        <CheckCircle className="h-3 w-3" /> Liberado
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-white text-sm line-clamp-2">{asset.title}</h3>
                    {asset.description && (
                      <p className="text-xs text-[#A8BBC0] line-clamp-2 mt-1">
                        {asset.description}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {asset.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-[#0C1317] border border-[#294149] text-[10px] text-[#A8BBC0]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Ações */}
                  <div className="pt-3 border-t border-[#294149]/60 flex items-center justify-between">
                    {hasAccess ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleOpenMaterial(asset)}
                          className="h-7 text-xs bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold"
                        >
                          {asset.assetType === 'cad_model' || asset.assetType === 'spreadsheet' ? (
                            <>
                              <Download className="h-3.5 w-3.5 mr-1" /> Baixar Arquivo
                            </>
                          ) : (
                            <>Visualizar</>
                          )}
                        </Button>

                        {asset.allowDownload &&
                          asset.assetType !== 'cad_model' &&
                          asset.assetType !== 'spreadsheet' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadMaterial(asset)}
                              className="h-7 text-xs text-[#A8BBC0] hover:text-white"
                              title="Download direto"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          )}
                      </>
                    ) : (
                      <div className="text-[11px] text-[#A8BBC0] flex items-center gap-1">
                        <Lock className="h-3 w-3 text-[#C86F63]" /> Requer matrícula
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Leitor de PDF Integrado */}
      <Dialog open={!!activePdfAsset} onOpenChange={(open) => !open && setActivePdfAsset(null)}>
        <DialogContent className="max-w-4xl bg-[#0C1317] border-[#294149] text-white p-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#01B59A]" />
              {activePdfAsset?.title}
            </DialogTitle>
          </DialogHeader>

          {activePdfAsset && activePdfSignedUrl && (
            <IntegratedPdfViewer
              title={activePdfAsset.title}
              pdfUrl={activePdfSignedUrl}
              isMandatoryReading={activePdfAsset.isMandatoryReading}
              allowDownload={activePdfAsset.allowDownload}
              onReadingCompleted={() => {
                toast({
                  title: 'Leitura registrada!',
                  description: 'Seu histórico foi atualizado na área do aluno.',
                })
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Player de Vídeo Reutilizável */}
      <Dialog open={!!activeVideoAsset} onOpenChange={(open) => !open && setActiveVideoAsset(null)}>
        <DialogContent className="max-w-3xl bg-[#0C1317] border-[#294149] text-white p-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Play className="h-4 w-4 text-[#01B59A]" />
              {activeVideoAsset?.title}
            </DialogTitle>
          </DialogHeader>

          {activeVideoAsset && (
            <UniversalVideoPlayer
              title={activeVideoAsset.title}
              urlOrId={activeVideoAsset.externalId || activeVideoAsset.publicUrl}
              provider={activeVideoAsset.provider}
              thumbnailUrl={activeVideoAsset.thumbnailUrl}
              durationSeconds={activeVideoAsset.durationSeconds}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
