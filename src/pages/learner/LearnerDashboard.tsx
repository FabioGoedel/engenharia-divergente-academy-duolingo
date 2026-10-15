import React from 'react'
import { Link } from 'react-router-dom'
import {
  Flame,
  Award,
  Clock,
  BookOpen,
  ArrowRight,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { STUDENT_COURSES, DEADLINES } from '@/data/demoData'

export default function LearnerDashboard() {
  const { user } = useAuth()
  const todayStr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Cursos com entitlement ativo
  const activeCourses = STUDENT_COURSES.filter((c) => c.hasEntitlement)

  return (
    <div className="space-y-8">
      {/* Cabeçalho de Boas-vindas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#01B59A] uppercase tracking-wider mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#01B59A]" />
            <span>Área do Aluno • Painel Pessoal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Olá, {user?.name || 'Engenheiro'}!
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{todayStr}</p>
        </div>

        {/* Streak & XP - Gamificação Sóbria */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                Sequência
              </p>
              <p className="text-sm font-bold text-foreground font-mono">
                {user?.streakDays || 14} dias
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#01B59A]/10 text-[#01B59A]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                XP Técnico
              </p>
              <p className="text-sm font-bold text-foreground font-mono">
                {user?.totalXp || 2840} XP
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Linha de Estatísticas Chave */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Trilhas em andamento</p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1 font-mono">
                3
              </h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Horas ativas (est.)</p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1 font-mono">
                110.6h
              </h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#01B59A]/10 text-[#01B59A] flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Meta diária (2h)</p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1 font-mono text-[#1D957A]">
                110%
              </h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#1D957A]/10 text-[#1D957A] flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Certificados obtidos</p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1 font-mono">
                1
              </h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#C69B4B]/10 text-[#C69B4B] flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção Continuar Aprendendo */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Continuar de onde parou</h2>
            <p className="text-xs text-muted-foreground">
              Retome os estudos nos cursos com entitlement ativo.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs text-primary">
            <Link to="/app/meus-cursos">Ver todos os cursos →</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeCourses.slice(0, 3).map((course) => (
            <Card
              key={course.id}
              className="bg-card border-border hover:border-primary/50 transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1">
                  <span className="px-2 py-0.5 rounded bg-muted border border-border">
                    {course.category}
                  </span>
                  <span>{course.lastAccessed}</span>
                </div>
                <CardTitle className="text-sm font-bold text-foreground line-clamp-2">
                  {course.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Progresso do curso</span>
                    <span className="font-bold text-primary">{course.progressPercent}%</span>
                  </div>
                  <Progress value={course.progressPercent} className="h-2 bg-muted" />
                  <p className="text-[11px] text-muted-foreground">
                    {course.completedLessons} de {course.totalLessons} tópicos concluídos
                  </p>
                </div>

                <Button
                  asChild
                  className="w-full bg-[#01B59A] hover:bg-[#00A88F] text-black font-semibold text-xs h-9"
                >
                  <Link to={`/app/trilhas/${course.slug}`}>
                    <span>Continuar Módulo</span>
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Duas Colunas: Entregas / Prazos + Recomendações Técnicas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Entregas e Avaliações */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Próximas entregas e marcos</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Exercícios de modelagem com prazo estipulado.
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] border-border font-mono">
                Demo Dataset
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {DEADLINES.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-border bg-background/50 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <p className="font-bold text-foreground truncate">{item.taskTitle}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{item.courseTitle}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block px-2 py-0.5 rounded font-mono text-[10px] bg-primary/10 text-primary border border-primary/20">
                    em {item.dueInDays} dias
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.dueDate}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recomendações e Status de Recursos */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#C69B4B]" />
              <span>Recomendações e Avisos da Fase 1</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Diretrizes de aprendizagem e status de módulos avançados.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg border border-[#01B59A]/30 bg-[#01B59A]/5 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Recomendação de Estudo</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Recomendamos finalizar o módulo de formulação fraca antes de abrir modelos 3D no
                SOLIDWORKS Simulation para evitar interpretações equivocadas de tensões nodais.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border bg-background/50 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <AlertCircle className="h-3.5 w-3.5 text-[#C69B4B]" />
                <span>Módulo "Tutor IA Especialista"</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Status:{' '}
                <span className="font-mono text-[#C69B4B] font-semibold">
                  PENDENTE — Planejado para Fase 3
                </span>
                . Nenhum bot simulado está operando nesta entrega.
              </p>
            </div>

            <div className="pt-2">
              <Button asChild variant="outline" size="sm" className="w-full border-border text-xs">
                <Link to="/app/progresso">Ver relatório completo de competências →</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
