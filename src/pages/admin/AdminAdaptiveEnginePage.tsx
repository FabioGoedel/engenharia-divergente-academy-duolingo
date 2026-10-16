import React, { useState, useEffect } from 'react'
import {
  Sliders,
  Settings,
  Brain,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  BarChart3,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import {
  AdaptiveProgressionService,
  AdaptivePolicy,
  AdaptiveRecommendation,
  QuestionCalibrationData,
  STAGE_DESCRIPTIONS,
} from '@/services/adaptiveProgressionService'

export default function AdminAdaptiveEnginePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [policy, setPolicy] = useState<AdaptivePolicy | null>(null)
  const [calibrations, setCalibrations] = useState<QuestionCalibrationData[]>([])

  // Simulador de Perfil
  const [simProfile, setSimProfile] = useState({
    accuracyRate: 75,
    avgPerceivedDifficulty: 3.2,
    hintsCount: 2,
    uncertaintyCount: 1,
    attemptsCount: 6,
  })
  const [simResult, setSimResult] = useState<AdaptiveRecommendation | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const pol = await AdaptiveProgressionService.getActivePolicy()
        const calibs = await AdaptiveProgressionService.listQuestionCalibrations()
        setPolicy(pol)
        setCalibrations(calibs)
        if (pol) {
          setSimResult(AdaptiveProgressionService.simulateProfileRecommendation(simProfile, pol))
        }
      } catch (err) {
        console.warn('Erro ao carregar motor adaptativo:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleSimulate = () => {
    if (!policy) return
    const res = AdaptiveProgressionService.simulateProfileRecommendation(simProfile, policy)
    setSimResult(res)
  }

  const handleSavePolicy = async () => {
    if (!policy) return
    try {
      await AdaptiveProgressionService.adminSavePolicy(policy)
      toast({
        title: 'Política Adaptativa Salva!',
        description: `Versão ${policy.version + 1} publicada e registrada para auditoria.`,
      })
      const updated = await AdaptiveProgressionService.getActivePolicy()
      setPolicy(updated)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar política',
        description: err?.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-[#294149] space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-[#01B59A] uppercase tracking-wider">
          <Brain className="h-4 w-4" />
          <span>Fase 5 • Pacote B • Painel Admin do Motor Adaptativo & Calibração</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Configuração do Motor Adaptativo Determinístico
        </h1>
        <p className="text-xs md:text-sm text-[#A8BBC0]">
          Configure regras, limiares de progressão e pesos de indicadores sem alterar código. Simule
          perfis de alunos e acompanhe calibrações de exercícios.
        </p>
      </div>

      <Tabs defaultValue="policy" className="space-y-6">
        <TabsList className="bg-[#152228] border border-[#294149] p-1">
          <TabsTrigger
            value="policy"
            className="data-[state=active]:bg-[#01B59A] data-[state=active]:text-black text-xs font-mono"
          >
            <Sliders className="h-3.5 w-3.5 mr-1.5" />
            Políticas & Pesos
          </TabsTrigger>
          <TabsTrigger
            value="simulator"
            className="data-[state=active]:bg-[#01B59A] data-[state=active]:text-black text-xs font-mono"
          >
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Simulador de Perfis
          </TabsTrigger>
          <TabsTrigger
            value="calibration"
            className="data-[state=active]:bg-[#01B59A] data-[state=active]:text-black text-xs font-mono"
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            Calibração de Dificuldade
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: POLÍTICAS E PESOS */}
        <TabsContent value="policy" className="space-y-6">
          <Card className="bg-[#152228] border-[#294149]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-base">
                    Parâmetros Determinísticos da Política
                  </CardTitle>
                  <CardDescription className="text-xs text-[#A8BBC0]">
                    Versão Atual: v{policy?.version || 1} • Auditada no banco de dados
                  </CardDescription>
                </div>
                <Badge className="bg-[#01B59A]/20 text-[#01B59A] border-[#01B59A]/30">Ativa</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white">
                    Acurácia Mínima para Avançar Grau de Autonomia (%)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[policy?.minAccuracyToAdvance || 70]}
                      min={50}
                      max={95}
                      step={5}
                      onValueChange={([v]) =>
                        setPolicy((p) => (p ? { ...p, minAccuracyToAdvance: v } : p))
                      }
                      className="flex-1"
                    />
                    <span className="font-mono text-white font-bold w-12 text-right">
                      {policy?.minAccuracyToAdvance}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">
                    Taxa Máxima de Erros para Recomendar Revisão (%)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[policy?.maxErrorRateToReview || 40]}
                      min={20}
                      max={60}
                      step={5}
                      onValueChange={([v]) =>
                        setPolicy((p) => (p ? { ...p, maxErrorRateToReview: v } : p))
                      }
                      className="flex-1"
                    />
                    <span className="font-mono text-white font-bold w-12 text-right">
                      {policy?.maxErrorRateToReview}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Pesos Relativos */}
              <div className="p-4 rounded-xl bg-[#0C1317] border border-[#294149] space-y-4">
                <span className="font-bold text-[#01B59A] uppercase tracking-wider block font-mono text-[10px]">
                  Pesos dos Indicadores no Escore Composto de Proficiência
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[#A8BBC0]">
                      <span>Acurácia Objetiva (Acertos)</span>
                      <span className="font-mono text-white">
                        {Math.round((policy?.objectiveAccuracyWeight || 0.4) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(policy?.objectiveAccuracyWeight || 0.4) * 100}
                      className="h-1.5 bg-[#152228]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[#A8BBC0]">
                      <span>Dificuldade Percebida Subjetiva (1-5)</span>
                      <span className="font-mono text-white">
                        {Math.round((policy?.perceivedDifficultyWeight || 0.25) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(policy?.perceivedDifficultyWeight || 0.25) * 100}
                      className="h-1.5 bg-[#152228]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[#A8BBC0]">
                      <span>Penalidade por Uso de Dicas</span>
                      <span className="font-mono text-white">
                        {Math.round((policy?.hintsUsedPenaltyWeight || 0.2) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(policy?.hintsUsedPenaltyWeight || 0.2) * 100}
                      className="h-1.5 bg-[#152228]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[#A8BBC0]">
                      <span>Penalidade por Incerteza Declarada</span>
                      <span className="font-mono text-white">
                        {Math.round((policy?.uncertaintyFrequencyWeight || 0.15) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(policy?.uncertaintyFrequencyWeight || 0.15) * 100}
                      className="h-1.5 bg-[#152228]"
                    />
                  </div>
                </div>
              </div>

              {/* Regra de Autonomia do Aluno */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0C1317] border border-[#294149]">
                <div>
                  <p className="text-white font-bold">
                    Permitir Desafio Superior por Escolha do Aluno
                  </p>
                  <p className="text-[#A8BBC0] text-[11px]">
                    O aluno pode conscientemente ignorar a sugestão de revisão e tentar um problema
                    mais difícil.
                  </p>
                </div>
                <Switch
                  checked={policy?.allowStudentOverrideChallenge ?? true}
                  onCheckedChange={(c) =>
                    setPolicy((p) => (p ? { ...p, allowStudentOverrideChallenge: c } : p))
                  }
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleSavePolicy}
                  className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-bold font-mono text-xs px-6 h-10"
                >
                  Salvar Política & Registrar Versão
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2: SIMULADOR DE PERFIS */}
        <TabsContent value="simulator" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Controles de Simulação */}
            <Card className="bg-[#152228] border-[#294149]">
              <CardHeader>
                <CardTitle className="text-white text-base">
                  Parâmetros do Perfil Simulado
                </CardTitle>
                <CardDescription className="text-xs text-[#A8BBC0]">
                  Ajuste os valores para testar a recomendação determinística do algoritmo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-[#A8BBC0]">Taxa de Acertos do Aluno</Label>
                    <span className="font-mono text-white font-bold">
                      {simProfile.accuracyRate}%
                    </span>
                  </div>
                  <Slider
                    value={[simProfile.accuracyRate]}
                    min={10}
                    max={100}
                    step={5}
                    onValueChange={([v]) => setSimProfile((p) => ({ ...p, accuracyRate: v }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-[#A8BBC0]">Dificuldade Média Percebida (1 a 5)</Label>
                    <span className="font-mono text-white font-bold">
                      {simProfile.avgPerceivedDifficulty.toFixed(1)} / 5
                    </span>
                  </div>
                  <Slider
                    value={[simProfile.avgPerceivedDifficulty * 10]}
                    min={10}
                    max={50}
                    step={1}
                    onValueChange={([v]) =>
                      setSimProfile((p) => ({ ...p, avgPerceivedDifficulty: v / 10 }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-[#A8BBC0]">Total de Dicas Utilizadas</Label>
                    <span className="font-mono text-white font-bold">{simProfile.hintsCount}</span>
                  </div>
                  <Slider
                    value={[simProfile.hintsCount]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={([v]) => setSimProfile((p) => ({ ...p, hintsCount: v }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-[#A8BBC0]">Respostas com Incerteza Declarada</Label>
                    <span className="font-mono text-white font-bold">
                      {simProfile.uncertaintyCount}
                    </span>
                  </div>
                  <Slider
                    value={[simProfile.uncertaintyCount]}
                    min={0}
                    max={5}
                    step={1}
                    onValueChange={([v]) => setSimProfile((p) => ({ ...p, uncertaintyCount: v }))}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleSimulate}
                    variant="outline"
                    className="w-full border-[#01B59A] text-[#01B59A] hover:bg-[#01B59A]/10 text-xs font-mono"
                  >
                    Recalcular Decisão do Motor
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resultado da Decisão */}
            <Card className="bg-[#152228] border border-[#01B59A]/40">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#01B59A]" />
                  Decisão Determinística Explicável
                </CardTitle>
                <CardDescription className="text-xs text-[#A8BBC0]">
                  Resultado que o aluno receberá com justificativa pedagógica clara.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {simResult && (
                  <>
                    <div className="p-3.5 rounded-xl bg-[#0C1317] border border-[#294149] space-y-1">
                      <span className="text-[10px] font-mono text-[#01B59A] uppercase">
                        Ação Recomendada
                      </span>
                      <p className="font-bold text-white text-sm">{simResult.title}</p>
                      <Badge
                        variant="outline"
                        className="border-[#01B59A]/40 text-[#01B59A] font-mono text-[10px] mt-1"
                      >
                        {simResult.recommendedStage}
                      </Badge>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#0C1317] border border-[#294149] space-y-1">
                      <span className="text-[10px] font-mono text-[#A8BBC0] uppercase">
                        Explicação Didática
                      </span>
                      <p className="text-white leading-relaxed">{simResult.explanation}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#0C1317] border border-[#294149] space-y-2">
                      <span className="text-[10px] font-mono text-[#A8BBC0] uppercase">
                        Fatores Analisados
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div>
                          <span className="text-[#A8BBC0]">Score Proficiência: </span>
                          <strong className="text-white">
                            {simResult.metricsConsidered.compositeProficiencyScore} pts
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#A8BBC0]">Acurácia: </span>
                          <strong className="text-white">
                            {simResult.metricsConsidered.accuracyRate}%
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#A8BBC0]">Dif. Percebida: </span>
                          <strong className="text-white">
                            {simResult.metricsConsidered.avgPerceivedDifficulty} / 5
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#A8BBC0]">Dicas Usadas: </span>
                          <strong className="text-white">
                            {simResult.metricsConsidered.hintsUsedCount}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA 3: CALIBRAÇÃO DE DIFICULDADE */}
        <TabsContent value="calibration" className="space-y-6">
          <Card className="bg-[#152228] border-[#294149]">
            <CardHeader>
              <CardTitle className="text-white text-base">
                Calibração de Dificuldade por Questão
              </CardTitle>
              <CardDescription className="text-xs text-[#A8BBC0]">
                Coleta contínua de taxa de acerto real, tempo e percepção subjetiva (1-5). Sinaliza
                itens a revisar sem alterar gabaritos publicados automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-xl bg-[#0C1317] border border-[#294149] flex items-center justify-between text-xs">
                <span className="text-[#A8BBC0]">Total de Questões Monitoradas com Telemetria</span>
                <span className="font-mono font-bold text-white">4 itens em produção</span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#0C1317] border border-[#294149] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">RESMAT-FLEX-02-NUM (Viga Biapoiada)</p>
                      <p className="text-[10px] text-[#A8BBC0] font-mono">
                        Cálculo de Tensão Normal Máxima e Módulo W
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-[#C69B4B]/40 text-[#C69B4B] font-mono text-[10px]"
                    >
                      Dificuldade 3.8 / 5
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 font-mono text-[11px] pt-1 border-t border-[#294149]/50 text-[#A8BBC0]">
                    <div>
                      Acerto Real: <span className="text-white font-bold">58%</span>
                    </div>
                    <div>
                      Tentativas: <span className="text-white font-bold">38</span>
                    </div>
                    <div>
                      Dicas Médias: <span className="text-white font-bold">1.4</span>
                    </div>
                    <div>
                      Estágio: <span className="text-[#01B59A] font-bold">Estágio 3</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0C1317] border border-[#294149] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">
                        RESMAT-FLEX-01-CONC (Conceitual Euler-Bernoulli)
                      </p>
                      <p className="text-[10px] text-[#A8BBC0] font-mono">
                        Hipótese de Seções Planas e Linha Neutra
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-[#01B59A]/40 text-[#01B59A] font-mono text-[10px]"
                    >
                      Dificuldade 2.1 / 5
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 font-mono text-[11px] pt-1 border-t border-[#294149]/50 text-[#A8BBC0]">
                    <div>
                      Acerto Real: <span className="text-white font-bold">89%</span>
                    </div>
                    <div>
                      Tentativas: <span className="text-white font-bold">42</span>
                    </div>
                    <div>
                      Dicas Médias: <span className="text-white font-bold">0.2</span>
                    </div>
                    <div>
                      Estágio: <span className="text-[#01B59A] font-bold">Estágio 4</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
