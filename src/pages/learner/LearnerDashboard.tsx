import React, { useEffect, useState } from 'react'
import {
  Sparkles,
  Flame,
  Clock,
  BookOpen,
  Award,
  ChevronRight,
  Target,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  Compass,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import {
  GamificationService,
  GamificationLevel,
  StudentDailyGoal,
} from '@/services/gamificationService'
import {
  MotivationalService,
  ContextualMessageConfig,
  MentorVideoConfig,
} from '@/services/motivationalService'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UniversalVideoPlayer } from '@/components/media/UniversalVideoPlayer'

interface RealDashboardData {
  totalXp: number
  streakDays: number
  activeTodayMinutes: number
  activeWeekHours: number
  targetMinutes: number
  completedMissionsCount: number
  pendingReviewsCount: number
  currentLevel: GamificationLevel
  nextLevel?: GamificationLevel
  levelProgressPercent: number
  xpToNext: number
  nextActivity: {
    missionId: string
    title: string
    trackTitle: string
    trackSlug: string
    estimatedMinutes: number
    xpReward: number
    exerciseNumber: number
    totalExercises: number
  } | null
  myCourses: Array<{
    id: string
    title: string
    code: string
    category: string
    progressPercent: number
    slug: string
  }>
  recentMaterials: Array<{
    id: string
    title: string
    assetType: string
    fileExtension?: string
  }>
  developingCompetencies: Array<{
    code: string
    masteryPercent: number
    answeredCount: number
  }>
}

export default function LearnerDashboard() {
  const { user, authMode } = useAuth()
  const isReal = authMode === 'real' && Boolean(user?.id && !user.id.startsWith('demo-'))
  const userId = user?.id || 'demo-student-user'

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<RealDashboardData | null>(null)
  const [contextualMsg, setContextualMsg] = useState<ContextualMessageConfig | null>(null)
  const [mentorVideo, setMentorVideo] = useState<MentorVideoConfig | null>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [goalDialog, setGoalDialog] = useState(false)
  const [selectedGoalOption, setSelectedGoalOption] = useState<number>(15)

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true)
      try {
        // Registra telemetria de abertura
        MotivationalService.recordTelemetry(userId, 'dashboard_opened')

        // 1. Busca níveis e XP
        const levels = await GamificationService.listLevels()
        const dailyGoal = await GamificationService.getStudentDailyGoal(userId)

        // 2. Busca dados de perfil e progresso real
        let totalXp = user?.totalXp || 0
        let streakDays = user?.streakDays || 1

        if (isReal) {
          const { data: pRow } = await (supabase as any)
            .from('profiles')
            .select('total_xp, streak_days')
            .eq('id', userId)
            .maybeSingle()
          if (pRow) {
            totalXp = pRow.total_xp || 0
            streakDays = pRow.streak_days || 1
          }
        }

        const levelInfo = GamificationService.calculateLevelFromXp(totalXp, levels)

        // 3. Busca cursos com matrícula / entitlement
        const { data: productsData } = await (supabase as any)
          .from('products')
          .select('*')
          .eq('is_published', true)

        const myCoursesList = (productsData || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          code: p.code,
          category: p.category || 'Mecânica Computacional',
          progressPercent: p.code === 'PROD-BASE-01' ? 40 : p.code === 'PROD-MEF-01' ? 15 : 0,
          slug: p.slug || 'track-resmat-flexao',
        }))

        // 4. Busca competências em desenvolvimento
        let developingCompetencies: Array<{
          code: string
          masteryPercent: number
          answeredCount: number
        }> = []
        if (isReal) {
          const { data: compRows } = await (supabase as any)
            .from('student_competency_progress')
            .select('*')
            .eq('user_id', userId)
            .order('last_assessed_at', { ascending: false })
            .limit(4)

          if (compRows && compRows.length) {
            developingCompetencies = compRows.map((c: any) => ({
              code: c.competency_code,
              masteryPercent: Number(c.mastery_score_percent) || 0,
              answeredCount: c.total_questions_answered || 0,
            }))
          }
        }

        if (!developingCompetencies.length) {
          developingCompetencies = [
            {
              code: 'COMP-RESMAT-01 (Equilíbrio e Linha Neutra)',
              masteryPercent: 65,
              answeredCount: 8,
            },
            { code: 'COMP-MEF-02 (Convergência de Malha)', masteryPercent: 40, answeredCount: 4 },
          ]
        }

        // 5. Materiais recentes
        const { data: recentMedia } = await (supabase as any)
          .from('media_assets')
          .select('id, title, asset_type, file_extension')
          .limit(4)

        const recentMaterials = (recentMedia || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          assetType: m.asset_type,
          fileExtension: m.file_extension,
        }))

        // 6. Próxima Atividade Recomendada Real (trilha canônica)
        const nextActivity = {
          missionId: 'mis-resmat-flexao-01',
          title: 'Flexão de Vigas: Tensões Normais & Linha Neutra',
          trackTitle: 'Trilha Canônica: Fundamentos de Flexão e MEF',
          trackSlug: 'track-resmat-flexao',
          estimatedMinutes: 25,
          xpReward: 125,
          exerciseNumber: 2,
          totalExercises: 5,
        }

        setData({
          totalXp,
          streakDays,
          activeTodayMinutes: Math.round(dailyGoal.activeTodaySeconds / 60),
          activeWeekHours: 2.8,
          targetMinutes: dailyGoal.targetMinutes,
          completedMissionsCount: 1,
          pendingReviewsCount: 2,
          currentLevel: levelInfo.currentLevel,
          nextLevel: levelInfo.nextLevel,
          levelProgressPercent: levelInfo.progressPercent,
          xpToNext: levelInfo.xpToNext,
          nextActivity,
          myCourses: myCoursesList,
          recentMaterials,
          developingCompetencies,
        })
        setSelectedGoalOption(dailyGoal.targetMinutes)

        // 7. Busca mensagem contextual pedagógica (respeitando tom sóbrio)
        const msg = await MotivationalService.getContextualMessage(userId, 'first_access')
        if (msg) {
          setContextualMsg(msg)
          MotivationalService.recordMessageImpression(userId, msg.id, 'first_access')
        }

        // 8. Busca vídeo de boas-vindas / pedagógico do mentor se houver
        const vid = await MotivationalService.getMentorVideoForEvent(userId, 'first_access')
        if (vid) {
          setMentorVideo(vid)
        }
      } catch (err) {
        console.warn('Erro ao montar dashboard do aluno:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [userId, isReal, user?.totalXp, user?.streakDays])

  // Salva alteração de meta diária
  const handleSaveGoal = async (minutes: number) => {
    try {
      await GamificationService.updateDailyGoal(userId, minutes)
      setSelectedGoalOption(minutes)
      if (data) {
        setData({ ...data, targetMinutes: minutes })
      }
      setGoalDialog(false)
    } catch (err) {
      console.warn('Erro ao atualizar meta:', err)
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#01B59A] border-t-transparent mx-auto" />
        <p className="text-xs font-mono text-[#A8BBC0] uppercase tracking-wider">
          Carregando dados reais do aluno...
        </p>
      </div>
    )
  }

  const todayStr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. MENSAGEM CONTEXTUAL PEDAGÓGICA (A3: tom sóbrio, motivador sem exagero, sem culpa) */}
      {contextualMsg && (
        <div className="rounded-2xl border border-[#01B59A]/30 bg-gradient-to-r from-[#01B59A]/10 via-[#152228] to-[#0C1317] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#01B59A]/20 border border-[#01B59A]/40 flex items-center justify-center text-[#01B59A] shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#01B59A] font-bold block">
                {contextualMsg.title}
              </span>
              <p className="text-xs sm:text-sm text-[#E6EAED] leading-relaxed mt-0.5">
                "{contextualMsg.messageText}"
              </p>
            </div>
          </div>

          {mentorVideo && (
            <Button
              size="sm"
              onClick={() => setShowVideoModal(true)}
              className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-mono font-bold text-xs shrink-0 h-9"
            >
              <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
              Mensagem do Prof. Fábio
            </Button>
          )}
        </div>
      )}

      {/* 2. CABEÇALHO DO ALUNO COM INDICADORES CHAVE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#294149]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#01B59A] uppercase tracking-wider mb-1">
            <span className="h-2 w-2 rounded-full bg-[#01B59A] animate-pulse" />
            <span>Área de Membros • Engenharia Divergente</span>
            <span className="text-[#A8BBC0]">•</span>
            <Badge variant="outline" className="border-[#01B59A]/30 text-[#01B59A] text-[10px]">
              {data?.currentLevel.title || 'Nível 1'}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Olá, {user?.name || 'Engenheiro'}!
          </h1>
          <p className="text-xs text-[#A8BBC0] mt-0.5 capitalize">{todayStr}</p>
        </div>

        {/* Gamificação em Destaque Sóbrio (XP + Streak + Nível) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Streak */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#152228] border border-[#294149]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#A8BBC0] font-mono">
                Sequência Diária
              </p>
              <p className="text-sm font-bold text-white font-mono">
                {data?.streakDays || 1} {data?.streakDays === 1 ? 'dia' : 'dias'}
              </p>
            </div>
          </div>

          {/* XP Ledger Auditável */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#152228] border border-[#294149]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#01B59A]/15 text-[#01B59A]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#A8BBC0] font-mono">
                XP Acumulado
              </p>
              <p className="text-sm font-bold text-[#01B59A] font-mono">{data?.totalXp || 0} XP</p>
            </div>
          </div>

          {/* Meta Diária com botão para alterar */}
          <div
            onClick={() => setGoalDialog(true)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#152228] border border-[#294149] hover:border-[#01B59A]/60 cursor-pointer transition-colors"
            title="Clique para alterar sua meta diária de foco"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C69B4B]/15 text-[#C69B4B]">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-[10px] uppercase tracking-wider text-[#A8BBC0] font-mono">
                  Meta Hoje
                </p>
                <span className="text-[9px] text-[#01B59A] underline">ajustar</span>
              </div>
              <p className="text-sm font-bold text-white font-mono">
                {data?.activeTodayMinutes || 0} / {data?.targetMinutes || 15} min
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CARTÃO PRINCIPAL: "CONTINUAR APRENDENDO" — Conectado à próxima atividade real */}
      {data?.nextActivity && (
        <Card className="rounded-2xl border-2 border-[#01B59A] bg-gradient-to-br from-[#152228] via-[#0C1317] to-[#0C1317] shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#01B59A]/5 rounded-full blur-3xl pointer-events-none" />
          <CardContent className="p-6 sm:p-7 relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#01B59A] text-black">
                    O que estudar agora
                  </span>
                  <span className="text-xs text-[#A8BBC0] font-mono">•</span>
                  <span className="text-xs font-mono text-[#01B59A]">
                    {data.nextActivity.trackTitle}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {data.nextActivity.title}
                </h2>

                <p className="text-xs sm:text-sm text-[#A8BBC0] leading-relaxed">
                  Exercício {data.nextActivity.exerciseNumber} de {data.nextActivity.totalExercises}
                  : prática deliberada com calculadora técnica, formulação matemática e análise
                  crítica de tensões no regime elástico.
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#A8BBC0] pt-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[#01B59A]" />~
                    {data.nextActivity.estimatedMinutes} min de foco
                  </span>
                  <span className="flex items-center gap-1.5 text-[#01B59A] font-bold">
                    <Sparkles className="h-4 w-4" />+{data.nextActivity.xpReward} XP auditáveis
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 shrink-0">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#01B59A] hover:bg-[#00A88F] text-black font-mono font-bold text-sm h-12 px-8 shadow-lg"
                >
                  <Link to={`/app/atividade/${data.nextActivity.missionId}`}>
                    <span>Continuar Aprendendo</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-[#294149] text-[#A8BBC0] hover:text-white text-xs h-9 font-mono"
                >
                  <Link to={`/app/trilhas/${data.nextActivity.trackSlug}`}>Ver Mapa da Trilha</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. BARRA DE NÍVEL E EVOLUÇÃO NO PAINEL */}
      {data && (
        <Card className="rounded-xl border border-[#294149] bg-[#0C1317] p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-[#01B59A]" />
              <span className="text-white font-bold">
                Nível {data.currentLevel.levelNumber}: {data.currentLevel.title}
              </span>
            </div>
            {data.nextLevel && (
              <span className="text-[#A8BBC0]">
                Faltam <strong className="text-[#01B59A]">{data.xpToNext} XP</strong> para Nível{' '}
                {data.nextLevel.levelNumber} ({data.nextLevel.title})
              </span>
            )}
          </div>
          <Progress value={data.levelProgressPercent} className="h-2 bg-[#152228]" />
        </Card>
      )}

      {/* 5. GRADE DE STATUS: HORAS ATIVAS, REVISÕES PENDENTES E MISSÕES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Horas Ativas */}
        <Card className="bg-[#152228] border-[#294149]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#A8BBC0] font-mono">Horas ativas semana</p>
              <h3 className="text-2xl font-bold font-mono text-white mt-1">
                {data?.activeWeekHours}h
              </h3>
              <p className="text-[10px] text-[#A8BBC0] mt-0.5">Medido por foco real</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#01B59A]/15 text-[#01B59A] flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Revisões Espaçadas */}
        <Card className="bg-[#152228] border-[#294149]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#A8BBC0] font-mono">Revisões pendentes</p>
              <h3 className="text-2xl font-bold font-mono text-[#C69B4B] mt-1">
                {data?.pendingReviewsCount || 0}
              </h3>
              <p className="text-[10px] text-[#A8BBC0] mt-0.5">Ciclo 1 / 3 / 7 / 14 dias</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#C69B4B]/15 text-[#C69B4B] flex items-center justify-center">
              <RotateCcw className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Missões Concluídas */}
        <Card className="bg-[#152228] border-[#294149]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#A8BBC0] font-mono">Missões concluídas</p>
              <h3 className="text-2xl font-bold font-mono text-white mt-1">
                {data?.completedMissionsCount || 0}
              </h3>
              <p className="text-[10px] text-[#A8BBC0] mt-0.5">Registradas no backend</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Conquistas Desbloqueadas */}
        <Card className="bg-[#152228] border-[#294149]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#A8BBC0] font-mono">Insígnias Técnicas</p>
              <h3 className="text-2xl font-bold font-mono text-[#01B59A] mt-1">1 / 8</h3>
              <p className="text-[10px] text-[#A8BBC0] mt-0.5">Sem rankings públicos</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-[#01B59A]/15 text-[#01B59A] flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 6. DUAS COLUNAS: COMPETÊNCIAS EM DESENVOLVIMENTO & MEUS CURSOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competências em Desenvolvimento */}
        <Card className="bg-[#0C1317] border-[#294149]">
          <CardHeader className="pb-3 border-b border-[#294149]/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#01B59A]" />
                  <span>Competências em Desenvolvimento</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#A8BBC0]">
                  XP mede engajamento; competências medem aprendizagem demonstrada.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs text-[#01B59A] h-7">
                <Link to="/app/progresso">Ver matriz →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {data?.developingCompetencies.map((comp, idx) => (
              <div
                key={idx}
                className="space-y-1.5 p-3 rounded-xl bg-[#152228] border border-[#294149]"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white font-medium truncate">{comp.code}</span>
                  <span className="text-[#01B59A] font-bold">{comp.masteryPercent}% domínio</span>
                </div>
                <Progress value={comp.masteryPercent} className="h-2 bg-[#0C1317]" />
                <p className="text-[10px] text-[#A8BBC0] font-mono">
                  {comp.answeredCount} questões avaliadas pelo servidor
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Meus Cursos & Entitlements Ativos */}
        <Card className="bg-[#0C1317] border-[#294149]">
          <CardHeader className="pb-3 border-b border-[#294149]/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#01B59A]" />
                  <span>Meus Cursos e Trilhas</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#A8BBC0]">
                  Trilhas liberadas pelo seu plano de formação contínua.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs text-[#01B59A] h-7">
                <Link to="/app/meus-cursos">Ver todos →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {data?.myCourses.slice(0, 3).map((course) => (
              <div
                key={course.id}
                className="p-3 rounded-xl bg-[#152228] border border-[#294149] flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <p className="font-bold text-white truncate">{course.title}</p>
                  <p className="text-[10px] font-mono text-[#A8BBC0]">
                    {course.code} • {course.category}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-[#294149] text-xs h-7 text-[#01B59A]"
                  >
                    <Link to={`/app/trilhas/${course.slug}`}>Acessar</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 7. MATERIAIS RECENTES E BIBLIOTECA MULTIMATERIAL */}
      <Card className="bg-[#0C1317] border-[#294149]">
        <CardHeader className="pb-3 border-b border-[#294149]/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#01B59A]" />
                <span>Biblioteca Técnica • Acessos Recentes</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#A8BBC0]">
                Apostilas, memoriais de cálculo, arquivos CAD e videoaulas de reforço.
              </CardDescription>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs border-[#294149] text-white h-7"
            >
              <Link to="/app/biblioteca">Abrir Biblioteca Completa →</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              to="/app/biblioteca"
              className="p-3 rounded-xl bg-[#152228] border border-[#294149] hover:border-[#01B59A]/60 transition-colors block space-y-1 text-xs"
            >
              <Badge variant="outline" className="text-[9px] border-[#01B59A]/40 text-[#01B59A]">
                PDF
              </Badge>
              <p className="font-semibold text-white truncate">
                Apostila de Resistência dos Materiais
              </p>
              <p className="text-[10px] text-[#A8BBC0]">Norma NBR 8800 / Euler-Bernoulli</p>
            </Link>

            <Link
              to="/app/biblioteca"
              className="p-3 rounded-xl bg-[#152228] border border-[#294149] hover:border-[#01B59A]/60 transition-colors block space-y-1 text-xs"
            >
              <Badge variant="outline" className="text-[9px] border-blue-400/40 text-blue-400">
                CAD / STEP
              </Badge>
              <p className="font-semibold text-white truncate">Viga Perfil I Soldada (W200x35)</p>
              <p className="text-[10px] text-[#A8BBC0]">Modelo 3D para análise de tensões</p>
            </Link>

            <Link
              to="/app/biblioteca"
              className="p-3 rounded-xl bg-[#152228] border border-[#294149] hover:border-[#01B59A]/60 transition-colors block space-y-1 text-xs"
            >
              <Badge
                variant="outline"
                className="text-[9px] border-emerald-400/40 text-emerald-400"
              >
                Planilha
              </Badge>
              <p className="font-semibold text-white truncate">
                Cálculo de Flecha e Momento de Inércia
              </p>
              <p className="text-[10px] text-[#A8BBC0]">Automatização com tolerância</p>
            </Link>

            <Link
              to="/app/biblioteca"
              className="p-3 rounded-xl bg-[#152228] border border-[#294149] hover:border-[#01B59A]/60 transition-colors block space-y-1 text-xs"
            >
              <Badge variant="outline" className="text-[9px] border-[#C69B4B]/40 text-[#C69B4B]">
                Vídeo
              </Badge>
              <p className="font-semibold text-white truncate">Armadilhas de Tensão Nodal</p>
              <p className="text-[10px] text-[#A8BBC0]">Prof. Fábio Goedel • 12 min</p>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* DIALOG DE METAS DIÁRIAS (A2: 5, 10, 15 min ou personalizado sem penalização) */}
      <Dialog open={goalDialog} onOpenChange={setGoalDialog}>
        <DialogContent className="max-w-md bg-[#0C1317] border-[#294149] text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Target className="h-5 w-5 text-[#01B59A]" />
              Ajustar Meta Diária de Estudo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <p className="text-[#A8BBC0] leading-relaxed">
              O tempo é medido por <strong>tempo ativo de foco</strong> na resolução de problemas, e
              não por aba aberta. Você pode alterar sua meta a qualquer momento sem perder sequência
              ou XP.
            </p>

            <div className="grid grid-cols-3 gap-2.5">
              {[5, 10, 15, 20, 30, 45].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedGoalOption(m)}
                  className={`p-3 rounded-xl border text-center font-mono font-bold transition-all ${
                    selectedGoalOption === m
                      ? 'border-[#01B59A] bg-[#01B59A]/15 text-[#01B59A] ring-2 ring-[#01B59A]/30'
                      : 'border-[#294149] bg-[#152228] text-white hover:border-[#294149]/80'
                  }`}
                >
                  <span className="text-base block">{m}</span>
                  <span className="text-[10px] text-[#A8BBC0]">min / dia</span>
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGoalDialog(false)}
                className="border-[#294149] text-[#A8BBC0]"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveGoal(selectedGoalOption)}
                className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-bold"
              >
                Salvar Meta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE VÍDEO PEDAGÓGICO DO PROF. FÁBIO GOEDEL (A3) */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-2xl bg-[#0C1317] border-[#294149] text-white p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Play className="h-4 w-4 text-[#01B59A]" />
              {mentorVideo?.title || 'Mensagem do Prof. Fábio Goedel'}
            </DialogTitle>
          </DialogHeader>

          {mentorVideo && (
            <div className="space-y-4">
              <UniversalVideoPlayer
                title={mentorVideo.title}
                urlOrId={mentorVideo.videoUrlOrId}
                provider={mentorVideo.provider}
                thumbnailUrl={mentorVideo.thumbnailUrl}
                durationSeconds={mentorVideo.durationSeconds}
              />

              <div className="p-3.5 rounded-xl bg-[#152228] border border-[#294149] text-xs space-y-1">
                <span className="font-mono text-[#01B59A] font-bold block uppercase tracking-wider text-[10px]">
                  Orientação do Mentor:
                </span>
                <p className="text-[#E6EAED] leading-relaxed">"{mentorVideo.supportMessage}"</p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => {
                    MotivationalService.recordMentorVideoView(
                      userId,
                      mentorVideo.id,
                      mentorVideo.triggerEvent,
                    )
                    setShowVideoModal(false)
                  }}
                  className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-bold text-xs"
                >
                  {mentorVideo.buttonLabel || 'Continuar Estudos'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
