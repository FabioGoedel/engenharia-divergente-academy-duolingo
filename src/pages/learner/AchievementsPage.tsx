import React, { useEffect, useState } from 'react'
import {
  Award,
  Flame,
  Sparkles,
  ShieldCheck,
  Brain,
  Crosshair,
  MessageSquareCheck,
  Lock,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/AuthContext'
import {
  GamificationService,
  GamificationLevel,
  AchievementItem,
} from '@/services/gamificationService'

export default function AchievementsPage() {
  const { user, authMode } = useAuth()
  const isReal = authMode === 'real' && Boolean(user?.id && !user.id.startsWith('demo-'))
  const userId = user?.id || 'demo-student-user'

  const [loading, setLoading] = useState(true)
  const [achievements, setAchievements] = useState<AchievementItem[]>([])
  const [levels, setLevels] = useState<GamificationLevel[]>([])
  const [levelInfo, setLevelInfo] = useState<{
    currentLevel: GamificationLevel
    nextLevel?: GamificationLevel
    progressPercent: number
    xpToNext: number
  } | null>(null)

  useEffect(() => {
    async function loadAchievements() {
      setLoading(true)
      try {
        const [lvlList, achList] = await Promise.all([
          GamificationService.listLevels(),
          GamificationService.listAchievementsForStudent(userId),
        ])

        setLevels(lvlList)
        setAchievements(achList)

        const totalXp = user?.totalXp || 0
        const calc = GamificationService.calculateLevelFromXp(totalXp, lvlList)
        setLevelInfo(calc)

        // Se for usuário real, checa se tem conquistas elegíveis pendentes
        if (isReal && user?.id) {
          GamificationService.checkAndAwardEligibleAchievements(user.id).then((newOnes) => {
            if (newOnes.length) {
              GamificationService.listAchievementsForStudent(user.id).then(setAchievements)
            }
          })
        }
      } catch (err) {
        console.warn('Erro ao carregar conquistas:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAchievements()
  }, [userId, isReal, user?.totalXp])

  const earnedAchievements = achievements.filter((a) => a.earned)
  const earnedXp = earnedAchievements.reduce((acc, curr) => acc + curr.xpReward, 0)

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Brain':
        return <Brain className="h-5 w-5" />
      case 'Flame':
        return <Flame className="h-5 w-5" />
      case 'Crosshair':
        return <Crosshair className="h-5 w-5" />
      case 'ShieldCheck':
        return <ShieldCheck className="h-5 w-5" />
      case 'CheckCircle2':
        return <CheckCircle2 className="h-5 w-5" />
      case 'RotateCcw':
        return <RotateCcw className="h-5 w-5" />
      case 'Sparkles':
        return <Sparkles className="h-5 w-5" />
      default:
        return <Award className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#01B59A] border-t-transparent mx-auto" />
        <p className="text-xs font-mono text-[#A8BBC0] uppercase tracking-wider">
          Carregando catálogo de conquistas e níveis...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-[#294149] space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-[#01B59A] uppercase tracking-wider">
          <Award className="h-4 w-4" />
          <span>Gamificação Sóbria • Reconhecimento Técnico Profissional</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Níveis, Insígnias & Pontos de Experiência (XP)
        </h1>
        <p className="text-xs md:text-sm text-[#A8BBC0]">
          Reconhecimento fundamentado no método de cálculo, constância e resolução de casos
          complexos. Sem placares públicos ou comparações predatórias.
        </p>
      </div>

      {/* Cartões de Status Superior */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sequência Ativa */}
        <Card className="bg-[#152228] border-[#294149]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-[#A8BBC0] uppercase">
                Sequência Ativa (Streak)
              </p>
              <h3 className="text-2xl font-bold font-mono text-white mt-1 flex items-center gap-1.5">
                <Flame className="h-5 w-5 text-orange-400" />
                <span>{user?.streakDays || 1} Dias</span>
              </h3>
              <p className="text-[11px] text-[#A8BBC0] mt-0.5">Estudo ativo e focado</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
              <Flame className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Nível Técnico e XP */}
        <Card className="bg-[#152228] border-[#294149]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-[#A8BBC0] uppercase">XP Técnico Auditável</p>
              <h3 className="text-2xl font-bold font-mono text-[#01B59A] mt-1">
                {user?.totalXp || 0} XP
              </h3>
              <p className="text-[11px] text-[#A8BBC0] mt-0.5">
                {levelInfo
                  ? `Nível ${levelInfo.currentLevel.levelNumber}: ${levelInfo.currentLevel.title}`
                  : 'Iniciante'}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-[#01B59A]/15 text-[#01B59A] flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Conquistas Desbloqueadas */}
        <Card className="bg-[#152228] border-[#294149]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-[#A8BBC0] uppercase">
                Insígnias Desbloqueadas
              </p>
              <h3 className="text-2xl font-bold font-mono text-white mt-1">
                {earnedAchievements.length} de {achievements.length}
              </h3>
              <p className="text-[11px] text-[#A8BBC0] mt-0.5">
                {achievements.length > 0
                  ? `${Math.round((earnedAchievements.length / achievements.length) * 100)}% do quadro completo`
                  : 'Carregando quadro'}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-[#C69B4B]/15 text-[#C69B4B] flex items-center justify-center shrink-0">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Régua de Níveis Técnicos Configuráveis */}
      {levelInfo && (
        <Card className="bg-[#0C1317] border-[#294149]">
          <CardHeader className="pb-3 border-b border-[#294149]/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#01B59A]" />
                  <span>Jornada de Níveis Técnicos</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#A8BBC0]">
                  Progresso contínuo de carreira sem rebaixamentos punitivos.
                </CardDescription>
              </div>
              <span className="text-xs font-mono text-[#01B59A]">
                Progresso: {levelInfo.progressPercent}%
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <Progress value={levelInfo.progressPercent} className="h-2 bg-[#152228]" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
              {levels.map((lvl) => {
                const isCurrent = lvl.levelNumber === levelInfo.currentLevel.levelNumber
                const isPassed = (user?.totalXp || 0) >= lvl.minXp

                return (
                  <div
                    key={lvl.id}
                    className={`p-2.5 rounded-xl border text-xs font-mono transition-all ${
                      isCurrent
                        ? 'border-[#01B59A] bg-[#01B59A]/15 ring-2 ring-[#01B59A]/30 text-white'
                        : isPassed
                          ? 'border-[#01B59A]/40 bg-[#152228] text-[#01B59A]'
                          : 'border-[#294149] bg-[#0C1317] text-[#A8BBC0] opacity-60'
                    }`}
                  >
                    <span className="text-[10px] block font-bold">Nível {lvl.levelNumber}</span>
                    <p className="font-semibold truncate text-[11px] text-white mt-0.5">
                      {lvl.title}
                    </p>
                    <span className="text-[9px] text-[#A8BBC0] block mt-1">{lvl.minXp} XP</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grade de Conquistas Reais */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">
              Quadro de Insígnias e Marcos de Engenharia
            </h2>
            <p className="text-xs text-[#A8BBC0]">
              Design sóbrio para engenheiros. Reconhece cálculo independente, revisões espaçadas e
              constância.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-[#01B59A]/40 text-[#01B59A] font-mono text-[10px]"
          >
            Supabase Ledger Sincronizado
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => (
            <Card
              key={ach.id}
              className={`transition-all ${
                ach.earned
                  ? 'bg-[#152228] border-[#294149] hover:border-[#01B59A]/60'
                  : 'bg-[#0C1317]/80 border-dashed border-[#294149]/60 opacity-60'
              }`}
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                      ach.earned
                        ? 'bg-[#01B59A]/15 text-[#01B59A] border border-[#01B59A]/30'
                        : 'bg-[#152228] text-[#A8BBC0] border border-[#294149]'
                    }`}
                  >
                    {renderIcon(ach.iconName)}
                  </div>

                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={`text-[9px] uppercase font-mono px-1.5 py-0.2 ${
                        ach.rarity === 'Lendária'
                          ? 'border-[#C69B4B] text-[#C69B4B] bg-[#C69B4B]/10'
                          : ach.rarity === 'Épica'
                            ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                            : 'border-[#294149] text-[#A8BBC0]'
                      }`}
                    >
                      {ach.rarity}
                    </Badge>
                    <p className="text-[10px] font-mono text-[#01B59A] mt-1 font-bold">
                      +{ach.xpReward} XP
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>{ach.title}</span>
                    {!ach.earned && <Lock className="h-3 w-3 text-[#A8BBC0]" />}
                  </h3>
                  <p className="text-xs text-[#A8BBC0] mt-1 leading-relaxed">{ach.description}</p>
                </div>

                <div className="pt-2 border-t border-[#294149] flex items-center justify-between text-[10px] font-mono text-[#A8BBC0]">
                  <span>Categoria: {ach.category}</span>
                  {ach.earned ? (
                    <span className="text-[#01B59A] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Conquistada
                    </span>
                  ) : (
                    <span>
                      Requer {ach.conditionThreshold} {ach.conditionType.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
