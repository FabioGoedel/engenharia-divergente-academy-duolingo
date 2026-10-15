import React, { useEffect, useState } from 'react'
import {
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Layers,
  Ban,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AdminService } from '@/services/adminService'
import { AdminEnrollmentRow } from '@/data/demoData'
import { useToast } from '@/hooks/use-toast'

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<AdminEnrollmentRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  const loadData = async () => {
    const list = await AdminService.getEnrollments()
    setEnrollments(list)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = enrollments.filter(
    (e) =>
      e.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleCancel = async (id: string, name: string) => {
    await AdminService.cancelEnrollment(id)
    toast({
      title: 'Matrícula cancelada (Demonstração)',
      description: `A matrícula de ${name} foi marcada como cancelada na lista em memória.`,
    })
    loadData()
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-border space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-[#C69B4B] uppercase tracking-wider">
          <FileSpreadsheet className="h-4 w-4" />
          <span>Gestão de Matrículas & Entitlements</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Matrículas & Direitos Concedidos
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Registro de vínculos entre perfis de alunos e trilhas da academia.
        </p>
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
                <th className="py-3 px-4">Curso Vinculado</th>
                <th className="py-3 px-4">Data de Matrícula</th>
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

                  <td className="py-3.5 px-4 font-semibold text-foreground">{enr.courseTitle}</td>

                  <td className="py-3.5 px-4 font-mono text-muted-foreground text-[11px]">
                    {enr.enrolledAt}
                  </td>

                  <td className="py-3.5 px-4 w-36">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span>Avanço</span>
                        <span className="font-bold text-primary">{enr.progress}%</span>
                      </div>
                      <Progress value={enr.progress} className="h-1.5 bg-muted" />
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge
                      variant="outline"
                      className={`text-[9px] uppercase font-mono ${
                        enr.status === 'Ativa'
                          ? 'border-[#1D957A]/40 text-[#1D957A] bg-[#1D957A]/10'
                          : enr.status === 'Concluída'
                            ? 'border-primary/40 text-primary bg-primary/10'
                            : 'border-destructive/40 text-destructive bg-destructive/10'
                      }`}
                    >
                      {enr.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {enr.status === 'Ativa' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancel(enr.id, enr.studentName)}
                        className="text-xs text-muted-foreground hover:text-destructive h-7"
                      >
                        <Ban className="h-3 w-3 mr-1" />
                        Suspender
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Inalterável
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
