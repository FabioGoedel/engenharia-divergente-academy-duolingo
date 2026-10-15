import React, { useEffect, useState } from 'react'
import { BookOpen, Plus, Clock, CheckCircle2, AlertCircle, FileText, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Label } from '@/components/ui/label'
import { Link } from 'react-router-dom'
import { AdminService } from '@/services/adminService'
import { AdminCourseRow } from '@/data/demoData'
import { useToast } from '@/hooks/use-toast'

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourseRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('Cálculo Avançado')
  const [workloadHours, setWorkloadHours] = useState('40')

  const { toast } = useToast()

  const loadData = async () => {
    const list = await AdminService.getCourses()
    setCourses(list)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !slug) return

    await AdminService.addCourse({
      slug,
      title,
      category,
      workloadHours: parseInt(workloadHours) || 40,
      status: 'Rascunho',
    })

    toast({
      title: 'Trilha criada (Demonstração)',
      description: `A trilha "${title}" foi adicionada ao catálogo em memória.`,
    })

    setAddModalOpen(false)
    setTitle('')
    setSlug('')
    loadData()
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#C69B4B] uppercase tracking-wider mb-1">
            <BookOpen className="h-4 w-4" />
            <span>Matriz Curricular • Gerenciamento de Cursos</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Cursos & Trilhas Cadastradas
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Visualização de métricas de engajamento, status de publicação e carga horária.
          </p>
        </div>

        <Button
          onClick={() => setAddModalOpen(true)}
          className="bg-[#01B59A] hover:bg-[#00A88F] text-black font-semibold text-xs h-9 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Criar Nova Trilha Demo</span>
        </Button>
      </div>

      {/* Busca */}
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar por curso ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 text-xs bg-card border-border"
        />
      </div>

      {/* Tabela de Cursos */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-[11px] font-mono uppercase text-muted-foreground">
              <tr>
                <th className="py-3 px-4">Trilha / Curso</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Alunos Matriculados</th>
                <th className="py-3 px-4">Taxa Conclusão</th>
                <th className="py-3 px-4">Carga Horária</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-foreground">
                    <div>
                      <span>{c.title}</span>
                      <p className="text-[10px] text-muted-foreground font-mono font-normal">
                        slug: /{c.slug}
                      </p>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-muted border border-border text-[10px] text-muted-foreground font-mono">
                      {c.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-foreground font-semibold">
                    {c.enrolledStudents} alunos
                  </td>

                  <td className="py-3.5 px-4 font-mono">
                    <span className="text-primary font-bold">{c.completionRate}%</span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-muted-foreground">
                    {c.workloadHours} horas
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge
                      variant="outline"
                      className={`text-[9px] uppercase font-mono ${
                        c.status === 'Publicado'
                          ? 'border-[#1D957A]/40 text-[#1D957A] bg-[#1D957A]/10'
                          : 'border-[#C69B4B]/40 text-[#C69B4B] bg-[#C69B4B]/10'
                      }`}
                    >
                      {c.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-xs text-[#01B59A] hover:text-[#01B59A] hover:bg-[#01B59A]/10 h-7"
                    >
                      <Link to={`/admin/trilhas/editor/${c.slug}`}>Abrir Editor Visual</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Criar Curso */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Criar Nova Trilha Técnica Demo
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cadastre um curso conceitual para exibição no catálogo da Fase 1.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddCourse} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs">Título do Curso</Label>
              <Input
                placeholder="Ex.: Análise de Tensões Térmicas e Fadiga"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-]/g, ''),
                  )
                }}
                required
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Slug da Rota (URL)</Label>
              <Input
                placeholder="analise-tensoes-termicas"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Categoria</Label>
                <Input
                  placeholder="CAE / Estrutural"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Carga Horária (h)</Label>
                <Input
                  type="number"
                  value={workloadHours}
                  onChange={(e) => setWorkloadHours(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
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
                Salvar Trilha Demo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
