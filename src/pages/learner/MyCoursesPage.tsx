import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Clock, ArrowRight, CheckCircle2, Lock, Search, Filter } from 'lucide-react'
import { STUDENT_COURSES } from '@/data/demoData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function MyCoursesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'em_andamento' | 'concluidos'>('todos')

  const courses = STUDENT_COURSES.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase())
    if (statusFilter === 'em_andamento') {
      return matchesSearch && course.hasEntitlement && course.progressPercent < 100
    }
    if (statusFilter === 'concluidos') {
      return matchesSearch && course.progressPercent === 100
    }
    return matchesSearch
  })

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-border space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider">
          <GraduationCap className="h-4 w-4" />
          <span>Área do Aluno • Matrículas</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Meus Cursos
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Acompanhe seu avanço individual nas trilhas de engenharia matriculadas.
        </p>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Filtrar meus cursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs bg-card border-border"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <Button
            variant={statusFilter === 'todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('todos')}
            className={`text-xs h-8 ${statusFilter === 'todos' ? 'bg-[#01B59A] text-black font-semibold' : 'border-border'}`}
          >
            Todos ({STUDENT_COURSES.length})
          </Button>
          <Button
            variant={statusFilter === 'em_andamento' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('em_andamento')}
            className={`text-xs h-8 ${statusFilter === 'em_andamento' ? 'bg-[#01B59A] text-black font-semibold' : 'border-border'}`}
          >
            Em andamento (3)
          </Button>
          <Button
            variant={statusFilter === 'concluidos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('concluidos')}
            className={`text-xs h-8 ${statusFilter === 'concluidos' ? 'bg-[#01B59A] text-black font-semibold' : 'border-border'}`}
          >
            Concluídos (0)
          </Button>
        </div>
      </div>

      {/* Grid de Cartões */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="bg-card border-border flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] border border-border">
                  {course.category}
                </span>
                <span className="text-muted-foreground text-[11px]">{course.lastAccessed}</span>
              </div>
              <CardTitle className="text-base font-bold text-foreground">{course.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {course.description}
              </p>

              {course.hasEntitlement ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">
                      {course.completedLessons} de {course.totalLessons} aulas concluídas
                    </span>
                    <span className="font-bold text-primary">{course.progressPercent}%</span>
                  </div>
                  <Progress value={course.progressPercent} className="h-2 bg-muted" />
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 flex items-start gap-2">
                  <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {course.entitlementReason}
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-border">
                <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {course.workloadHours}h carga horária
                </span>

                <Button
                  asChild
                  size="sm"
                  variant={course.hasEntitlement ? 'default' : 'outline'}
                  className={
                    course.hasEntitlement
                      ? 'bg-[#01B59A] hover:bg-[#00A88F] text-black font-semibold text-xs'
                      : 'border-border text-xs'
                  }
                >
                  <Link to={`/app/trilhas/${course.slug}`}>
                    <span>{course.hasEntitlement ? 'Acessar Trilha' : 'Ver Detalhes'}</span>
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
