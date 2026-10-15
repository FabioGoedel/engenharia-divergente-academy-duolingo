import React, { useState, useEffect } from 'react'
import {
  Boxes,
  Search,
  Plus,
  Eye,
  Edit3,
  Copy,
  Trash2,
  CheckCircle2,
  Send,
  Link2,
  FileCode,
  Tag,
  Layers,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { isAdminRole } from '@/lib/rbac'
import { ContentBlock, BlockTypeId, BlockCategory, EditorialStatus } from '@/types/cms'
import { BlockService } from '@/services/blockService'
import { ReviewWorkflowService } from '@/services/reviewWorkflowService'
import { getAllBlockDefinitions, getBlockDefinition } from '@/components/cms/BlockRegistry'
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
import { useToast } from '@/hooks/use-toast'

export const AdminBlocksPage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const canPublish = user?.role ? isAdminRole(user.role) : false

  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<number | 0>(0)

  // Modais
  const [previewBlock, setPreviewBlock] = useState<ContentBlock | null>(null)
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const [newCompetencyInput, setNewCompetencyInput] = useState('')
  const [newTagInput, setNewTagInput] = useState('')

  const allBlockTypes = getAllBlockDefinitions()

  const loadBlocks = async () => {
    setIsLoading(true)
    try {
      let data = await BlockService.listBlocks({
        search: searchTerm,
        type: typeFilter === 'all' ? undefined : (typeFilter as BlockTypeId),
        status: statusFilter === 'all' ? undefined : (statusFilter as EditorialStatus),
      })
      if (difficultyFilter > 0) {
        data = data.filter((b) => b.initialDifficulty === difficultyFilter)
      }
      setBlocks(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBlocks()
  }, [searchTerm, typeFilter, statusFilter, difficultyFilter])

  const handleOpenNewFromType = (typeDef: (typeof allBlockTypes)[0]) => {
    const newBlock: ContentBlock = {
      id: '',
      blockType: typeDef.type,
      category: typeDef.category,
      title: `Novo Bloco — ${typeDef.title}`,
      description: typeDef.description,
      subjectArea: 'Mecânica dos Sólidos',
      associatedCompetencies: ['COMP-ENG-01'],
      initialDifficulty: 3,
      estimatedMinutes: 10,
      author: user?.name || 'Admin',
      editorialStatus: 'draft',
      version: 1,
      completionPolicy: typeDef.completionPolicy,
      tags: [typeDef.category, 'Fase 2'],
      config: JSON.parse(JSON.stringify(typeDef.defaultConfig)),
      mediaReferences: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: true,
    }

    setIsCatalogOpen(false)
    setEditingBlock(newBlock)
    setIsEditorOpen(true)
  }

  const handleOpenEdit = (b: ContentBlock) => {
    setEditingBlock(JSON.parse(JSON.stringify(b)))
    setIsEditorOpen(true)
  }

  const handleSaveBlock = async () => {
    if (!editingBlock) return

    try {
      if (!editingBlock.id) {
        await BlockService.createBlock(editingBlock, user?.role)
        toast({ title: 'Bloco criado com sucesso' })
      } else {
        await BlockService.updateBlock(editingBlock.id, editingBlock, user?.role, user?.name)
        toast({ title: 'Bloco atualizado com sucesso' })
      }
      setIsEditorOpen(false)
      loadBlocks()
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Validação do bloco falhou',
        description: err instanceof Error ? err.message : 'Verifique os parâmetros',
      })
    }
  }

  const handlePublish = async (b: ContentBlock) => {
    const res = await BlockService.publishBlock(b.id, user?.name || 'Admin', user?.role)
    if (!res.success) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível publicar',
        description: res.errors?.join('; '),
      })
    } else {
      toast({
        title: 'Bloco publicado',
        description: `Versão imutável v${res.block?.version} ativa.`,
      })
      loadBlocks()
    }
  }

  const handleSendToReview = async (b: ContentBlock) => {
    try {
      await ReviewWorkflowService.submitToReview(
        'block',
        b.id,
        b.title,
        user?.name || 'Editor',
        b.blockType,
        'Envio para aprovação editorial.',
        user?.role,
      )
      toast({
        title: 'Bloco enviado para revisão',
        description: 'Disponível na fila editorial.',
      })
      loadBlocks()
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Falha ao enviar',
      })
    }
  }

  const handleClone = async (id: string) => {
    try {
      await BlockService.cloneBlock(id, user?.role)
      toast({ title: 'Bloco clonado com sucesso' })
      loadBlocks()
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erro ao clonar',
        description: err instanceof Error ? err.message : 'Falha',
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await BlockService.deleteBlock(id, user?.role)
      toast({
        title: 'Operação concluída',
        description: res.reason || 'Bloco removido.',
      })
      loadBlocks()
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Falha ao remover',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#294149] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Biblioteca de Blocos</h1>
            <Badge variant="outline" className="text-[10px] border-[#01B59A]/40 text-[#01B59A]">
              P0 Funcionais (14) + P1/P2 Catálogo
            </Badge>
          </div>
          <p className="text-xs text-[#A8BBC0] mt-1">
            Instâncias de conteúdo reutilizáveis com isolamento estrito de catálogo, histórico de
            versões e referências em trilhas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsCatalogOpen(true)}
            className="border-[#294149] text-white hover:border-[#01B59A] text-xs"
          >
            <Layers className="h-4 w-4 mr-1.5 text-[#01B59A]" /> Catálogo de Tipos
          </Button>
          <Button
            onClick={() => setIsCatalogOpen(true)}
            className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Criar Novo Bloco
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A8BBC0]" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, tipo, área ou tags..."
            className="pl-9 bg-[#152228] border-[#294149] text-white text-xs"
          />
        </div>
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-3 focus:outline-none focus:ring-1 focus:ring-[#01B59A]"
          >
            <option value="all">Todos os Tipos de Bloco</option>
            {allBlockTypes.map((t) => (
              <option key={t.type} value={t.type}>
                {t.title} ({t.priority})
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-3 focus:outline-none focus:ring-1 focus:ring-[#01B59A]"
          >
            <option value="all">Todos os Status</option>
            <option value="draft">Rascunho</option>
            <option value="in_review">Em Revisão</option>
            <option value="published">Publicado</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>
        <div>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(Number(e.target.value))}
            className="w-full h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-3 focus:outline-none focus:ring-1 focus:ring-[#01B59A]"
          >
            <option value={0}>Todas as Dificuldades</option>
            <option value={1}>Nível 1 — Básico / Revisão</option>
            <option value={2}>Nível 2 — Aplicação Direta</option>
            <option value={3}>Nível 3 — Intermediário</option>
            <option value={4}>Nível 4 — Avançado / Normativo</option>
            <option value={5}>Nível 5 — Especialista / Julgamento</option>
          </select>
        </div>
      </div>

      {/* Grid de Blocos */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-[#A8BBC0]">
          Carregando blocos de conteúdo...
        </div>
      ) : blocks.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#294149] rounded-xl bg-[#152228]/30 space-y-3">
          <Boxes className="h-10 w-10 text-[#A8BBC0] mx-auto opacity-50" />
          <p className="text-sm text-white font-medium">Nenhum bloco cadastrado</p>
          <p className="text-xs text-[#A8BBC0]">
            Crie novos blocos a partir dos 14 tipos P0 suportados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map((b) => {
            const def = getBlockDefinition(b.blockType)

            return (
              <div
                key={b.id}
                className="group flex flex-col justify-between rounded-xl border border-[#294149] bg-[#152228]/80 hover:border-[#01B59A]/60 transition-all p-4 space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-[#01B59A] bg-[#0C1317] px-2 py-0.5 rounded border border-[#294149]">
                      {b.blockType}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-[#A8BBC0]">v{b.version}</span>
                      <Badge
                        className={`text-[9px] uppercase font-mono font-bold ${
                          b.editorialStatus === 'published'
                            ? 'bg-[#01B59A] text-black'
                            : b.editorialStatus === 'in_review'
                              ? 'bg-[#C69B4B] text-black'
                              : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {b.editorialStatus}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white line-clamp-1">{b.title}</h3>
                    {b.description && (
                      <p className="text-xs text-[#A8BBC0] line-clamp-2 mt-1">{b.description}</p>
                    )}
                  </div>

                  {/* Metadados Pedagógicos Exigidos */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#A8BBC0]">
                    {b.subjectArea && (
                      <span className="bg-[#0C1317] px-1.5 py-0.5 rounded border border-[#294149]">
                        {b.subjectArea}
                      </span>
                    )}
                    {b.initialDifficulty && (
                      <span className="bg-[#01B59A]/10 text-[#01B59A] px-1.5 py-0.5 rounded font-mono">
                        Nível L{b.initialDifficulty}
                      </span>
                    )}
                    {b.estimatedMinutes && (
                      <span className="bg-[#152228] px-1.5 py-0.5 rounded font-mono">
                        ~{b.estimatedMinutes} min
                      </span>
                    )}
                    {b.author && (
                      <span className="text-[#A8BBC0]/70 truncate max-w-[120px]">
                        por {b.author}
                      </span>
                    )}
                  </div>

                  {b.associatedCompetencies && b.associatedCompetencies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {b.associatedCompetencies.map((c) => (
                        <span
                          key={c}
                          className="font-mono text-[9px] bg-[#C69B4B]/10 text-[#C69B4B] px-1 py-0.2 rounded border border-[#C69B4B]/20"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Referências de Trilha (em quais cursos aparece) */}
                <div className="space-y-2 border-t border-[#294149]/60 pt-3 text-[11px] text-[#A8BBC0]">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#01B59A]">
                    <Link2 className="h-3.5 w-3.5" />
                    <span>
                      {b.trackReferences && b.trackReferences.length > 0
                        ? `Presente em ${b.trackReferences.length} módulo(s)`
                        : 'Ainda não vinculado a trilhas'}
                    </span>
                  </div>
                  {b.trackReferences && b.trackReferences.length > 0 && (
                    <p className="text-[10px] text-[#A8BBC0] truncate">
                      {b.trackReferences[0].courseTitle}
                    </p>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center justify-between border-t border-[#294149]/60 pt-3">
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewBlock(b)}
                      className="h-7 text-xs border-[#294149] text-white hover:border-[#01B59A]"
                    >
                      <Eye className="h-3 w-3 mr-1" /> Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(b)}
                      className="h-7 text-xs border-[#294149] text-white hover:border-[#01B59A]"
                    >
                      <Edit3 className="h-3 w-3 mr-1" /> Editar
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    {b.editorialStatus === 'draft' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSendToReview(b)}
                        className="h-7 w-7 text-[#C69B4B] hover:bg-[#C69B4B]/10"
                        title="Submeter para Revisão"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {b.editorialStatus === 'in_review' && canPublish && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handlePublish(b)}
                        className="h-7 w-7 text-[#01B59A] hover:bg-[#01B59A]/10"
                        title="Publicar Diretamente (Admin)"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleClone(b.id)}
                      className="h-7 w-7 text-[#A8BBC0] hover:text-white"
                      title="Clonar Bloco"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(b.id)}
                      className="h-7 w-7 text-[#C86F63] hover:bg-[#C86F63]/10"
                      title="Excluir / Arquivar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Preview Visual do Bloco */}
      <Dialog open={!!previewBlock} onOpenChange={(open) => !open && setPreviewBlock(null)}>
        <DialogContent className="max-w-2xl bg-[#0C1317] border-[#294149] text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <span className="font-mono text-[#01B59A]">{previewBlock?.blockType}</span>
              <span>— {previewBlock?.title}</span>
            </DialogTitle>
          </DialogHeader>

          {previewBlock && (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#294149] bg-[#152228] p-4">
                <span className="text-[10px] uppercase font-mono text-[#A8BBC0] block mb-3">
                  Renderização no modo Aluno:
                </span>
                {(() => {
                  const def = getBlockDefinition(previewBlock.blockType)
                  if (!def) {
                    return <p className="text-xs text-[#C86F63]">Renderer não encontrado.</p>
                  }
                  const StudentComp = def.StudentComponent
                  return <StudentComp config={previewBlock.config} />
                })()}
              </div>

              {/* Tabela de Propriedades do Bloco */}
              <div className="rounded-lg border border-[#294149] bg-[#152228]/50 p-3 text-xs space-y-2">
                <span className="font-mono text-[10px] uppercase text-[#01B59A] font-semibold block">
                  Metadados do Bloco de Conteúdo:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#A8BBC0] block">ID Único:</span>
                    <span className="font-mono text-white">{previewBlock.id}</span>
                  </div>
                  <div>
                    <span className="text-[#A8BBC0] block">Área do Conhecimento:</span>
                    <span className="text-white">
                      {previewBlock.subjectArea || 'Não informada'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A8BBC0] block">Dificuldade:</span>
                    <span className="text-white">Nível L{previewBlock.initialDifficulty || 3}</span>
                  </div>
                  <div>
                    <span className="text-[#A8BBC0] block">Tempo Estimado:</span>
                    <span className="text-white">{previewBlock.estimatedMinutes || 5} min</span>
                  </div>
                  <div>
                    <span className="text-[#A8BBC0] block">Autor / Origem:</span>
                    <span className="text-white">
                      {previewBlock.author || previewBlock.createdByName || 'eDiv'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#A8BBC0] block">Criado / Atualizado:</span>
                    <span className="font-mono text-[10px] text-white">
                      {new Date(previewBlock.updatedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                {previewBlock.associatedCompetencies &&
                  previewBlock.associatedCompetencies.length > 0 && (
                    <div className="pt-2 border-t border-[#294149]/50">
                      <span className="text-[#A8BBC0] block text-[10px] mb-1">
                        Competências Associadas:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {previewBlock.associatedCompetencies.map((comp) => (
                          <span
                            key={comp}
                            className="font-mono text-[9px] bg-[#C69B4B]/20 text-[#C69B4B] px-1.5 py-0.5 rounded"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                {previewBlock.mediaReferences && previewBlock.mediaReferences.length > 0 && (
                  <div className="pt-2 border-t border-[#294149]/50">
                    <span className="text-[#A8BBC0] block text-[10px] mb-1">
                      Referências de Mídia ({previewBlock.mediaReferences.length}):
                    </span>
                    <div className="space-y-1">
                      {previewBlock.mediaReferences.map((m, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-[10px] text-[#01B59A] font-mono bg-[#0C1317] p-1 rounded"
                        >
                          <span>{m.title || m.mediaId || `Mídia #${idx + 1}`}:</span>
                          <span className="text-[#A8BBC0] truncate">{m.url}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-[#294149] bg-[#0C1317] p-3 text-xs space-y-2">
                <span className="font-mono text-[10px] uppercase text-[#A8BBC0]">
                  Configuração Interna (config):
                </span>
                <pre className="font-mono text-[11px] text-[#A8BBC0] bg-black/40 p-2 rounded overflow-x-auto">
                  {JSON.stringify(previewBlock.config, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewBlock(null)}
              className="text-xs border-[#294149]"
            >
              Fechar Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editor de Bloco */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-2xl bg-[#0C1317] border-[#294149] text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">
              {editingBlock?.id ? 'Editar Bloco de Conteúdo' : 'Criar Bloco de Conteúdo'}
            </DialogTitle>
          </DialogHeader>

          {editingBlock && (
            <div className="space-y-4 text-xs">
              <div>
                <Label className="text-xs text-white">Título do Bloco *</Label>
                <Input
                  value={editingBlock.title}
                  onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                  className="mt-1 bg-[#152228] border-[#294149] text-white"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs text-white">Tipo do Bloco</Label>
                  <Input
                    value={editingBlock.blockType}
                    disabled
                    className="mt-1 bg-[#0C1317] border-[#294149] text-[#A8BBC0] font-mono text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white">Área do Conhecimento</Label>
                  <Input
                    value={editingBlock.subjectArea || ''}
                    onChange={(e) =>
                      setEditingBlock({ ...editingBlock, subjectArea: e.target.value })
                    }
                    placeholder="Ex: Mecânica dos Sólidos"
                    className="mt-1 bg-[#152228] border-[#294149] text-white text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white">Dificuldade Inicial (L1-L5)</Label>
                  <select
                    value={editingBlock.initialDifficulty || 3}
                    onChange={(e) =>
                      setEditingBlock({
                        ...editingBlock,
                        initialDifficulty: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                      })
                    }
                    className="mt-1 w-full h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-2 font-mono"
                  >
                    <option value={1}>L1 — Revisão Guiada</option>
                    <option value={2}>L2 — Aplicação Direta</option>
                    <option value={3}>L3 — Investigativo</option>
                    <option value={4}>L4 — Síntese & Normas</option>
                    <option value={5}>L5 — Julgamento</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-white">Tempo Estimado (min)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editingBlock.estimatedMinutes || 5}
                    onChange={(e) =>
                      setEditingBlock({
                        ...editingBlock,
                        estimatedMinutes: Math.max(1, parseInt(e.target.value, 10) || 5),
                      })
                    }
                    className="mt-1 bg-[#152228] border-[#294149] text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-white">Autor / Especialista Responsável</Label>
                <Input
                  value={editingBlock.author || ''}
                  onChange={(e) => setEditingBlock({ ...editingBlock, author: e.target.value })}
                  placeholder="Nome do autor ou 'Engenharia Divergente Academy'"
                  className="mt-1 bg-[#152228] border-[#294149] text-white text-xs"
                />
              </div>

              {/* Gestão de Competências Associadas */}
              <div className="space-y-1.5">
                <Label className="text-xs text-white">Competências Associadas</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCompetencyInput}
                    onChange={(e) => setNewCompetencyInput(e.target.value)}
                    placeholder="Adicionar código (ex: COMP-MEF-CONV)"
                    className="bg-[#152228] border-[#294149] text-white text-xs font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (newCompetencyInput.trim()) {
                          const comps = editingBlock.associatedCompetencies || []
                          if (!comps.includes(newCompetencyInput.trim())) {
                            setEditingBlock({
                              ...editingBlock,
                              associatedCompetencies: [...comps, newCompetencyInput.trim()],
                            })
                          }
                          setNewCompetencyInput('')
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-[#294149] text-xs text-white hover:border-[#01B59A]"
                    onClick={() => {
                      if (newCompetencyInput.trim()) {
                        const comps = editingBlock.associatedCompetencies || []
                        if (!comps.includes(newCompetencyInput.trim())) {
                          setEditingBlock({
                            ...editingBlock,
                            associatedCompetencies: [...comps, newCompetencyInput.trim()],
                          })
                        }
                        setNewCompetencyInput('')
                      }
                    }}
                  >
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(editingBlock.associatedCompetencies || []).map((comp) => (
                    <span
                      key={comp}
                      className="inline-flex items-center gap-1 font-mono text-[10px] bg-[#C69B4B]/15 text-[#C69B4B] px-2 py-0.5 rounded border border-[#C69B4B]/30"
                    >
                      {comp}
                      <button
                        type="button"
                        onClick={() =>
                          setEditingBlock({
                            ...editingBlock,
                            associatedCompetencies: (
                              editingBlock.associatedCompetencies || []
                            ).filter((c) => c !== comp),
                          })
                        }
                        className="hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Editor Específico do Tipo */}
              <div className="rounded-lg border border-[#294149] bg-[#152228]/50 p-4">
                <span className="text-[10px] uppercase font-mono text-[#01B59A] block mb-3 font-semibold">
                  Campos Específicos do Tipo ({editingBlock.blockType}):
                </span>
                {(() => {
                  const def = getBlockDefinition(editingBlock.blockType)
                  if (!def) return <p className="text-xs">Editor não cadastrado.</p>
                  const EditorComp = def.EditorComponent
                  return (
                    <EditorComp
                      config={editingBlock.config}
                      onChange={(newConfig) =>
                        setEditingBlock({ ...editingBlock, config: newConfig })
                      }
                    />
                  )
                })()}
              </div>

              <DialogFooter className="pt-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditorOpen(false)}
                  className="text-xs border-[#294149]"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveBlock}
                  className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs"
                >
                  Salvar Bloco
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Catálogo de Tipos (P0 Funcionais + P1/P2 Planejados) */}
      <Dialog open={isCatalogOpen} onOpenChange={setIsCatalogOpen}>
        <DialogContent className="max-w-3xl bg-[#0C1317] border-[#294149] text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Boxes className="h-5 w-5 text-[#01B59A]" />
              Catálogo de Tipos de Bloco (BlockRegistry)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-xs text-[#A8BBC0]">
              O catálogo separa estritamente definições de tipo de instâncias de conteúdo. Escolha
              um tipo para instanciar:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allBlockTypes.map((t) => {
                const isP0 = t.priority === 'P0'

                return (
                  <div
                    key={t.type}
                    className={`rounded-lg border p-3.5 space-y-2 transition-all ${
                      isP0
                        ? 'border-[#294149] bg-[#152228] hover:border-[#01B59A]'
                        : 'border-[#294149]/40 bg-[#0C1317]/50 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white">{t.title}</span>
                      <Badge
                        className={`text-[9px] uppercase font-mono ${
                          isP0 ? 'bg-[#01B59A] text-black font-bold' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {isP0 ? 'P0 Funcional' : 'Planejado'}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-[#A8BBC0] leading-snug">{t.description}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#294149]/50 text-[10px] font-mono text-[#A8BBC0]">
                      <span>Categoria: {t.category}</span>
                      {isP0 ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenNewFromType(t)}
                          className="h-6 text-[10px] bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold"
                        >
                          Usar este Tipo
                        </Button>
                      ) : (
                        <span className="text-[#C69B4B] italic">Fase 3/4</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCatalogOpen(false)}
              className="text-xs border-[#294149]"
            >
              Fechar Catálogo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
