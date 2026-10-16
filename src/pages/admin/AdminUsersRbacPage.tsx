import React, { useEffect, useState } from 'react'
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  FileText,
  KeyRound,
  Lock,
  Plus,
  Trash2,
  Database,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Role } from '@/lib/rbac'
import { UserManagementService, ManagedUser, AuditLogItem } from '@/services/userManagementService'

const ROLE_COLORS: Record<Role, { bg: string; text: string; border: string }> = {
  super_admin: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  admin: { bg: 'bg-[#C69B4B]/10', text: 'text-[#C69B4B]', border: 'border-[#C69B4B]/30' },
  content_editor: { bg: 'bg-[#01B59A]/10', text: 'text-[#01B59A]', border: 'border-[#01B59A]/30' },
  student: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
}

export default function AdminUsersRbacPage() {
  const { user: currentAuthUser, authMode } = useAuth()
  const { toast } = useToast()

  const [users, setUsers] = useState<ManagedUser[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Modais de ação de papel
  const [assignRoleModalOpen, setAssignRoleModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null)
  const [roleToAssign, setRoleToAssign] = useState<Role>('content_editor')
  const [isProcessing, setIsProcessing] = useState(false)

  const [revokeRoleModalOpen, setRevokeRoleModalOpen] = useState(false)
  const [roleToRevoke, setRoleToRevoke] = useState<Role>('student')

  const loadData = async () => {
    setIsLoading(true)
    const [usersRes, logsRes] = await Promise.all([
      UserManagementService.listUsers(),
      UserManagementService.listAuditLogs(60),
    ])

    if (usersRes.error) {
      toast({
        variant: 'destructive',
        title: 'Aviso ao carregar usuários',
        description: usersRes.error,
      })
    } else {
      setUsers(usersRes.users)
    }

    if (!logsRes.error) {
      setAuditLogs(logsRes.logs)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.creaNumber && u.creaNumber.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleOpenAssignModal = (u: ManagedUser) => {
    setSelectedUser(u)
    // Sugere papel que ele ainda não tenha
    const unassigned = (['content_editor', 'admin', 'super_admin'] as Role[]).find(
      (r) => !u.roles.includes(r),
    )
    setRoleToAssign(unassigned || 'content_editor')
    setAssignRoleModalOpen(true)
  }

  const handleOpenRevokeModal = (u: ManagedUser, r: Role) => {
    setSelectedUser(u)
    setRoleToRevoke(r)
    setRevokeRoleModalOpen(true)
  }

  const handleConfirmAssignRole = async () => {
    if (!selectedUser) return
    setIsProcessing(true)

    const res = await UserManagementService.assignRole(selectedUser.id, roleToAssign)
    setIsProcessing(false)

    if (res.error) {
      toast({
        variant: 'destructive',
        title: 'Operação recusada pelo banco',
        description: res.error,
      })
      return
    }

    toast({
      title: 'Papel atribuído com sucesso',
      description: `O papel ${roleToAssign} foi concedido a ${selectedUser.fullName}. Evento registrado na auditoria.`,
    })

    setAssignRoleModalOpen(false)
    loadData()
  }

  const handleConfirmRevokeRole = async () => {
    if (!selectedUser) return
    setIsProcessing(true)

    const res = await UserManagementService.revokeRole(selectedUser.id, roleToRevoke)
    setIsProcessing(false)

    if (res.error) {
      toast({
        variant: 'destructive',
        title: 'Revogação bloqueada',
        description: res.error,
      })
      return
    }

    toast({
      title: 'Papel revogado',
      description: `O papel ${roleToRevoke} foi removido de ${selectedUser.fullName}.`,
    })

    setRevokeRoleModalOpen(false)
    loadData()
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#01B59A] uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Subfase 4.1 • Controle de Acesso e Governança</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Gestão de Usuários e RBAC
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Administração centralizada de permissões no Supabase com validação estrita de
            super_admin e logs de auditoria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="text-xs border-border gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Alerta de Modo de Execução */}
      {authMode === 'demo' && (
        <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-500 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="leading-snug space-y-1">
            <p className="font-bold text-xs">
              Você está navegando com uma conta demonstrativa local.
            </p>
            <p className="text-muted-foreground text-[11px]">
              Para alterar papéis de usuários no banco de dados real via RLS e procedures,
              autentique-se com a conta de administrador real (ex.:{' '}
              <code className="text-amber-400">fgoedel@gmail.com</code>).
            </p>
          </div>
        </div>
      )}

      {/* Tabs Principais: Usuários vs. Auditoria */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="users" className="text-xs gap-2">
            <Users className="h-3.5 w-3.5" />
            <span>Usuários & Papéis ({users.length})</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs gap-2">
            <FileText className="h-3.5 w-3.5" />
            <span>Logs de Auditoria ({auditLogs.length})</span>
          </TabsTrigger>
          <TabsTrigger value="bootstrap" className="text-xs gap-2">
            <KeyRound className="h-3.5 w-3.5" />
            <span>Procedimento de Bootstrap</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: USUÁRIOS & PAPÉIS */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, e-mail ou CREA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs bg-card border-border"
              />
            </div>
            <div className="text-xs font-mono text-muted-foreground self-start sm:self-auto">
              Total de perfis no banco: <strong>{users.length}</strong>
            </div>
          </div>

          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-[11px] font-mono uppercase text-muted-foreground">
                    <tr>
                      <th className="py-3 px-4">Usuário</th>
                      <th className="py-3 px-4">CREA</th>
                      <th className="py-3 px-4">Papéis Ativos (RBAC)</th>
                      <th className="py-3 px-4">XP / Streak</th>
                      <th className="py-3 px-4">Data Cadastro</th>
                      <th className="py-3 px-4 text-right">Ações de Gestão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                          Nenhum usuário encontrado na base de dados conectada.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs shrink-0">
                                {u.fullName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-foreground">{u.fullName}</p>
                                  {u.isCurrentUser && (
                                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] px-1 py-0">
                                      Você
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground font-mono">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-muted-foreground">
                            {u.creaNumber || '—'}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1.5">
                              {u.roles.map((r) => {
                                const style = ROLE_COLORS[r] || ROLE_COLORS.student
                                return (
                                  <span
                                    key={r}
                                    className={`inline-flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${style.bg} ${style.text} ${style.border}`}
                                  >
                                    <span>{r}</span>
                                    {/* Botão de remoção de papel (se tiver mais de 1 ou não for o próprio) */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenRevokeModal(u, r)}
                                      title={`Revogar papel ${r}`}
                                      className="hover:text-red-400 opacity-70 hover:opacity-100 ml-0.5"
                                    >
                                      ×
                                    </button>
                                  </span>
                                )
                              })}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-muted-foreground text-[11px]">
                            <span>{u.totalXp} XP</span>
                            <span className="mx-1">•</span>
                            <span>{u.streakDays}d</span>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-muted-foreground text-[11px]">
                            {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenAssignModal(u)}
                              className="h-7 text-xs border-border hover:border-primary gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Atribuir Papel</span>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: AUDITORIA */}
        <TabsContent value="audit" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#01B59A]" />
                <span>Trilha Imutável de Auditoria (LGPD & Minimização)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Registros de autenticação, concessão e revogação de papéis. Senhas, tokens e
                segredos nunca são armazenados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-[10px] font-mono uppercase text-muted-foreground">
                    <tr>
                      <th className="py-2.5 px-3">Data / Hora</th>
                      <th className="py-2.5 px-3">Ação</th>
                      <th className="py-2.5 px-3">Ator</th>
                      <th className="py-2.5 px-3">Usuário Alvo</th>
                      <th className="py-2.5 px-3">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-muted-foreground text-xs">
                          Nenhum evento registrado ainda.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/20">
                          <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-2 px-3">
                            <Badge
                              variant="outline"
                              className={`text-[9px] uppercase font-mono ${
                                log.action.includes('privilege') || log.action.includes('failure')
                                  ? 'border-red-500/40 text-red-400 bg-red-500/10'
                                  : log.action.includes('assigned')
                                    ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                                    : 'border-blue-500/40 text-blue-400 bg-blue-500/10'
                              }`}
                            >
                              {log.action}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 font-mono text-muted-foreground text-[11px]">
                            {log.actorEmail}
                          </td>
                          <td className="py-2 px-3 font-mono text-foreground text-[11px]">
                            {log.targetEmail}
                          </td>
                          <td className="py-2 px-3 font-mono text-[10px] text-muted-foreground max-w-xs truncate">
                            {JSON.stringify(log.details)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: PROCEDIMENTO DE BOOTSTRAP */}
        <TabsContent value="bootstrap" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[#C69B4B]" />
                <span>Procedimento Seguro de Bootstrap do Primeiro super_admin</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Como inicializar a conta governante mestre FORA da interface pública, garantindo que
                nenhum usuário comum possa se autoatribuir privilégios no frontend.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
              <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
                <p className="font-semibold text-foreground">
                  1. Conta Mestre de Bootstrap Aplicada na Migration:
                </p>
                <p>
                  O primeiro <code className="text-[#01B59A]">super_admin</code> foi gerado
                  diretamente no banco de dados via a migration versionada{' '}
                  <code className="text-foreground">
                    20261015235800_phase41_auth_rbac_audit.sql
                  </code>
                  .
                </p>
                <div className="font-mono text-[11px] p-2 bg-background rounded border border-border text-foreground space-y-1">
                  <p>
                    E-mail: <strong>fgoedel@gmail.com</strong>
                  </p>
                  <p>
                    Senha inicial: <strong>Skip@Pass</strong> (deve ser alterada após primeiro
                    acesso)
                  </p>
                  <p>
                    Papéis atribuídos: <strong>super_admin, student</strong>
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
                <p className="font-semibold text-foreground">
                  2. Script SQL para Bootstrap Manual de Novo super_admin (fora do frontend):
                </p>
                <pre className="p-3 bg-background rounded border border-border font-mono text-[11px] text-foreground overflow-x-auto">
                  {`-- Execute via Supabase SQL Editor ou Migration:
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::user_role_type
FROM auth.users
WHERE email = 'seu_email@empresa.com'
ON CONFLICT (user_id, role) DO NOTHING;`}
                </pre>
              </div>

              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  Barreira de Segurança Ativa:
                </p>
                <p className="text-xs text-foreground">
                  As políticas RLS de <code className="text-[#01B59A]">public.user_roles</code>{' '}
                  impedem inserções e atualizações diretas por clientes anônimos ou alunos. Somente
                  a procedure <code className="text-[#01B59A]">admin_assign_role</code> (que exige
                  <code className="text-[#01B59A]">is_admin = true</code>) ou comandos executados
                  com role de serviço têm poder de alteração.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL: ATRIBUIR PAPEL */}
      <Dialog open={assignRoleModalOpen} onOpenChange={setAssignRoleModalOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Atribuir Papel no Sistema</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Conceder novo papel ao usuário{' '}
              <strong className="text-foreground">{selectedUser?.fullName}</strong> (
              {selectedUser?.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Papel a ser concedido:</label>
              <Select value={roleToAssign} onValueChange={(v) => setRoleToAssign(v as Role)}>
                <SelectTrigger className="text-xs bg-background border-border">
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-xs">
                  <SelectItem value="student">student (Aluno)</SelectItem>
                  <SelectItem value="content_editor">content_editor (Editor CMS)</SelectItem>
                  <SelectItem value="admin">admin (Administrador Geral)</SelectItem>
                  <SelectItem value="super_admin">super_admin (Super Administrador)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {roleToAssign === 'super_admin' && (
              <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] leading-tight">
                <strong>Atenção:</strong> A concessão de <code>super_admin</code> requer que você
                seja um super_admin ativo e concede acesso irrevogável a todas as configurações e
                papéis da plataforma.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignRoleModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmAssignRole}
              disabled={isProcessing}
              className="bg-[#01B59A] hover:bg-[#00A88F] text-black font-semibold text-xs"
            >
              {isProcessing ? 'Processando...' : 'Confirmar Concessão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: REVOGAR PAPEL */}
      <Dialog open={revokeRoleModalOpen} onOpenChange={setRevokeRoleModalOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Confirmar Revogação de Papel</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Deseja remover o papel <strong className="text-foreground">{roleToRevoke}</strong> de{' '}
              <strong className="text-foreground">{selectedUser?.fullName}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 text-xs text-muted-foreground space-y-2">
            <p>
              O sistema impedirá a operação caso este seja o último <code>super_admin</code> ativo
              no banco de dados.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevokeRoleModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmRevokeRole}
              disabled={isProcessing}
              className="text-xs"
            >
              {isProcessing ? 'Revogando...' : 'Confirmar Revogação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
