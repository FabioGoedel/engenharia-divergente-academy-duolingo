import React, { useEffect, useState } from 'react'
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Brain,
  History,
  AlertCircle,
  Award,
  Calendar,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  LearningPersistenceService,
  StudentDashboardMetrics,
} from '@/services/learningPersistenceService'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  WEEKLY_STUDY_HOURS,
  HISTORICAL_PROGRESS,
  COMPETENCIES,
  RECENT_SESSIONS,
} from '@/data/demoData'

export default function ProgressPage() {
  const { user, authMode } = useAuth()
  const isReal = authMode === 'real' && Boolean(user?.id && !user.id.startsWith('demo-'))
  const [realMetrics, setRealMetrics] = useState<StudentDashboardMetrics | null>(null)

  useEffect(() => {
    if (isReal && user?.id) {
      LearningPersistenceService.getStudentLearningMetrics(user.id)
        .then(setRealMetrics)
        .catch(console.warn)
    }
  }, [isReal, user?.id])

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-border space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider">
          <TrendingUp className="h-4 w-4" />
          <span>Métricas de Aprendizagem & Competências</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Progresso & Horas Ativas
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Dedicação, telemetria ativa, competências e ciclo de revisão espaçada.
        </p>
      </div>

      {/* Indicadores Reais do Aluno (Subfase 4.2) */}
      {isReal && realMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-[#152228] border-[#294149]">
            <CardContent className="p-4 space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#A8BBC0] block">
                XP Transacional
              </span>
              <span className="text-xl font-bold font-mono text-[#01B59A]">
                {realMetrics.totalXp} XP
              </span>
              <span className="text-[10px] text-[#A8BBC0] block">Auditado via Ledger</span>
            </CardContent>
          </Card>
          <Card className="bg-[#152228] border-[#294149]">
            <CardContent className="p-4 space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#A8BBC0] block">
                Tempo Ativo
              </span>
              <span className="text-xl font-bold font-mono text-white">
                {Math.round(realMetrics.totalActiveSeconds / 60)} min
              </span>
              <span className="text-[10px] text-[#A8BBC0] block">Distingue foco de idle</span>
            </CardContent>
          </Card>
          <Card className="bg-[#152228] border-[#294149]">
            <CardContent className="p-4 space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#A8BBC0] block">
                Missões Concluídas
              </span>
              <span className="text-xl font-bold font-mono text-white">
                {realMetrics.completedMissionsCount}
              </span>
              <span className="text-[10px] text-[#A8BBC0] block">Registradas no backend</span>
            </CardContent>
          </Card>
          <Card className="bg-[#152228] border-[#294149]">
            <CardContent className="p-4 space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#A8BBC0] block">
                Revisões Espaçadas
              </span>
              <span className="text-xl font-bold font-mono text-[#C69B4B]">
                {realMetrics.pendingReviewsCount} pendentes
              </span>
              <span className="text-[10px] text-[#A8BBC0] block">Ciclos 1/3/7/14 dias</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Banner de Conformidade */}
      <div className="p-3.5 rounded-xl border border-border bg-card text-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-[#C69B4B] shrink-0" />
          <span>
            {isReal
              ? 'Conectado ao backend Supabase real. Ledger imutável de XP e telemetria atômica ativos.'
              : 'Modo demonstrativo local isolado. As horas ativas são calculadas por estimativa.'}
          </span>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-[10px] text-primary border-primary/30 shrink-0"
        >
          {isReal ? 'Ambiente Real • Supabase' : 'Ambiente Demo Sandbox'}
        </Badge>
      </div>

      {/* Gráficos de Dedicação (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Horas Semanais por Dia */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground">
                Dedicação Diária nesta Semana
              </CardTitle>
              <span className="text-[10px] font-mono text-primary uppercase">Meta: 2h/dia</span>
            </div>
            <CardDescription className="text-xs">
              Horas registradas nos exercícios e vídeos da plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={WEEKLY_STUDY_HOURS}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" stroke="#A8BBC0" fontSize={11} tickLine={false} />
                  <YAxis stroke="#A8BBC0" fontSize={11} tickLine={false} unit="h" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#152228',
                      borderColor: '#294149',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`${val} horas`, 'Tempo Estudado']}
                  />
                  <Bar dataKey="hours" fill="#01B59A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Evolução Acumulada */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground">
                Crescimento Acumulado (Últimas 8 Semanas)
              </CardTitle>
              <span className="text-[10px] font-mono text-[#1D957A] uppercase">Curva Contínua</span>
            </div>
            <CardDescription className="text-xs">
              Horas totais consolidadas ao longo da jornada formativa.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={HISTORICAL_PROGRESS}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#01B59A" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#01B59A" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="week" stroke="#A8BBC0" fontSize={11} tickLine={false} />
                  <YAxis stroke="#A8BBC0" fontSize={11} tickLine={false} unit="h" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#152228',
                      borderColor: '#294149',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`${val} h`, 'Total Acumulado']}
                  />
                  <Area
                    type="monotone"
                    dataKey="accumulated"
                    stroke="#01B59A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAcc)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matriz de Competências Técnicas */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span>Matriz de Competências Avaliadas</span>
            </CardTitle>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">
              Rigor Conceitual
            </span>
          </div>
          <CardDescription className="text-xs">
            Avaliação multidimensional de mecânica, cálculo computacional e postura divergente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMPETENCIES.map((comp, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg border border-border bg-background/50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{comp.name}</span>
                  <span className="font-mono text-primary font-bold">{comp.scorePercent}%</span>
                </div>
                <Progress value={comp.scorePercent} className="h-2 bg-muted" />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Categoria: {comp.category}</span>
                  <span className="text-foreground font-semibold">{comp.level}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Registro das Últimas Sessões de Estudo */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <span>Últimas Sessões de Estudo Registradas</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Histórico de sessões demonstrativas salvas pelo LMS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {RECENT_SESSIONS.map((ses) => (
              <div key={ses.id} className="py-3 flex items-center justify-between text-xs gap-4">
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">{ses.focusArea}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{ses.courseName}</p>
                </div>
                <div className="text-right shrink-0 font-mono text-[11px]">
                  <span className="text-primary font-bold">{ses.durationMinutes} minutos</span>
                  <p className="text-muted-foreground text-[10px]">{ses.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
