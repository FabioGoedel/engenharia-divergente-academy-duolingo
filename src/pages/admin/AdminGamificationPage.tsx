import React, { useState, useEffect } from 'react'
import {
  Award,
  Sparkles,
  Flame,
  Video,
  MessageSquare,
  Sliders,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  Play,
  ShieldAlert,
  Edit,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  GamificationService,
  GamificationLevel,
  AchievementItem,
} from '@/services/gamificationService'
import {
  MotivationalService,
  MentorVideoConfig,
  ContextualMessageConfig,
} from '@/services/motivationalService'

export default function AdminGamificationPage() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [levels, setLevels] = useState<GamificationLevel[]>([])
  const [achievements, setAchievements] = useState<AchievementItem[]>([])
  const [videos, setVideos] = useState<MentorVideoConfig[]>([])
  const [messages, setMessages] = useState<ContextualMessageConfig[]>([])

  // Modais de Edição
  const [editingLevel, setEditingLevel] = useState<GamificationLevel | null>(null)
  const [editingAchievement, setEditingAchievement] = useState<AchievementItem | null>(null)
  const [editingVideo, setEditingVideo] = useState<MentorVideoConfig | null>(null)
  const [editingMessage, setEditingMessage] = useState<ContextualMessageConfig | null>(null)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [lvls, achs, vids, msgs] = await Promise.all([
        GamificationService.listLevels(),
        await GamificationService.listAchievementsForStudent('admin-query'),
        MotivationalService.adminListMentorVideos(),
        MotivationalService.adminListMessagesConfig(),
      ])

      setLevels(lvls)
      setAchievements(achs)
      setVideos(vids)
      setMessages(msgs)
    } catch (err) {
      console.warn('Erro ao carregar configurações de gamificação:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  // SALVAR NÍVEL
  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLevel) return
    try {
      await GamificationService.adminSaveLevel(editingLevel)
      toast({ title: 'Nível salvo com sucesso!' })
      setEditingLevel(null)
      loadAll()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: err.message })
    }
  }

  // SALVAR CONQUISTA
  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAchievement) return
    try {
      await GamificationService.adminSaveAchievement(editingAchievement)
      toast({ title: 'Conquista salva com sucesso!' })
      setEditingAchievement(null)
      loadAll()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: err.message })
    }
  }

  // SALVAR VÍDEO PEDAGÓGICO
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVideo) return
    try {
      await MotivationalService.adminSaveMentorVideo(editingVideo)
      toast({ title: 'Vídeo pedagógico salvo!' })
      setEditingVideo(null)
      loadAll()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: err.message })
    }
  }

  // SALVAR MENSAGEM CONTEXTUAL
  const handleSaveMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMessage) return
    try {
      await MotivationalService.adminSaveMessageConfig(editingMessage)
      toast({ title: 'Regra de mensagem salva!' })
      setEditingMessage(null)
      loadAll()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: err.message })
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-[#294149] space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-[#01B59A] uppercase tracking-wider">
          <Award className="h-4 w-4" />
          <span>Gestão Pedagógica & Parâmetros de Motivação • RBAC</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Painel de Gamificação & Mensagens do Mentor
        </h1>
        <p className="text-xs md:text-sm text-[#A8BBC0]">
          Configure réguas de XP, catálogo de medalhas, vídeos do Prof. Fábio Goedel e mensagens
          contextuais sem alterar código.
        </p>
      </div>

      <Tabs defaultValue="levels" className="space-y-6">
        <TabsList className="bg-[#152228] border border-[#294149] p-1 h-auto flex-wrap gap-1">
          <TabsTrigger
            value="levels"
            className="text-xs font-mono data-[state=active]:bg-[#01B59A] data-[state=active]:text-black"
          >
            Níveis Técnicos ({levels.length})
          </TabsTrigger>
          <TabsTrigger
            value="achievements"
            className="text-xs font-mono data-[state=active]:bg-[#01B59A] data-[state=active]:text-black"
          >
            Catálogo de Insígnias ({achievements.length})
          </TabsTrigger>
          <TabsTrigger
            value="mentor_videos"
            className="text-xs font-mono data-[state=active]:bg-[#01B59A] data-[state=active]:text-black"
          >
            Vídeos do Mentor ({videos.length})
          </TabsTrigger>
          <TabsTrigger
            value="pedagogical_messages"
            className="text-xs font-mono data-[state=active]:bg-[#01B59A] data-[state=active]:text-black"
          >
            Mensagens Contextuais ({messages.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. ABA NÍVEIS */}
        <TabsContent value="levels" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-[#A8BBC0]">
              Os limites de XP definem a evolução de carreira dos alunos. Alterações futuras não
              afetam histórico passado de transações.
            </p>
            <Button
              size="sm"
              onClick={() =>
                setEditingLevel({
                  id: `lvl-${levels.length + 1}`,
                  levelNumber: levels.length + 1,
                  title: 'Novo Nível de Engenharia',
                  minXp: 1000 * (levels.length + 1),
                  badgeCode: null,
                  perks: null,
                })
              }
              className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-mono text-xs font-bold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Novo Nível
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {levels.map((lvl) => (
              <Card key={lvl.id} className="bg-[#152228] border-[#294149]">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="border-[#01B59A]/40 text-[#01B59A] font-mono text-xs"
                    >
                      Nível {lvl.levelNumber}
                    </Badge>
                    <span className="font-mono text-xs text-white font-bold">
                      {lvl.minXp} XP mínimo
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{lvl.title}</h3>
                    <p className="text-xs text-[#A8BBC0] mt-1">
                      {lvl.perks || 'Sem privilégios específicos'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#294149] flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingLevel(lvl)}
                      className="text-xs text-[#01B59A] h-7"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 2. ABA CONQUISTAS */}
        <TabsContent value="achievements" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-[#A8BBC0]">
              Insígnias baseadas em critérios técnicos e autonomia. Recompensas em XP são auditadas
              pelo ledger.
            </p>
            <Button
              size="sm"
              onClick={() =>
                setEditingAchievement({
                  id: `ach-custom-${Date.now()}`,
                  code: 'CUSTOM_ACHIEVEMENT',
                  title: 'Nova Insígnia',
                  description: 'Critério de engenharia rigoroso.',
                  category: 'technical_mastery',
                  xpReward: 100,
                  rarity: 'Comum',
                  iconName: 'Award',
                  conditionType: 'first_mission',
                  conditionThreshold: 1,
                  isActive: true,
                })
              }
              className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-mono text-xs font-bold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Nova Conquista
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((ach) => (
              <Card key={ach.id} className="bg-[#152228] border-[#294149]">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#A8BBC0]">{ach.code}</span>
                    <Badge
                      variant="outline"
                      className="border-[#01B59A]/40 text-[#01B59A] font-mono text-[10px]"
                    >
                      +{ach.xpReward} XP
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{ach.title}</h3>
                    <p className="text-xs text-[#A8BBC0] mt-1 line-clamp-2">{ach.description}</p>
                  </div>
                  <div className="text-[10px] font-mono text-[#A8BBC0] pt-1">
                    Gatilho: {ach.conditionType} ({ach.conditionThreshold})
                  </div>
                  <div className="pt-2 border-t border-[#294149] flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingAchievement(ach)}
                      className="text-xs text-[#01B59A] h-7"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 3. ABA VÍDEOS DO MENTOR */}
        <TabsContent value="mentor_videos" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-[#A8BBC0]">
              Associe vídeos gravados do Prof. Fábio Goedel a gatilhos pedagógicos (primeiro acesso,
              marcos, volta após ausência).
            </p>
            <Button
              size="sm"
              onClick={() =>
                setEditingVideo({
                  id: `vid-${Date.now()}`,
                  triggerEvent: 'pedagogical_guidance',
                  title: 'Novo Vídeo Pedagógico',
                  supportMessage:
                    'Compreenda os fundamentos antes de rodar os modelos computacionais.',
                  provider: 'youtube',
                  videoUrlOrId: 'dQw4w9WgXcQ',
                  priority: 1,
                  isMandatory: false,
                  isActive: true,
                  buttonLabel: 'Continuar Estudos',
                })
              }
              className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-mono text-xs font-bold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Novo Vídeo Pedagógico
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((vid) => (
              <Card key={vid.id} className="bg-[#152228] border-[#294149]">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="border-[#01B59A]/40 text-[#01B59A] font-mono text-[10px]"
                    >
                      Gatilho: {vid.triggerEvent}
                    </Badge>
                    <span className="text-[10px] font-mono text-[#A8BBC0] uppercase">
                      {vid.provider}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{vid.title}</h3>
                    <p className="text-xs text-[#A8BBC0] mt-1 italic">"{vid.supportMessage}"</p>
                  </div>
                  <div className="pt-2 border-t border-[#294149] flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-[#A8BBC0]">
                      ID: {vid.videoUrlOrId}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingVideo(vid)}
                      className="text-xs text-[#01B59A] h-7"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 4. ABA MENSAGENS CONTEXTUAIS */}
        <TabsContent value="pedagogical_messages" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-[#A8BBC0]">
              Motor de frases de incentivo sóbrio. Nunca culpabilizar por ausência ou quebra de
              streak.
            </p>
            <Button
              size="sm"
              onClick={() =>
                setEditingMessage({
                  id: `msg-${Date.now()}`,
                  triggerEvent: 'streak_milestone',
                  title: 'Novo Reconhecimento',
                  messageText:
                    'A consistência diária constrói o instinto técnico que separa o engenheiro operacional do divergente.',
                  tone: 'supportive_technical',
                  isActive: true,
                  priority: 2,
                  maxImpressionsPerUser: 10,
                })
              }
              className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-mono text-xs font-bold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Nova Mensagem
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {messages.map((msg) => (
              <Card key={msg.id} className="bg-[#152228] border-[#294149]">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="border-[#01B59A]/40 text-[#01B59A] font-mono text-[10px]"
                    >
                      {msg.triggerEvent}
                    </Badge>
                    <span className="text-[10px] text-[#A8BBC0] font-mono">
                      Máx: {msg.maxImpressionsPerUser}x
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm">{msg.title}</h3>
                  <p className="text-xs text-[#A8BBC0] leading-relaxed">"{msg.messageText}"</p>
                  <div className="pt-2 border-t border-[#294149] flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingMessage(msg)}
                      className="text-xs text-[#01B59A] h-7"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL EDIÇÃO DE NÍVEL */}
      <Dialog open={Boolean(editingLevel)} onOpenChange={(open) => !open && setEditingLevel(null)}>
        <DialogContent className="bg-[#0C1317] border-[#294149] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Editar Nível Técnico</DialogTitle>
          </DialogHeader>
          {editingLevel && (
            <form onSubmit={handleSaveLevel} className="space-y-4 text-xs pt-2">
              <div className="space-y-1">
                <Label>Número do Nível</Label>
                <Input
                  type="number"
                  value={editingLevel.levelNumber}
                  onChange={(e) =>
                    setEditingLevel({ ...editingLevel, levelNumber: Number(e.target.value) })
                  }
                  className="bg-[#152228] border-[#294149] text-white"
                />
              </div>
              <div className="space-y-1">
                <Label>Título do Nível</Label>
                <Input
                  value={editingLevel.title}
                  onChange={(e) => setEditingLevel({ ...editingLevel, title: e.target.value })}
                  className="bg-[#152228] border-[#294149] text-white"
                />
              </div>
              <div className="space-y-1">
                <Label>XP Mínimo para Atingir</Label>
                <Input
                  type="number"
                  value={editingLevel.minXp}
                  onChange={(e) =>
                    setEditingLevel({ ...editingLevel, minXp: Number(e.target.value) })
                  }
                  className="bg-[#152228] border-[#294149] text-white"
                />
              </div>
              <div className="space-y-1">
                <Label>Privilégios e Desbloqueios</Label>
                <Input
                  value={editingLevel.perks || ''}
                  onChange={(e) => setEditingLevel({ ...editingLevel, perks: e.target.value })}
                  className="bg-[#152228] border-[#294149] text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingLevel(null)}
                  className="border-[#294149] text-[#A8BBC0]"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#01B59A] text-black font-bold">
                  Salvar Nível
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL EDIÇÃO DE CONQUISTA */}
      <Dialog
        open={Boolean(editingAchievement)}
        onOpenChange={(open) => !open && setEditingAchievement(null)}
      >
        <DialogContent className="bg-[#0C1317] border-[#294149] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Editar Conquista / Insígnia</DialogTitle>
          </DialogHeader>
          {editingAchievement && (
            <form onSubmit={handleSaveAchievement} className="space-y-3 text-xs pt-2">
              <div className="space-y-1">
                <Label>Código Único (Letras maiúsculas)</Label>
                <Input
                  value={editingAchievement.code}
                  onChange={(e) =>
                    setEditingAchievement({ ...editingAchievement, code: e.target.value })
                  }
                  className="bg-[#152228] border-[#294149] text-white"
                />
              </div>
              <div className="space-y-1">
                <Label>Título da Conquista</Label>
                <Input
                  value={editingAchievement.title}
                  onChange={(e) =>
                    setEditingAchievement({ ...editingAchievement, title: e.target.value })
                  }
                  className="bg-[#152228] border-[#294149] text-white"
                />
              </div>
              <div className="space-y-1">
                <Label>Descrição Técnica</Label>
                <Textarea
                  value={editingAchievement.description}
                  onChange={(e) =>
                    setEditingAchievement({ ...editingAchievement, description: e.target.value })
                  }
                  className="bg-[#152228] border-[#294149] text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Recompensa em XP</Label>
                  <Input
                    type="number"
                    value={editingAchievement.xpReward}
                    onChange={(e) =>
                      setEditingAchievement({
                        ...editingAchievement,
                        xpReward: Number(e.target.value),
                      })
                    }
                    className="bg-[#152228] border-[#294149] text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Raridade</Label>
                  <Input
                    value={editingAchievement.rarity}
                    onChange={(e) =>
                      setEditingAchievement({
                        ...editingAchievement,
                        rarity: e.target.value as any,
                      })
                    }
                    className="bg-[#152228] border-[#294149] text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingAchievement(null)}
                  className="border-[#294149] text-[#A8BBC0]"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#01B59A] text-black font-bold">
                  Salvar Insígnia
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL EDIÇÃO DE VÍDEO DO MENTOR */}
      <Dialog open={Boolean(editingVideo)} onOpenChange={(open) => !open && setEditingVideo(null)}>
        <DialogContent className="bg-[#0C1317] border-[#294149] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Configurar Vídeo do Prof. Fábio Goedel
            </DialogTitle>
          </DialogHeader>
          {editingVideo && (
            <form onSubmit={handleSaveVideo} className="space-y-3 text-xs pt-2">
              <div className="space-y-1">
                <Label>Título do Vídeo Pedagógico</Label>
                <Input
                  value={editingVideo.title}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  className="bg-[#152228] border-[#294149] text-white"
                />
              </div>
              <div className="space-y-1">
                <Label>Gatilho Pedagógico</Label>
                <Input
                  value={editingVideo.triggerEvent}
                  onChange={(e) =>
                    setEditingVideo({ ...editingVideo, triggerEvent: e.target.value as any })
                  }
                  className="bg-[#152228] border-[#294149] text-white font-mono"
                  placeholder="first_access, unit_completed, level_up, return_after_inactivity..."
                />
              </div>
              <div className="space-y-1">
                <Label>Mensagem de Apoio do Mentor (Texto de Destaque)</Label>
                <Textarea
                  value={editingVideo.supportMessage}
                  onChange={(e) =>
                    setEditingVideo({ ...editingVideo, supportMessage: e.target.value })
                  }
                  className="bg-[#152228] border-[#294149] text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Provedor</Label>
                  <Input
                    value={editingVideo.provider}
                    onChange={(e) =>
                      setEditingVideo({ ...editingVideo, provider: e.target.value as any })
                    }
                    className="bg-[#152228] border-[#294149] text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label>ID ou URL do Vídeo</Label>
                  <Input
                    value={editingVideo.videoUrlOrId}
                    onChange={(e) =>
                      setEditingVideo({ ...editingVideo, videoUrlOrId: e.target.value })
                    }
                    className="bg-[#152228] border-[#294149] text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingVideo(null)}
                  className="border-[#294149] text-[#A8BBC0]"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#01B59A] text-black font-bold">
                  Salvar Vídeo Pedagógico
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL EDIÇÃO DE MENSAGEM */}
      <Dialog
        open={Boolean(editingMessage)}
        onOpenChange={(open) => !open && setEditingMessage(null)}
      >
        <DialogContent className="bg-[#0C1317] border-[#294149] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Editar Regra de Mensagem Contextual
            </DialogTitle>
          </DialogHeader>
          {editingMessage && (
            <form onSubmit={handleSaveMessage} className="space-y-3 text-xs pt-2">
              <div className="space-y-1">
                <Label>Título da Mensagem</Label>
                <Input
                  value={editingMessage.title}
                  onChange={(e) => setEditingMessage({ ...editingMessage, title: e.target.value })}
                  className="bg-[#152228] border-[#294149] text-white"
                />
              </div>
              <div className="space-y-1">
                <Label>Gatilho</Label>
                <Input
                  value={editingMessage.triggerEvent}
                  onChange={(e) =>
                    setEditingMessage({ ...editingMessage, triggerEvent: e.target.value as any })
                  }
                  className="bg-[#152228] border-[#294149] text-white font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label>Texto da Mensagem (Tom técnico e construtivo; sem culpa)</Label>
                <Textarea
                  value={editingMessage.messageText}
                  onChange={(e) =>
                    setEditingMessage({ ...editingMessage, messageText: e.target.value })
                  }
                  className="bg-[#152228] border-[#294149] text-white"
                />
              </div>
              <div className="space-y-1">
                <Label>Máximo de Exibições por Aluno</Label>
                <Input
                  type="number"
                  value={editingMessage.maxImpressionsPerUser}
                  onChange={(e) =>
                    setEditingMessage({
                      ...editingMessage,
                      maxImpressionsPerUser: Number(e.target.value),
                    })
                  }
                  className="bg-[#152228] border-[#294149] text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingMessage(null)}
                  className="border-[#294149] text-[#A8BBC0]"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#01B59A] text-black font-bold">
                  Salvar Mensagem
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
