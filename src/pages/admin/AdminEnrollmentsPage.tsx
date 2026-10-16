import React, { useEffect, useState } from 'react'
import {
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Plus,
  Ban,
  Clock,
  Shield,
  History,
  Lock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import {
  EnrollmentService,
  ManagedEnrollment,
  CourseProductOption,
  EnrollmentAuditLog,
} from '@/services/enrollmentService'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

export default function AdminEnrollmentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [enrollments, setEnrollments] = useState<ManagedEnrollment[]>([])
  const [products, setProducts] = useState<CourseProductOption[]>([])
  const [auditLogs, setAuditLogs] = useState<EnrollmentAuditLog[]>([])
  const [usersList, setUsersList] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modais
  const [isGrantOpen, setIsGrantOpen] = useState(false)
  const [isAuditOpen, setIsAuditOpen] = useState(false)
  const [grantUserId, setGrantUserId] = useState('')
  const [grantProductId, setGrantProductId] = useState('')
  const [grantDays, setGrantDays] = useState('365')
  const [grantReason, setGrantReason] = useState('Matrícula manual administrativa')

  const [revokeTarget, setRevokeTarget] = useState<ManagedEnrollment | null>(null)
  const [revokeReason, setRevokeReason] = useState('')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [enrList, prodList] = await Promise.all([
        EnrollmentService.listEnrollments(),
        EnrollmentService.listProducts(),
      ])

      setEnrollments(enrList)
      setProducts(prodList)

      // Carrega perfis para dropdown de concessão
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .limit(50)

      if (profs) {
        setUsersList(
          profs.map((p: any) => ({
            id: p.id,
            name: p.full_name || 'Usuário',
            email: p.email || '—',
          })),
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = enrollments.filter(
    (e) =>
      e.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleGrantEnrollment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!grantUserId || !grantProductId) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Selecione o aluno e o curso a ser concedido.',
      })
      return
    }

    try {
      let validUntil: string | undefined = undefined
      if (grantDays && Number(grantDays) > 0) {
        const d = new Date()
        d.setDate(d.getDate() + Number(grantDays))
        validUntil = d.toISOString()
      }

      const res = await EnrollmentService.grantManualEnrollment({
        userId: grantUserId,
        productId: grantProductId,
        validUntil,
        reason: grantReason,
        userRole: user?.role,
      })

      toast({
        title: 'Matrícula Concedida!',
        description: res.message,
      })

      setIsGrantOpen(false)
      loadData()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao conceder matrícula',
        description: err?.message || 'Falha na operação',
      })
    }
  }

  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return

    try {
      const res = await EnrollmentService.revokeEnrollment({
        userId: revokeTarget.userId,
        productId: revokeTarget.productId,
        reason: revokeReason || 'Revogação manual executada pelo painel',
        userRole: user?.role,
      })

      toast({
        title: 'Matrícula revogada',
        description: res.message,
      })

      setRevokeTarget(null)
      setRevokeReason('')
      loadData()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao revogar',
        description: err?.message || 'Falha na operação',
      })
    }
  }

  const openAuditModal = async () => {
    setIsAuditOpen(true)
    const logs = await EnrollmentService.getAuditHistory()
    setAuditLogs(logs)
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#01B59A] uppercase tracking-wider">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Gestão Persistente de Matrículas & Entitlements</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground mt-1">
            Matrículas & Direitos Concedidos
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Controle de acesso granular por curso, plano de assinatura e direitos técnicos
            especializados com auditoria integral.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={openAuditModal}
            className="border-border text-foreground hover:border-[#01B59A] text-xs h-9"
          >
            <History className="h-4 w-4 mr-1.5" /> Auditoria
          </Button>
          <Button
            onClick={() => setIsGrantOpen(true)}
            className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs h-9"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Conceder Matrícula
          </Button>
        </div>
      </div>

      {/* Busca */}
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar por aluno, e-mail ou curso..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 text-xs bg-card border-border"
        />
      </div>

      {/* Tabela de Matrículas */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] font-mono uppercase text-muted-foreground">
              <tr>
                <th className="py-3 px-4">Aluno</th>
                <th className="py-3 px-4">Curso / Produto</th>
                <th className="py-3 px-4">Tipo / Tier</th>
                <th className="py-3 px-4">Validade</th>
                <th className="py-3 px-4">Progresso</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((enr) => (
                <tr key={enr.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div>
                      <p className="font-bold text-foreground">{enr.studentName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {enr.studentEmail}
                      </p>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-foreground">
                    <div>
                      <span>{enr.productTitle}</span>
                      <span className="block text-[10px] font-mono text-[#01B59A]">
                        {enr.productCode}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">
                      {enr.tier}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-muted-foreground text-[11px]">
                    {enr.validUntil ? (
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        Até {new Date(enr.validUntil).toLocaleDateString('pt-BR')}
                      </span>
                    ) : (
                      <span className="text-[#01B59A] text-[10px]">Vitalício / Sem expiração</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 w-32">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span>Avanço</span>
                        <span className="font-bold text-[#01B59A]">{enr.progressPercent}%</span>
                      </div>
                      <Progress value={enr.progressPercent} className="h-1.5 bg-muted" />
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge
                      variant="outline"
                      className={`text-[9px] uppercase font-mono ${
                        enr.status === 'active'
                          ? 'border-[#01B59A]/40 text-[#01B59A] bg-[#01B59A]/10'
                          : enr.status === 'completed'
                            ? 'border-blue-500/40 text-blue-400 bg-blue-500/10'
                            : enr.status === 'expired'
                              ? 'border-[#C69B4B]/40 text-[#C69B4B] bg-[#C69B4B]/10'
                              : 'border-destructive/40 text-destructive bg-destructive/10'
                      }`}
                    >
                      {enr.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {enr.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRevokeTarget(enr)}
                        className="text-xs text-muted-foreground hover:text-destructive h-7"
                      >
                        <Ban className="h-3 w-3 mr-1" />
                        Revogar
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-mono">Inativo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Conceder Matrícula */}
      <Dialog open={isGrantOpen} onOpenChange={setIsGrantOpen}>
        <DialogContent className="max-w-md bg-[#0C1317] border-[#294149] text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#01B59A]" />
              Conceder Matrícula Manual
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleGrantEnrollment} className="space-y-3 text-xs">
            <div>
              <Label className="text-xs text-white">Aluno *</Label>
              <select
                value={grantUserId}
                onChange={(e) => setGrantUserId(e.target.value)}
                className="mt-1 w-full h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-2"
                required
              >
                <option value="">Selecione o aluno...</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs text-white">Curso / Especialização *</Label>
              <select
                value={grantProductId}
                onChange={(e) => setGrantProductId(e.target.value)}
                className="mt-1 w-full h-9 rounded-md bg-[#152228] border border-[#294149] text-white text-xs px-2"
                required
              >
                <option value="">Selecione o produto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.code}) — {p.tier}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[#A8BBC0] mt-1">
                Atenção: cursos especializados (MDZAM, SOLIDWORKS, NBR 8800) requerem entitlement
                explícito e não são cobertos pela assinatura base.
              </p>
            </div>

            <div>
              <Label className="text-xs text-white">Prazo de Validade (dias)</Label>
              <Input
                type="number"
                value={grantDays}
                onChange={(e) => setGrantDays(e.target.value)}
                placeholder="365"
                className="mt-1 bg-[#152228] border-[#294149] text-white text-xs"
              />
            </div>

            <div>
              <Label className="text-xs text-white">Justificativa / Motivo</Label>
              <Input
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder="Ex: Concessão promocional de bolsa de estudos"
                className="mt-1 bg-[#152228] border-[#294149] text-white text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGrantOpen(false)}
                className="text-xs border-[#294149]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs"
              >
                Confirmar Concessão
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Revogar Matrícula */}
      <Dialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <DialogContent className="max-w-md bg-[#0C1317] border-[#294149] text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#C86F63]" />
              Revogar Matrícula & Entitlement
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <p className="text-[#A8BBC0]">
              Você está revogando o acesso do aluno{' '}
              <strong className="text-white">{revokeTarget?.studentName}</strong> ao curso{' '}
              <strong className="text-white">{revokeTarget?.productTitle}</strong>.
            </p>

            <div>
              <Label className="text-xs text-white">Motivo da Revogação *</Label>
              <Input
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Ex: Cancelamento de pedido, estorno ou solicitação do aluno"
                className="mt-1 bg-[#152228] border-[#294149] text-white text-xs"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRevokeTarget(null)}
              className="text-xs border-[#294149]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRevokeConfirm}
              className="bg-[#C86F63] text-white hover:bg-[#C86F63]/90 font-semibold text-xs"
            >
              Confirmar Revogação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Histórico de Auditoria */}
      <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
        <DialogContent className="max-w-3xl bg-[#0C1317] border-[#294149] text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <History className="h-5 w-5 text-[#01B59A]" />
              Log de Auditoria de Matrículas
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto space-y-2 text-xs">
            {auditLogs.length === 0 ? (
              <p className="text-center py-8 text-[#A8BBC0]">Nenhum registro de auditoria ainda.</p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded border border-[#294149] bg-[#152228] flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-mono uppercase ${
                          log.action.includes('grant')
                            ? 'text-[#01B59A] border-[#01B59A]/30'
                            : 'text-[#C86F63] border-[#C86F63]/30'
                        }`}
                      >
                        {log.action}
                      </Badge>
                      <span className="text-[#E6EAED] font-medium">{log.reason || 'Sem nota'}</span>
                    </div>
                    <p className="text-[10px] text-[#A8BBC0] font-mono">
                      Target User ID: {log.targetUserId} • Produto: {log.productId}
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-[#A8BBC0]">
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
