import React, { useEffect, useState } from 'react'
import {
  Users,
  Search,
  UserPlus,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { AdminService } from '@/services/adminService'
import { AdminStudentRow } from '@/data/demoData'
import { useToast } from '@/hooks/use-toast'

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<AdminStudentRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<AdminStudentRow | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<AdminStudentRow | null>(null)

  // Form states
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newCrea, setNewCrea] = useState('')
  const [newCourse, setNewCourse] = useState('Método do Zero ao MEF')

  const { toast } = useToast()

  const loadData = async () => {
    const list = await AdminService.getStudents()
    setStudents(list)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.primaryCourse.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newEmail) return

    await AdminService.addStudent({
      name: newName,
      email: newEmail,
      crea: newCrea || undefined,
      primaryCourse: newCourse,
      progress: 0,
      status: 'Ativo',
    })

    toast({
      title: 'Aluno cadastrado (Demonstração)',
      description: `O cadastro de ${newName} foi adicionado à lista em memória local.`,
    })

    setAddModalOpen(false)
    setNewName('')
    setNewEmail('')
    setNewCrea('')
    loadData()
  }

  const handleDelete = async () => {
    if (!studentToDelete) return
    await AdminService.deleteStudent(studentToDelete.id)
    toast({
      title: 'Aluno removido (Demonstração)',
      description: `O registro de ${studentToDelete.name} foi removido da lista de testes.`,
    })
    setDeleteModalOpen(false)
    setStudentToDelete(null)
    loadData()
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#C69B4B] uppercase tracking-wider mb-1">
            <Users className="h-4 w-4" />
            <span>Gestão de Usuários • Controle de Acesso</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Alunos Matriculados
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Tabela de gerenciamento cadastral, progresso e status de atividade.
          </p>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="bg-[#01B59A] hover:bg-[#00A88F] text-black font-semibold text-xs h-9 self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          <span>Adicionar Aluno Demo</span>
        </Button>
      </div>

      {/* Busca */}
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, e-mail ou curso..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 text-xs bg-card border-border"
        />
      </div>

      {/* Tabela de Alunos */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] font-mono uppercase text-muted-foreground">
              <tr>
                <th className="py-3 px-4">Aluno</th>
                <th className="py-3 px-4">CREA</th>
                <th className="py-3 px-4">Trilha Principal</th>
                <th className="py-3 px-4">Progresso</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Último Acesso</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs shrink-0">
                        {s.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{s.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-muted-foreground">{s.crea || '—'}</td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-foreground">{s.primaryCourse}</span>
                  </td>

                  <td className="py-3.5 px-4 w-36">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span>Avanço</span>
                        <span className="font-bold text-primary">{s.progress}%</span>
                      </div>
                      <Progress value={s.progress} className="h-1.5 bg-muted" />
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge
                      variant="outline"
                      className={`text-[9px] uppercase font-mono ${
                        s.status === 'Ativo'
                          ? 'border-[#1D957A]/40 text-[#1D957A] bg-[#1D957A]/10'
                          : s.status === 'Pendente'
                            ? 'border-[#C69B4B]/40 text-[#C69B4B] bg-[#C69B4B]/10'
                            : 'border-border text-muted-foreground'
                      }`}
                    >
                      {s.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-muted-foreground text-[11px]">
                    {s.lastActive}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedStudent(s)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Ver detalhes"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setStudentToDelete(s)
                          setDeleteModalOpen(true)
                        }}
                        className="h-7 w-7 text-muted-foreground hover:text-[#C86F63]"
                        title="Remover aluno demo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Adicionar Aluno */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Matricular Novo Aluno Demo</DialogTitle>
            <DialogDescription className="text-xs">
              Adicione um aluno demonstrativo para testar visualização e entitlements.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddStudent} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Nome Completo</Label>
              <Input
                placeholder="Ex.: Eng. Rodrigo Maia"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">E-mail</Label>
              <Input
                type="email"
                placeholder="rodrigo.maia@engenharia.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">CREA (opcional)</Label>
              <Input
                placeholder="SP-20239102"
                value={newCrea}
                onChange={(e) => setNewCrea(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Curso Inicial</Label>
              <select
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground"
              >
                <option value="Método do Zero ao MEF">Método do Zero ao MEF (MDZAM)</option>
                <option value="SOLIDWORKS Simulation">SOLIDWORKS Simulation</option>
                <option value="Formação Contínua">Formação Contínua: Fundamentos</option>
                <option value="Estruturas Metálicas">Estruturas Metálicas (NBR 8800)</option>
              </select>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#01B59A] hover:bg-[#00A88F] text-black font-semibold text-xs"
              >
                Cadastrar Aluno
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Confirmar Remoção</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Deseja remover o aluno demonstrativo{' '}
              <strong className="text-foreground">{studentToDelete?.name}</strong> da lista em
              memória?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} className="text-xs">
              Remover Aluno Demo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
