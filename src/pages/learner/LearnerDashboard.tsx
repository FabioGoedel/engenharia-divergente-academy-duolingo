import React, { useEffect, useState } from 'react'
import { Sparkles, Flame, Clock, RotateCcw, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { GamificationService } from '@/services/gamificationService'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface NextMissionInfo {
  missionId: string
  title: string
  trackTitle: string
  trackSlug: string
  estimatedMinutes: number
  xpReward: number
  isReview?: boolean
}

interface TrackCardInfo {
  id: string
  title: string
  slug: string
  progressPercent: number
  totalHours: number
}

export default function LearnerDashboard() {
  const { user, authMode } = useAuth()
  const isReal = authMode === 'real' && Boolean(user?.id && !user.id.startsWith('demo-'))
  const userId = user?.id || 'demo-student-user'

  const [loading, setLoading] = useState(true)
  const [totalXp, setTotalXp] = useState(0)
  const [streakDays, setStreakDays] = useState(1)
  const [targetMinutes, setTargetMinutes] = useState(15)
  const [activeTodayMinutes, setActiveTodayMinutes] = useState(0)
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0)
  const [nextMission, setNextMission] = useState<NextMissionInfo | null>(null)
  const [tracks, setTracks] = useState<TrackCardInfo[]>([])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        let currentXp = user?.totalXp || 0
        let currentStreak = user?.streakDays || 1

        if (isReal) {
          // Busca perfil real no Supabase
          const { data: pRow } = await supabase
            .from('profiles')
            .select('total_xp, streak_days')
            .eq('id', userId)
            .maybeSingle()

          if (pRow) {
            currentXp = pRow.total_xp || 0
            currentStreak = pRow.streak_days || 1
          }

          // Busca revisões pendentes reais
          const { count: revCount } = await supabase
            .from('review_schedule')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_pending', true)
          setPendingReviewsCount(revCount || 0)

          // Meta diária e tempo ativo
          const dailyGoal = await GamificationService.getStudentDailyGoal(userId)
          setTargetMinutes(dailyGoal.targetMinutes || 15)
          setActiveTodayMinutes(Math.round((dailyGoal.activeTodaySeconds || 0) / 60))

          // Busca matrículas reais com progresso real calculado de student_activity_progress
          const { data: enrollments } = await (supabase.from('enrollments' as any) as any)
            .select('id, product_id, progress_percent, products(id, title, slug, workload_hours)')
            .eq('user_id', userId)
            .eq('status', 'active')

          if (enrollments && enrollments.length > 0) {
            const list: TrackCardInfo[] = enrollments.map((enr: any) => ({
              id: enr.products?.id || enr.id,
              title: enr.products?.title || 'Trilha de Engenharia',
              slug: enr.products?.slug || 'track-resmat-flexao',
              progressPercent: Number(enr.progress_percent) || 0,
              totalHours: enr.products?.workload_hours || 40,
            }))
            setTracks(list)
            setNextMission({
              missionId: 'mis-resmat-flexao-01',
              title: 'Flexão de Vigas: Tensões Normais & Linha Neutra',
              trackTitle: list[0]?.title || 'Fundamentos de Flexão',
              trackSlug: list[0]?.slug || 'track-resmat-flexao',
              estimatedMinutes: 5,
              xpReward: 20,
            })
          } else {
            // Conta real sem matrícula ainda
            setTracks([])
            setNextMission(null)
          }
        } else {
          // Modo demo
          currentXp = user?.totalXp || 120
          currentStreak = user?.streakDays || 3
          setPendingReviewsCount(1)
          setTargetMinutes(15)
          setActiveTodayMinutes(10)
          setTracks([
            {
              id: 'track-resmat-01',
              title: 'Fundamentos de Flexão & MEF',
              slug: 'track-resmat-flexao',
              progressPercent: 20,
              totalHours: 40,
            },
          ])
          setNextMission({
            missionId: 'mis-resmat-flexao-01',
            title: 'Flexão de Vigas: Linha Neutra e Momento de Inércia',
            trackTitle: 'Fundamentos de Flexão & MEF',
            trackSlug: 'track-resmat-flexao',
            estimatedMinutes: 5,
            xpReward: 20,
          })
        }

        setTotalXp(currentXp)
        setStreakDays(currentStreak)
      } catch (err) {
        console.warn('Erro ao carregar dados do dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId, isReal, user?.totalXp, user?.streakDays])

  const firstName = user?.name?.split(' ')[0] || 'Engenheiro'

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
        <p className="text-xs text-muted-foreground font-medium">Carregando painel...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* =========================================================================
          REGIÃO 1: Saudação Curta
          "Bom dia! Vamos continuar?" — sem repetir nome da plataforma
          ========================================================================= */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Olá, {firstName}! Vamos continuar?
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Sua jornada de raciocínio de engenharia hoje.
        </p>
      </div>

      {/* =========================================================================
          REGIÃO 2: CONTINUAR APRENDENDO (Elemento central e de maior destaque)
          Curso, unidade, próxima missão, tempo estimado, progresso resumido, botão "Continuar"
          ========================================================================= */}
      {nextMission ? (
        <Card className="border-2 border-primary/40 bg-card shadow-lg hover:border-primary transition-all">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                {nextMission.trackTitle}
              </span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {nextMission.estimatedMinutes} min
                </span>
                <span className="flex items-center gap-1 font-mono text-primary font-bold">
                  <Sparkles className="h-3.5 w-3.5" />+{nextMission.xpReward} XP
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                {nextMission.title}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                Próxima missão recomendada para a sua evolução técnica.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-border/40">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span>Pronto para iniciar</span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm px-6 h-11"
                >
                  <Link to={`/app/atividade/${nextMission.missionId}`}>
                    Continuar <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-xs h-11 border-border">
                  <Link to={`/app/trilhas/${nextMission.trackSlug}`}>Ver Trilha</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border bg-card">
          <CardContent className="p-6 text-center space-y-4">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-base font-bold text-foreground">Nenhuma trilha em andamento</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Escolha uma trilha no catálogo para iniciar seus estudos.
              </p>
            </div>
            <Button asChild size="sm" className="bg-primary text-primary-foreground font-bold">
              <Link to="/app/trilhas">Explorar Trilhas</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Se houver revisão prioritária, exibe chamada discreta */}
      {pendingReviewsCount > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-foreground">
              Você tem <strong>{pendingReviewsCount}</strong> exercício(s) para revisão espaçada
              hoje.
            </span>
          </div>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="text-xs text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 font-bold"
          >
            <Link to="/app/revisar">Revisar agora →</Link>
          </Button>
        </div>
      )}

      {/* =========================================================================
          REGIÃO 3: MEU PROGRESSO (Resumo compacto em uma única linha / grid equilibrada)
          XP, sequência de estudo, meta diária, revisões pendentes
          ========================================================================= */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-bold">
          Meu Progresso
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* XP */}
          <div className="p-4 rounded-xl bg-card border border-border/60 space-y-1">
            <span className="text-[10px] uppercase font-mono text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" /> XP Total
            </span>
            <p className="text-xl font-bold font-mono text-foreground">{totalXp}</p>
          </div>

          {/* Sequência (Streak) */}
          <div className="p-4 rounded-xl bg-card border border-border/60 space-y-1">
            <span className="text-[10px] uppercase font-mono text-muted-foreground flex items-center gap-1">
              <Flame className="h-3 w-3 text-amber-500" /> Dias Seguidos
            </span>
            <p className="text-xl font-bold font-mono text-foreground">{streakDays} dias</p>
          </div>

          {/* Meta Diária */}
          <div className="p-4 rounded-xl bg-card border border-border/60 space-y-1">
            <span className="text-[10px] uppercase font-mono text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3 text-primary" /> Meta de Hoje
            </span>
            <p className="text-xl font-bold font-mono text-foreground">
              {activeTodayMinutes}/{targetMinutes} min
            </p>
          </div>

          {/* Revisões */}
          <div className="p-4 rounded-xl bg-card border border-border/60 space-y-1">
            <span className="text-[10px] uppercase font-mono text-muted-foreground flex items-center gap-1">
              <RotateCcw className="h-3 w-3 text-amber-500" /> Revisões
            </span>
            <p className="text-xl font-bold font-mono text-foreground">
              {pendingReviewsCount} pendente{pendingReviewsCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          REGIÃO 4: MINHAS TRILHAS (Trilhas em andamento com acesso rápido)
          Não mostrar dezenas na primeira tela; botão para consultar todas.
          ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-bold">
            Minhas Trilhas
          </h3>
          <Link
            to="/app/trilhas"
            className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
          >
            Consultar todas <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {tracks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tracks.slice(0, 2).map((t) => (
              <Card
                key={t.id}
                className="bg-card border-border hover:border-primary/50 transition-all group"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      {t.title}
                    </h4>
                    <span className="text-xs font-mono font-bold text-primary">
                      {t.progressPercent}%
                    </span>
                  </div>

                  {/* Barra de progresso */}
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${t.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground font-mono">
                      {t.totalHours}h estimadas
                    </span>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary hover:text-primary hover:bg-primary/10 h-8 px-2 font-bold"
                    >
                      <Link to={`/app/trilhas/${t.slug}`}>
                        Abrir trilha <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center text-xs text-muted-foreground">
              Você ainda não iniciou nenhuma trilha.{' '}
              <Link to="/app/trilhas" className="text-primary underline">
                Consulte o catálogo
              </Link>{' '}
              para começar.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
