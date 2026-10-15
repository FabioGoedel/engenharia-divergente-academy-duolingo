import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Boxes,
  Clock,
  User,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { isAdminRole } from '@/lib/rbac'
import { EditorialReviewItem, EditorialStatus } from '@/types/cms'
import { ReviewWorkflowService } from '@/services/reviewWorkflowService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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

export const AdminEditorialReviewPage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const canPublish = user?.role ? isAdminRole(user.role) : false

  const [queue, setQueue] = useState<EditorialReviewItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('in_review')

  // Modais de decisão
  const [selectedItem, setSelectedItem] = useState<EditorialReviewItem | null>(null)
  const [decisionNotes, setDecisionNotes] = useState('')
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)

  const loadQueue = async () => {
    setIsLoading(true)
    try {
      const data = await ReviewWorkflowService.listQueue(
        statusFilter === 'all' ? undefined : (statusFilter as EditorialStatus),
      )
      setQueue(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadQueue()
  }, [statusFilter])

  const handleApprove = async () => {
    if (!selectedItem) return

    try {
      const res = await ReviewWorkflowService.approveReview(
        selectedItem.id,
        user?.name || 'Coordenação Técnica',
        decisionNotes,
        user?.role,
      )

      if (!res.success) {
        toast({
          variant: 'destructive',
          title: 'Aprovação bloqueada',
          description: res.errors?.join('; '),
        })
      } else {
        toast({
          title: 'Conteúdo Aprovado com Sucesso',
          description: 'A versão imutável pública foi ativada e versionada.',
        })
        setIsApproveOpen(false)
        setSelectedItem(null)
        setDecisionNotes('')
        loadQueue()
      }
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Falha ao aprovar',
      })
    }
  }

  const handleReject = async () => {
    if (!selectedItem || !decisionNotes.trim()) {
      toast({
        variant: 'destructive',
        title: 'Justificativa obrigatória',
        description: 'Descreva os apontamentos técnicos para o autor do rascunho.',
      })
      return
    }

    try {
      await ReviewWorkflowService.rejectReview(
        selectedItem.id,
        user?.name || 'Coordenação Técnica',
        decisionNotes,
        user?.role,
      )

      toast({
        title: 'Conteúdo devolvido para ajustes',
        description: 'O status voltou para rascunho com as observações do revisor.',
      })
      setIsRejectOpen(false)
      setSelectedItem(null)
      setDecisionNotes('')
      loadQueue()
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Falha ao rejeitar',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#294149] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Revisão Editorial</h1>
            <Badge variant="outline" className="text-[10px] border-[#C69B4B]/40 text-[#C69B4B]">
              Fila de Aprovação
            </Badge>
          </div>
          <p className="text-xs text-[#A8BBC0] mt-1">
            Gargalo de qualidade técnica: rascunhos de blocos e questões são auditados antes da
            promoção para versão imutável publicada.
          </p>
        </div>
      </div>

      {/* Filtro de Status */}
      <div className="flex items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-3 focus:outline-none focus:ring-1 focus:ring-[#01B59A]"
        >
          <option value="in_review">Aguardando Revisão (Pendentes)</option>
          <option value="published">Aprovados Recentemente</option>
          <option value="draft">Rascunhos / Ajustes Solicitados</option>
          <option value="all">Todo o Histórico</option>
        </select>
      </div>

      {/* Lista da Fila */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-[#A8BBC0]">
          Carregando fila de aprovação editorial...
        </div>
      ) : queue.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#294149] rounded-xl bg-[#152228]/30 space-y-3">
          <CheckCircle2 className="h-10 w-10 text-[#01B59A] mx-auto opacity-70" />
          <p className="text-sm text-white font-medium">Nenhum item pendente de revisão</p>
          <p className="text-xs text-[#A8BBC0]">
            Todos os conteúdos submetidos já foram homologados ou devolvidos para refinamento.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#294149] bg-[#152228]/80 p-4 hover:border-[#01B59A]/60 transition-all"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#01B59A] bg-[#0C1317] px-2 py-0.5 rounded border border-[#294149]">
                    {item.entityType === 'question' ? 'Questão' : 'Bloco'}
                  </span>
                  <span className="text-xs text-[#A8BBC0] font-mono">• {item.categoryOrType}</span>
                  <Badge
                    className={`text-[9px] uppercase font-mono font-bold ${
                      item.currentStatus === 'published'
                        ? 'bg-[#01B59A] text-black'
                        : item.currentStatus === 'in_review'
                          ? 'bg-[#C69B4B] text-black'
                          : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {item.currentStatus}
                  </Badge>
                </div>

                <h3 className="text-sm font-semibold text-white">{item.title}</h3>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#A8BBC0]">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" /> Solicitado por: {item.requestedBy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />{' '}
                    {new Date(item.requestedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {item.notes && (
                  <p className="text-xs text-[#E6EAED] bg-[#0C1317]/60 p-2 rounded border border-[#294149]/60 italic">
                    Notas: {item.notes}
                  </p>
                )}
              </div>

              {item.currentStatus === 'in_review' && (
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedItem(item)
                      setIsRejectOpen(true)
                    }}
                    className="h-8 text-xs border-[#C86F63]/50 text-[#C86F63] hover:bg-[#C86F63]/10"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Rejeitar / Ajustes
                  </Button>
                  {canPublish ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item)
                        setIsApproveOpen(true)
                      }}
                      className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs h-8"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Homologar & Publicar
                    </Button>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-[#C69B4B]/50 text-[#C69B4B] py-1"
                    >
                      Aguardando aprovação de admin
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de Aprovação */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="max-w-md bg-[#0C1317] border-[#294149] text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#01B59A]" />
              Homologar e Publicar Conteúdo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <p className="text-[#A8BBC0]">
              Você está aprovando o item{' '}
              <strong className="text-white">{selectedItem?.title}</strong>. Uma versão imutável
              será gerada e o conteúdo ficará disponível para os alunos.
            </p>

            <div>
              <Label className="text-xs text-white">Parecer Técnico (Opcional)</Label>
              <Textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Ex: Verificado em conformidade com a NBR 8800..."
                className="mt-1 bg-[#152228] border-[#294149] text-white text-xs"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setIsApproveOpen(false)}
              className="text-xs border-[#294149]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApprove}
              className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs"
            >
              Confirmar Publicação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Rejeição / Ajustes */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md bg-[#0C1317] border-[#294149] text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2 text-[#C86F63]">
              <AlertTriangle className="h-4 w-4" />
              Devolver para Ajustes Técnicos
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <p className="text-[#A8BBC0]">
              O item retornará para o estado de <strong>Rascunho</strong> para que o autor faça as
              correções necessárias.
            </p>

            <div>
              <Label className="text-xs text-white">Motivo / Apontamentos Técnicos *</Label>
              <Textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Descreva claramente o que deve ser corrigido (ex: fórmula com símbolo invertido, tolerância inadequada)..."
                className="mt-1 bg-[#152228] border-[#294149] text-white text-xs"
                rows={3}
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setIsRejectOpen(false)}
              className="text-xs border-[#294149]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReject}
              className="bg-[#C86F63] text-white hover:bg-[#C86F63]/90 font-semibold text-xs"
            >
              Devolver Rascunho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
