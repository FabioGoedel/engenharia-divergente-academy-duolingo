import React, { useState, useEffect } from 'react'
import {
  HelpCircle,
  Search,
  Plus,
  Eye,
  Edit3,
  Copy,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Send,
  Lock,
  Sparkles,
  BarChart2,
  Filter,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { QuestionBankItem, QuestionType, EditorialStatus } from '@/types/cms'
import { QuestionBankService } from '@/services/questionBankService'
import { ReviewWorkflowService } from '@/services/reviewWorkflowService'
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
import { SanitizedMarkdownViewer, MathFormula } from '@/components/cms/SanitizedMarkdownViewer'

export const AdminQuestionBankPage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()

  const [questions, setQuestions] = useState<QuestionBankItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<number | 0>(0)
  const [onlyContested, setOnlyContested] = useState(false)
  const [onlyLowPerformance, setOnlyLowPerformance] = useState(false)

  // Modais
  const [previewQuestion, setPreviewQuestion] = useState<QuestionBankItem | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  const loadQuestions = async () => {
    setIsLoading(true)
    try {
      const data = await QuestionBankService.listQuestions({
        search: searchTerm,
        status: statusFilter === 'all' ? undefined : (statusFilter as EditorialStatus),
        authoringLevel: levelFilter === 0 ? undefined : levelFilter,
        isContested: onlyContested ? true : undefined,
        lowPerformance: onlyLowPerformance ? true : undefined,
      })
      setQuestions(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [searchTerm, statusFilter, levelFilter, onlyContested, onlyLowPerformance])

  const handleOpenNew = () => {
    const fresh: QuestionBankItem = {
      id: '',
      externalId: `QST-L${levelFilter || 3}-${Date.now().toString().slice(-4)}`,
      title: '',
      questionType: 'single_choice',
      subjectArea: 'Método dos Elementos Finitos',
      competencyCode: 'COMP-MEF-01',
      prerequisites: [],
      authoringLevel: 3,
      promptMarkdown: '',
      options: [
        { id: 'opt-a', label: 'A', textMarkdown: '', distractorRationale: '' },
        { id: 'opt-b', label: 'B', textMarkdown: '', distractorRationale: '' },
      ],
      privateKey: {
        correctOptionIds: ['opt-a'],
        rubricNotes: 'Critério de correção técnica...',
      },
      hint: '',
      explanationMarkdown: '',
      estimatedSeconds: 180,
      xpReward: 25,
      tags: ['MEF'],
      editorialStatus: 'draft',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: true,
    }
    setEditingQuestion(fresh)
    setIsEditorOpen(true)
  }

  const handleOpenEdit = (q: QuestionBankItem) => {
    setEditingQuestion(JSON.parse(JSON.stringify(q)))
    setIsEditorOpen(true)
  }

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingQuestion) return

    if (!editingQuestion.title.trim() || !editingQuestion.promptMarkdown.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Título e enunciado são obrigatórios.',
      })
      return
    }

    try {
      if (!editingQuestion.id) {
        await QuestionBankService.createQuestion(editingQuestion, user?.role)
        toast({ title: 'Questão cadastrada com sucesso' })
      } else {
        await QuestionBankService.updateQuestion(
          editingQuestion.id,
          editingQuestion,
          user?.role,
          user?.name,
        )
        toast({ title: 'Questão atualizada com sucesso' })
      }
      setIsEditorOpen(false)
      loadQuestions()
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar questão',
        description: err instanceof Error ? err.message : 'Falha na validação',
      })
    }
  }

  const handlePublishDirect = async (q: QuestionBankItem) => {
    const res = await QuestionBankService.publishQuestion(q.id, user?.name || 'Admin', user?.role)
    if (!res.success) {
      toast({
        variant: 'destructive',
        title: 'Validação de consistência reprovada',
        description: res.errors?.join('; '),
      })
    } else {
      toast({
        title: 'Questão publicada',
        description: `Versão imutável v${res.question?.version} gerada com sucesso.`,
      })
      loadQuestions()
    }
  }

  const handleSendToReview = async (q: QuestionBankItem) => {
    try {
      await ReviewWorkflowService.submitToReview(
        'question',
        q.id,
        q.title,
        user?.name || 'Editor',
        `${q.questionType} (Nível ${q.authoringLevel})`,
        'Solicitação de revisão editorial.',
        user?.role,
      )
      toast({
        title: 'Enviado para revisão editorial',
        description: 'A questão agora está na fila da coordenação técnica.',
      })
      loadQuestions()
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Falha ao enviar',
      })
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      await QuestionBankService.duplicateQuestion(id, user?.role)
      toast({ title: 'Questão duplicada com sucesso' })
      loadQuestions()
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
      const res = await QuestionBankService.deleteQuestion(id, user?.role)
      toast({
        title: 'Operação concluída',
        description: res.reason || 'Questão removida do catálogo.',
      })
      loadQuestions()
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover',
        description: err instanceof Error ? err.message : 'Falha',
      })
    }
  }

  const getStatusBadge = (status: EditorialStatus) => {
    switch (status) {
      case 'published':
        return (
          <Badge className="bg-[#01B59A] text-black text-[10px] uppercase font-mono font-bold">
            Publicado
          </Badge>
        )
      case 'in_review':
        return (
          <Badge className="bg-[#C69B4B] text-black text-[10px] uppercase font-mono font-bold">
            Em Revisão
          </Badge>
        )
      case 'draft':
        return (
          <Badge
            variant="outline"
            className="text-[10px] border-[#294149] text-[#A8BBC0] uppercase font-mono"
          >
            Rascunho
          </Badge>
        )
      case 'archived':
        return (
          <Badge
            variant="outline"
            className="text-[10px] border-[#C86F63]/50 text-[#C86F63] uppercase font-mono"
          >
            Arquivado
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#294149] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Banco de Questões Editável
            </h1>
            <Badge variant="outline" className="text-[10px] border-[#01B59A]/40 text-[#01B59A]">
              Gabarito Protegido (Isolado)
            </Badge>
          </div>
          <p className="text-xs text-[#A8BBC0] mt-1">
            Questões técnicas de L1 a L5 com LaTeX, distratores justificados, rubricas e
            versionamento imutável.
          </p>
        </div>
        <Button
          onClick={handleOpenNew}
          className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Nova Questão
        </Button>
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A8BBC0]" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ID externo, enunciado, assunto ou tags..."
              className="pl-9 bg-[#152228] border-[#294149] text-white text-xs"
            />
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
              value={levelFilter}
              onChange={(e) => setLevelFilter(Number(e.target.value))}
              className="w-full h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-3 focus:outline-none focus:ring-1 focus:ring-[#01B59A]"
            >
              <option value={0}>Todos os Níveis (L1-L5)</option>
              <option value={1}>L1 — Revisão Guiada</option>
              <option value={2}>L2 — Aplicação Direta</option>
              <option value={3}>L3 — Diagnóstico / Investigativo</option>
              <option value={4}>L4 — Síntese e Normas</option>
              <option value={5}>L5 — Julgamento de Engenharia</option>
            </select>
          </div>
        </div>

        {/* Filtros Especiais de Telemetria */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-[#A8BBC0] hover:text-white">
            <input
              type="checkbox"
              checked={onlyContested}
              onChange={(e) => setOnlyContested(e.target.checked)}
              className="rounded accent-[#C69B4B]"
            />
            <span>Contestadas pelos Alunos</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-[#A8BBC0] hover:text-white">
            <input
              type="checkbox"
              checked={onlyLowPerformance}
              onChange={(e) => setOnlyLowPerformance(e.target.checked)}
              className="rounded accent-[#C86F63]"
            />
            <span>Baixa Performance (&lt; 50% acerto)</span>
          </label>
          <span className="text-[10px] font-mono text-[#A8BBC0] bg-[#152228] px-2 py-0.5 rounded border border-[#294149]">
            Telemetria: PENDENTE de pipeline de dados analíticos
          </span>
        </div>
      </div>

      {/* Lista de Questões */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-[#A8BBC0]">
          Carregando banco de questões...
        </div>
      ) : questions.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#294149] rounded-xl bg-[#152228]/30 space-y-3">
          <HelpCircle className="h-10 w-10 text-[#A8BBC0] mx-auto opacity-50" />
          <p className="text-sm text-white font-medium">Nenhuma questão encontrada</p>
          <p className="text-xs text-[#A8BBC0]">
            Crie novas questões com equações LaTeX e critérios de correção.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div
              key={q.id}
              className="rounded-xl border border-[#294149] bg-[#152228]/70 hover:border-[#01B59A]/60 transition-all p-4 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#01B59A] bg-[#0C1317] px-2 py-0.5 rounded border border-[#294149]">
                    {q.externalId}
                  </span>
                  <Badge variant="outline" className="text-[10px] border-[#294149] text-[#E6EAED]">
                    Nível L{q.authoringLevel}
                  </Badge>
                  <span className="text-xs text-[#A8BBC0] font-mono">• {q.subjectArea}</span>
                  <span className="text-xs text-[#A8BBC0] font-mono">• v{q.version}</span>
                  {getStatusBadge(q.editorialStatus)}
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewQuestion(q)}
                    className="h-7 text-xs border-[#294149] text-white hover:border-[#01B59A]"
                  >
                    <Eye className="h-3 w-3 mr-1" /> Gabarito / Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEdit(q)}
                    className="h-7 text-xs border-[#294149] text-white hover:border-[#01B59A]"
                  >
                    <Edit3 className="h-3 w-3 mr-1" /> Editar
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDuplicate(q.id)}
                    className="h-7 w-7 text-[#A8BBC0] hover:text-white"
                    title="Duplicar Questão"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(q.id)}
                    className="h-7 w-7 text-[#C86F63] hover:bg-[#C86F63]/10"
                    title="Excluir / Arquivar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Título e Trecho do Enunciado */}
              <div>
                <h3 className="text-sm font-semibold text-white">{q.title}</h3>
                <p className="text-xs text-[#A8BBC0] line-clamp-2 mt-1">
                  {q.promptMarkdown.slice(0, 160)}...
                </p>
              </div>

              {/* Rodapé com Telemetria e Ações de Workflow */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#294149]/60 pt-3 text-[11px] text-[#A8BBC0]">
                <div className="flex items-center gap-4">
                  {q.telemetryStats && (
                    <div className="flex items-center gap-3 font-mono text-[10px]">
                      <span>Acerto: {q.telemetryStats.accuracyRate}%</span>
                      <span>Tentativas: {q.telemetryStats.totalAttempts}</span>
                      {q.telemetryStats.isContested && (
                        <span className="text-[#C69B4B] flex items-center gap-1 font-bold">
                          <AlertTriangle className="h-3 w-3" /> Contestada
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {q.editorialStatus === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => handleSendToReview(q)}
                      className="h-6 text-[11px] bg-[#C69B4B] text-black hover:bg-[#C69B4B]/90 font-medium"
                    >
                      <Send className="h-3 w-3 mr-1" /> Submeter para Revisão
                    </Button>
                  )}
                  {q.editorialStatus === 'in_review' && (
                    <Button
                      size="sm"
                      onClick={() => handlePublishDirect(q)}
                      className="h-6 text-[11px] bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Aprovar & Publicar (v{q.version})
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Preview Completo (Gabarito Protegido) */}
      <Dialog open={!!previewQuestion} onOpenChange={(open) => !open && setPreviewQuestion(null)}>
        <DialogContent className="max-w-2xl bg-[#0C1317] border-[#294149] text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <span className="font-mono text-[#01B59A]">{previewQuestion?.externalId}</span>
              <span>— {previewQuestion?.title}</span>
            </DialogTitle>
          </DialogHeader>

          {previewQuestion && (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg border border-[#294149] bg-[#152228]/50">
                <span className="font-mono text-[10px] uppercase text-[#A8BBC0] block mb-1">
                  Enunciado com suporte a LaTeX:
                </span>
                <SanitizedMarkdownViewer content={previewQuestion.promptMarkdown} />
              </div>

              {previewQuestion.options.length > 0 && (
                <div className="space-y-2">
                  <span className="font-mono text-[10px] uppercase text-[#A8BBC0]">
                    Alternativas Cadastradas & Justificativas dos Distratores:
                  </span>
                  {previewQuestion.options.map((opt) => {
                    const isCorrect = previewQuestion.privateKey.correctOptionIds?.includes(opt.id)
                    return (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded border text-xs space-y-1 ${
                          isCorrect
                            ? 'border-[#01B59A] bg-[#01B59A]/15 text-white'
                            : 'border-[#294149] bg-[#152228]/60 text-[#A8BBC0]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#01B59A]">{opt.label})</span>
                          <span className="font-medium text-white">{opt.textMarkdown}</span>
                          {isCorrect && (
                            <Badge className="bg-[#01B59A] text-black text-[9px] uppercase font-mono ml-auto">
                              Gabarito
                            </Badge>
                          )}
                        </div>
                        {opt.distractorRationale && (
                          <p className="text-[11px] italic text-[#A8BBC0] pl-5 border-t border-white/5 pt-1">
                            Justificativa: {opt.distractorRationale}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Bloco Protegido do Gabarito */}
              <div className="p-3 rounded-lg border border-[#C69B4B]/60 bg-[#C69B4B]/10 space-y-2">
                <div className="flex items-center gap-1.5 text-[#C69B4B] font-bold text-xs uppercase font-mono">
                  <Lock className="h-3.5 w-3.5" /> Gabarito e Rubrica Protegidos (private_key_json)
                </div>
                <p className="text-[11px] text-[#A8BBC0]">
                  Este payload é restrito ao servidor. Alunos nunca recebem estas informações antes
                  da submissão.
                </p>
                <div className="font-mono text-[11px] text-white bg-black/40 p-2 rounded border border-[#C69B4B]/30">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(previewQuestion.privateKey, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Explicação Técnica */}
              <div className="p-3 rounded-lg border border-[#294149] bg-[#152228]/50 space-y-1">
                <span className="font-mono text-[10px] uppercase text-[#01B59A] font-bold">
                  Explicação da Resolução:
                </span>
                <SanitizedMarkdownViewer content={previewQuestion.explanationMarkdown} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewQuestion(null)}
              className="text-xs border-[#294149]"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editor de Questão */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-2xl bg-[#0C1317] border-[#294149] text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">
              {editingQuestion?.id ? 'Editar Questão Técnica' : 'Cadastrar Nova Questão Técnica'}
            </DialogTitle>
          </DialogHeader>

          {editingQuestion && (
            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-white">ID Externo *</Label>
                  <Input
                    value={editingQuestion.externalId}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, externalId: e.target.value })
                    }
                    className="mt-1 bg-[#152228] border-[#294149] text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs text-white">Área de Conhecimento</Label>
                  <Input
                    value={editingQuestion.subjectArea}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, subjectArea: e.target.value })
                    }
                    className="mt-1 bg-[#152228] border-[#294149] text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-white">Título da Questão *</Label>
                <Input
                  value={editingQuestion.title}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, title: e.target.value })
                  }
                  className="mt-1 bg-[#152228] border-[#294149] text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-white">Tipo de Questão</Label>
                  <select
                    value={editingQuestion.questionType}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        questionType: e.target.value as QuestionType,
                      })
                    }
                    className="mt-1 w-full h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-2"
                  >
                    <option value="single_choice">Escolha Única</option>
                    <option value="multiple_choice">Múltipla Escolha</option>
                    <option value="true_false">Verdadeiro / Falso</option>
                    <option value="numeric_response">Numérica</option>
                    <option value="ordered_steps">Ordenação de Etapas</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-white">Nível Autoral</Label>
                  <select
                    value={editingQuestion.authoringLevel}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        authoringLevel: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                      })
                    }
                    className="mt-1 w-full h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-2 font-mono"
                  >
                    <option value={1}>L1 — Revisão Guiada</option>
                    <option value={2}>L2 — Aplicação Direta</option>
                    <option value={3}>L3 — Diagnóstico</option>
                    <option value={4}>L4 — Síntese e Normas</option>
                    <option value={5}>L5 — Julgamento</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-white">Recompensa XP</Label>
                  <Input
                    type="number"
                    value={editingQuestion.xpReward}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        xpReward: parseInt(e.target.value, 10),
                      })
                    }
                    className="mt-1 bg-[#152228] border-[#294149] text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-white">Enunciado (Markdown & LaTeX) *</Label>
                <Textarea
                  value={editingQuestion.promptMarkdown}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, promptMarkdown: e.target.value })
                  }
                  rows={4}
                  className="mt-1 bg-[#152228] border-[#294149] text-white font-mono"
                  required
                />
              </div>

              <div>
                <Label className="text-xs text-white">Explicação Técnica da Resolução *</Label>
                <Textarea
                  value={editingQuestion.explanationMarkdown}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, explanationMarkdown: e.target.value })
                  }
                  rows={3}
                  className="mt-1 bg-[#152228] border-[#294149] text-white"
                  required
                />
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditorOpen(false)}
                  className="text-xs border-[#294149]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs"
                >
                  Salvar Questão
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
