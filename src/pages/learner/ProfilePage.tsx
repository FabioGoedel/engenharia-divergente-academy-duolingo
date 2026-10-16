import React, { useState, useEffect } from 'react'
import {
  User as UserIcon,
  ShieldCheck,
  Award,
  Clock,
  Sparkles,
  Save,
  CheckCircle2,
  Database,
  Lock,
  AlertCircle,
  Sliders,
  Bell,
  Volume2,
  PlaySquare,
  ShieldAlert,
  Moon,
  Sun,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { AuthService } from '@/services/authService'
import { MotivationalService, StudentPreferences } from '@/services/motivationalService'

export default function ProfilePage() {
  const { user, authMode, refreshUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  const [name, setName] = useState(user?.name || '')
  const [headline, setHeadline] = useState(user?.headline || '')
  const [crea, setCrea] = useState(user?.creaNumber || '')
  const [isSaving, setIsSaving] = useState(false)

  // Preferências do Aluno (Fase 5 A4)
  const [preferences, setPreferences] = useState<StudentPreferences>({
    theme: 'dark',
    reducedMotion: false,
    dailyGoalMinutes: 15,
    motivationalMessagesEnabled: true,
    motivationalFrequency: 'balanced',
    pedagogicalNotificationsEnabled: true,
    soundEffectsEnabled: true,
    videoAutoplay: false,
    videoDefaultSpeed: 1.0,
    commercialMarketingOptIn: false,
    partnerOffersOptIn: false,
  })

  useEffect(() => {
    if (user) {
      setName(user.name)
      setHeadline(user.headline || '')
      setCrea(user.creaNumber || '')
    }

    if (user?.id) {
      MotivationalService.getStudentPreferences(user.id).then((p) => {
        setPreferences(p)
      })
    }
  }, [user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const result = await AuthService.updateProfile({
        name,
        headline,
        creaNumber: crea,
      })

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar perfil',
          description: result.error,
        })
        return
      }

      // Salva preferências no Supabase
      if (user?.id) {
        await MotivationalService.saveStudentPreferences(user.id, preferences)
      }

      await refreshUser()
      toast({
        title: 'Perfil e preferências atualizados!',
        description: 'Dados profissionais e configurações persistidos no Supabase.',
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o perfil.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-[#294149] space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-[#01B59A] uppercase tracking-wider">
          <UserIcon className="h-4 w-4" />
          <span>Configurações Pessoais, Registro & Preferências</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Meu Perfil & Preferências
        </h1>
        <p className="text-xs md:text-sm text-[#A8BBC0]">
          Gerencie dados profissionais, CREA, metas de estudo e controle rigoroso de comunicações.
        </p>
      </div>

      {/* Cartão de Resumo */}
      <Card className="bg-[#152228] border-[#294149]">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-[#01B59A]/20 text-[#01B59A] border-2 border-[#01B59A]/40 flex items-center justify-center font-bold text-xl shrink-0">
              {user?.name
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'ED'}
            </div>

            <div className="space-y-1 text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <Badge className="bg-[#01B59A]/20 text-[#01B59A] border-[#01B59A]/30 text-[10px] uppercase font-mono">
                    {user?.role}
                  </Badge>
                  {authMode === 'real' ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] font-mono"
                    >
                      Supabase Conectado
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 text-amber-400 bg-amber-500/10 text-[10px] font-mono"
                    >
                      Modo Demo Isolado
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#A8BBC0]">{user?.headline}</p>
              <p className="text-xs text-[#A8BBC0] font-mono">
                E-mail: <strong>{user?.email}</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Formulário de Dados Profissionais */}
        <Card className="bg-[#0C1317] border-[#294149]">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">
              Dados Profissionais & Matrícula
            </CardTitle>
            <CardDescription className="text-xs text-[#A8BBC0]">
              Mantenha seu CREA atualizado para correta emissão de certificados e validação de
              competências.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prof-name" className="text-xs font-semibold text-white">
                  Nome Completo
                </Label>
                <Input
                  id="prof-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#152228] border-[#294149] text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prof-email" className="text-xs font-semibold text-white">
                  E-mail institucional
                </Label>
                <Input
                  id="prof-email"
                  value={user?.email || ''}
                  disabled
                  className="bg-[#152228]/50 border-[#294149] text-xs text-[#A8BBC0] font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prof-headline" className="text-xs font-semibold text-white">
                  Especialidade / Headline
                </Label>
                <Input
                  id="prof-headline"
                  placeholder="Ex.: Engenheiro Mecânico • Foco em Análise Estrutural"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="bg-[#152228] border-[#294149] text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prof-crea" className="text-xs font-semibold text-white">
                  Registro Profissional (CREA / CFT)
                </Label>
                <Input
                  id="prof-crea"
                  placeholder="Ex.: SP-2021104829"
                  value={crea}
                  onChange={(e) => setCrea(e.target.value)}
                  className="bg-[#152228] border-[#294149] text-xs text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PREFERÊNCIAS DE APRENDIZAGEM & ACESSIBILIDADE (Fase 5 A4) */}
        <Card className="bg-[#0C1317] border-[#294149]">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#01B59A]" />
              <span>Experiência de Estudo & Acessibilidade</span>
            </CardTitle>
            <CardDescription className="text-xs text-[#A8BBC0]">
              Personalize o ambiente de aprendizagem para foco máximo sem distrações.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Movimento Reduzido */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#152228] border border-[#294149]">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">
                  Movimento Reduzido (Acessibilidade)
                </span>
                <span className="text-[11px] text-[#A8BBC0]">
                  Desativa animações de transição de nós e confetes de conclusão
                </span>
              </div>
              <Switch
                checked={preferences.reducedMotion}
                onCheckedChange={(val) => setPreferences({ ...preferences, reducedMotion: val })}
              />
            </div>

            {/* Mensagens Motivacionais Pedagógicas */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#152228] border border-[#294149]">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">
                  Mensagens Contextuais do Mentor
                </span>
                <span className="text-[11px] text-[#A8BBC0]">
                  Orientações técnicas sóbrias ao atingir marcos ou revisões
                </span>
              </div>
              <Switch
                checked={preferences.motivationalMessagesEnabled}
                onCheckedChange={(val) =>
                  setPreferences({ ...preferences, motivationalMessagesEnabled: val })
                }
              />
            </div>

            {/* Reprodução de Vídeos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#152228] border border-[#294149]">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">Reprodução Automática</span>
                  <span className="text-[11px] text-[#A8BBC0]">Autoplay em vídeos de apoio</span>
                </div>
                <Switch
                  checked={preferences.videoAutoplay}
                  onCheckedChange={(val) => setPreferences({ ...preferences, videoAutoplay: val })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#152228] border border-[#294149]">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">
                    Efeitos Sonoros de Feedback
                  </span>
                  <span className="text-[11px] text-[#A8BBC0]">Sons sutis de confirmação</span>
                </div>
                <Switch
                  checked={preferences.soundEffectsEnabled}
                  onCheckedChange={(val) =>
                    setPreferences({ ...preferences, soundEffectsEnabled: val })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* COMUNICAÇÃO: SEPARAÇÃO RIGOROSA PEDAGÓGICO VS COMERCIAL (Critério A4) */}
        <Card className="bg-[#0C1317] border-[#294149]">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#01B59A]" />
              <span>Canais de Notificação & Privacidade</span>
            </CardTitle>
            <CardDescription className="text-xs text-[#A8BBC0]">
              As notificações pedagógicas de revisões espaçadas são estritamente separadas de
              comunicados comerciais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pedagógico Obrigatório / Recomendado */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#152228] border border-[#294149]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">
                    Alertas Pedagógicos de Revisão Espaçada
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[9px] border-[#01B59A]/40 text-[#01B59A] font-mono"
                  >
                    Pedagógico
                  </Badge>
                </div>
                <span className="text-[11px] text-[#A8BBC0]">
                  Avisos quando questões entram na curva de esquecimento do ciclo de 1, 3, 7 e 14
                  dias
                </span>
              </div>
              <Switch
                checked={preferences.pedagogicalNotificationsEnabled}
                onCheckedChange={(val) =>
                  setPreferences({ ...preferences, pedagogicalNotificationsEnabled: val })
                }
              />
            </div>

            {/* Comercial 1 */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#152228] border border-[#294149]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">
                    Comunicações Comerciais e Lançamentos
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[9px] border-amber-500/40 text-amber-400 font-mono"
                  >
                    Comercial
                  </Badge>
                </div>
                <span className="text-[11px] text-[#A8BBC0]">
                  Ofertas sobre novos cursos, workshops ao vivo e upgrades de planos
                </span>
              </div>
              <Switch
                checked={preferences.commercialMarketingOptIn}
                onCheckedChange={(val) =>
                  setPreferences({ ...preferences, commercialMarketingOptIn: val })
                }
              />
            </div>

            {/* Comercial 2 */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#152228] border border-[#294149]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">Parcerias e Softwares CAE</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] border-amber-500/40 text-amber-400 font-mono"
                  >
                    Parceiros
                  </Badge>
                </div>
                <span className="text-[11px] text-[#A8BBC0]">
                  Descontos em licenças educacionais e ferramentas conveniadas
                </span>
              </div>
              <Switch
                checked={preferences.partnerOffersOptIn}
                onCheckedChange={(val) =>
                  setPreferences({ ...preferences, partnerOffersOptIn: val })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Botão de Salvar Geral */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-[#01B59A] hover:bg-[#00A88F] text-black font-semibold text-xs h-10 px-6 shadow-md"
          >
            {isSaving ? (
              'Salvando alterações...'
            ) : (
              <span className="flex items-center gap-1.5">
                <Save className="h-4 w-4" />
                <span>Salvar Perfil & Preferências</span>
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
