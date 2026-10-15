import React from 'react'
import {
  Award,
  Flame,
  Sparkles,
  ShieldCheck,
  Brain,
  Crosshair,
  MessageSquareCheck,
  Lock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ACHIEVEMENTS } from '@/data/demoData'
import { useAuth } from '@/contexts/AuthContext'

export default function AchievementsPage() {
  const { user } = useAuth()

  const earnedAchievements = ACHIEVEMENTS.filter((a) => a.earned)
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
      case 'MessageSquareCheck':
      default:
        return <MessageSquareCheck className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-border space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider">
          <Award className="h-4 w-4" />
          <span>Gamificação Sóbria • Reconhecimento Técnico</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Conquistas & Pontos de Experiência (XP)
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Premiação por rigor metódico, constância e resolução de casos complexos de engenharia.
        </p>
      </div>

      {/* Cartões de Status Superior */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-muted-foreground uppercase">
                Sequência Ativa (Streak)
              </p>
              <h3 className="text-2xl font-bold font-mono text-foreground mt-1 flex items-center gap-1.5">
                <Flame className="h-5 w-5 text-orange-500" />
                <span>{user?.streakDays || 14} Dias</span>
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Estudo ativo sem pausas</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <Flame className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-muted-foreground uppercase">
                XP Técnico Total
              </p>
              <h3 className="text-2xl font-bold font-mono text-primary mt-1">
                {user?.totalXp || 2840} XP
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Nível 04: Analista Estrutural Jr.
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono text-muted-foreground uppercase">
                Medalhas Desbloqueadas
              </p>
              <h3 className="text-2xl font-bold font-mono text-foreground mt-1">
                {earnedAchievements.length} de {ACHIEVEMENTS.length}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {Math.round((earnedAchievements.length / ACHIEVEMENTS.length) * 100)}% do quadro
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-[#C69B4B]/10 text-[#C69B4B] flex items-center justify-center shrink-0">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grade de Conquistas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Quadro de Insígnias e Marcos</h2>
            <p className="text-xs text-muted-foreground">
              Sem efeitos visuais infantis: design sóbrio focado na evolução profissional.
            </p>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">Dados de Demonstração</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map((ach) => (
            <Card
              key={ach.id}
              className={`bg-card border-border transition-all ${
                ach.earned
                  ? 'border-border hover:border-primary/50'
                  : 'opacity-60 border-dashed bg-card/60'
              }`}
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                      ach.earned
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {renderIcon(ach.icon)}
                  </div>

                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={`text-[9px] uppercase font-mono px-1.5 py-0.2 ${
                        ach.rarity === 'Lendária'
                          ? 'border-[#C69B4B] text-[#C69B4B] bg-[#C69B4B]/10'
                          : ach.rarity === 'Épica'
                            ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                            : 'border-border text-muted-foreground'
                      }`}
                    >
                      {ach.rarity}
                    </Badge>
                    <p className="text-[10px] font-mono text-primary mt-1 font-bold">
                      +{ach.xpReward} XP
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <span>{ach.title}</span>
                    {!ach.earned && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {ach.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                  <span>Categoria: {ach.category}</span>
                  {ach.earned ? (
                    <span className="text-[#1D957A] font-semibold">Obtido em {ach.earnedAt}</span>
                  ) : (
                    <span>Bloqueado</span>
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
