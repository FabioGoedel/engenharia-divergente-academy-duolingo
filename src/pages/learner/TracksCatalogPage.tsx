import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Compass,
  Lock,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { STUDENT_COURSES, StudentCourse } from '@/data/demoData'

export default function TracksCatalogPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMode, setFilterMode] = useState<'todos' | 'liberados' | 'bloqueados'>('todos')

  const filteredCourses = STUDENT_COURSES.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterMode === 'liberados') return matchesSearch && course.hasEntitlement
    if (filterMode === 'bloqueados') return matchesSearch && !course.hasEntitlement
    return matchesSearch
  })

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-border space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider">
          <Compass className="h-4 w-4" />
          <span>Catálogo de Trilhas Especializadas</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Trilhas & Matriz Curricular
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Navegue pelas formações técnicas da Engenharia Divergente. Cada trilha possui sua própria
          ementa e critérios de acesso (entitlement). A assinatura base não libera automaticamente
          todas as extensões.
        </p>
      </div>

      {/* Regra de Negócio: Banner Explicativo de Entitlement */}
      <div className="p-4 rounded-xl border border-border bg-card text-xs flex items-start gap-3">
        <div className="h-6 w-6 rounded-md bg-[#C69B4B]/10 text-[#C69B4B] flex items-center justify-center shrink-0 mt-0.5">
          <Info className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-foreground">
            Critério de Desbloqueio e Direitos de Acesso (Entitlement)
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Nesta fase demonstrativa, trilhas sinalizadas como "Bloqueada por Entitlement" requerem
            extensão de matrícula específica. Ao clicar em uma trilha bloqueada, você visualizará o
            mapa e a justificativa regulatória do bloqueio.
          </p>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Buscar por título ou área..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs bg-card border-border"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <Button
            variant={filterMode === 'todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterMode('todos')}
            className={`text-xs h-8 ${filterMode === 'todos' ? 'bg-[#01B59A] text-black font-semibold' : 'border-border'}`}
          >
            Todas ({STUDENT_COURSES.length})
          </Button>
          <Button
            variant={filterMode === 'liberados' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterMode('liberados')}
            className={`text-xs h-8 ${filterMode === 'liberados' ? 'bg-[#01B59A] text-black font-semibold' : 'border-border'}`}
          >
            Liberadas (3)
          </Button>
          <Button
            variant={filterMode === 'bloqueados' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterMode('bloqueados')}
            className={`text-xs h-8 ${filterMode === 'bloqueados' ? 'bg-[#01B59A] text-black font-semibold' : 'border-border'}`}
          >
            Bloqueadas (1)
          </Button>
        </div>
      </div>

      {/* Grade de Trilhas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCourses.map((course) => (
          <Card
            key={course.id}
            className={`bg-card border-border transition-all flex flex-col justify-between ${
              course.hasEntitlement
                ? 'hover:border-primary/50'
                : 'border-dashed border-border/80 opacity-90'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="px-2 py-0.5 rounded bg-muted border border-border text-[11px] text-muted-foreground">
                  {course.category}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {course.workloadHours} horas
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base font-bold text-foreground">
                  {course.title}
                </CardTitle>
                {course.hasEntitlement ? (
                  <Badge className="bg-[#1D957A]/15 text-[#1D957A] border-[#1D957A]/30 text-[10px] uppercase font-mono shrink-0">
                    Disponível
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-[#C69B4B]/10 text-[#C69B4B] border-[#C69B4B]/40 text-[10px] uppercase font-mono shrink-0"
                  >
                    Bloqueado
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">{course.description}</p>

              {/* Informação de Entitlement ou Motivo do Bloqueio */}
              {course.hasEntitlement ? (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs flex items-center justify-between font-mono">
                  <span className="text-muted-foreground">Progresso atual:</span>
                  <span className="font-bold text-primary">{course.progressPercent}%</span>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                    <Lock className="h-3.5 w-3.5" />
                    Motivo do Bloqueio
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {course.entitlementReason}
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-border">
                <span className="text-[11px] text-muted-foreground font-mono">
                  Nível: {course.level}
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
                    <span>
                      {course.hasEntitlement ? 'Abrir Mapa Visual' : 'Ver Ementa Detalhada'}
                    </span>
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
