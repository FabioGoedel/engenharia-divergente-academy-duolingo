import React, { useEffect, useState } from 'react'
import {
  Users,
  BookOpen,
  Award,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminService } from '@/services/adminService'
import { AdminActivityItem } from '@/data/demoData'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [monthly, setMonthly] = useState<any[]>([])
  const [distribution, setDistribution] = useState<any[]>([])
  const [activities, setActivities] = useState<AdminActivityItem[]>([])

  useEffect(() => {
    async function load() {
      const s = await AdminService.getStats()
      const m = await AdminService.getMonthlyGrowth()
      const d = await AdminService.getCourseDistribution()
      const a = await AdminService.getActivityFeed()

      setStats(s)
      setMonthly(m)
      setDistribution(d)
      setActivities(a)
    }
    load()
  }, [])

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-border space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-[#C69B4B] uppercase tracking-wider">
          <ShieldAlert className="h-4 w-4" />
          <span>Área Administrativa • Gestão Global</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Painel de Controle da Academia
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Métricas consolidadas de alunos, matrículas ativas, taxa de conclusão e receita
          demonstrativa.
        </p>
      </div>

      {/* Cartões de Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total de Alunos</p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1 font-mono">
                {stats?.totalStudents || 348}
              </h3>
              <p className="text-[10px] text-[#1D957A] font-mono mt-0.5">86.2% ativos</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Cursos & Trilhas</p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1 font-mono">
                {stats?.publishedCourses || 4}
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">3 pub. / 1 rev.</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Taxa Conclusão Média</p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1 font-mono">
                {stats?.completionRateAverage || 64.5}%
              </h3>
              <p className="text-[10px] text-[#1D957A] font-mono mt-0.5">+4.2% este mês</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#1D957A]/10 text-[#1D957A] flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Receita Mensal (Demo)</p>
              <h3 className="text-xl font-bold tracking-tight text-[#C69B4B] mt-1 font-mono">
                R$ 84.650
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Asaas PENDENTE</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#C69B4B]/10 text-[#C69B4B] flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Admin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Novos Alunos por Mês */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground">
                Novos Alunos Matriculados por Mês
              </CardTitle>
              <span className="text-[10px] font-mono text-primary uppercase">Últimos 6 meses</span>
            </div>
            <CardDescription className="text-xs">
              Evolução das novas contas criadas e ativadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" stroke="#A8BBC0" fontSize={11} tickLine={false} />
                  <YAxis stroke="#A8BBC0" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#152228',
                      borderColor: '#294149',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`${val} novos alunos`, 'Matrículas']}
                  />
                  <Bar dataKey="novos" fill="#01B59A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição por Curso (Pie) */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground">
                Distribuição de Alunos por Curso
              </CardTitle>
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                Proporção
              </span>
            </div>
            <CardDescription className="text-xs">
              Engajamento por vertical de engenharia e especialização.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#152228',
                      borderColor: '#294149',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`${val} inscritos`, 'Alunos']}
                  />
                  <Pie
                    data={distribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              {distribution.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-muted-foreground">{item.name}</span>
                  <strong className="text-foreground font-mono ml-auto">{item.value}</strong>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feed de Atividades Recentes */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#C69B4B]" />
              <span>Feed de Atividades da Plataforma (Auditoria)</span>
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono border-border">
              Eventos Simulados
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Registro cronológico de conclusões, matrículas e certificados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {activities.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between text-xs gap-4">
                <div className="space-y-0.5">
                  <p className="text-foreground">
                    <strong className="text-[#01B59A]">{act.actorName}</strong> {act.action} em{' '}
                    <span className="font-semibold">{act.target}</span>.
                  </p>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {act.timestamp}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] uppercase font-mono border-border text-muted-foreground shrink-0"
                >
                  {act.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
