import React, { useState, useEffect } from 'react'
import {
  Compass,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  Award,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { SanitizedMarkdownViewer } from '@/components/cms/SanitizedMarkdownViewer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  AdaptiveProgressionService,
  DiagnosticAssessmentConfig,
  StudentDiagnosticResult,
} from '@/services/adaptiveProgressionService'

interface DiagnosticQuestion {
  id: string
  competency: string
  title: string
  prompt: string
  options: Array<{ id: string; text: string }>
  correctOptionId: string
  difficulty: number
}

const DIAGNOSTIC_QUESTIONS_POOL: DiagnosticQuestion[] = [
  {
    id: 'diag-q1',
    competency: 'COMP-RESMAT-01',
    title: 'Equilíbrio Estático e Posição da Linha Neutra',
    prompt:
      'Em uma seção transversal simétrica submetida exclusivamente a momento fletor puro no regime linear elástico, onde se localiza a linha neutra de tensões normais?',
    options: [
      { id: 'opt-a', text: 'No centróide geométrico da seção transversal (y = 0).' },
      { id: 'opt-b', text: 'Na fibra superior que sofre máxima compressão.' },
      { id: 'opt-c', text: 'No ponto de máxima tensão de cisalhamento transversal.' },
      {
        id: 'opt-d',
        text: 'Sempre na metade da altura da alma, independentemente da geometria das abas.',
      },
    ],
    correctOptionId: 'opt-a',
    difficulty: 2,
  },
  {
    id: 'diag-q2',
    competency: 'COMP-RESMAT-01',
    title: 'Fórmula de Navier para Tensão Normal Máxima',
    prompt:
      'Dada a equação de flexão pura σ = M·y / I, qual grandeza representa o módulo de resistência elástica W (ou Z elástico)?',
    options: [
      {
        id: 'opt-a',
        text: 'A razão entre o momento de inércia e a distância máxima à fibra extrema (W = I / y_max).',
      },
      { id: 'opt-b', text: 'O produto entre a área da seção e o raio de giração da viga.' },
      { id: 'opt-c', text: 'A integral do momento fletor ao longo do vão biapoiado.' },
      { id: 'opt-d', text: 'A rigidez flexional multiplicada pelo módulo de Poisson.' },
    ],
    correctOptionId: 'opt-a',
    difficulty: 3,
  },
  {
    id: 'diag-q3',
    competency: 'COMP-MEF-01',
    title: 'Convergência e Refinamento de Malha em CAE',
    prompt:
      'Ao realizar a análise de tensões em uma viga com entalhe usando o Método dos Elementos Finitos, como verificar se a solução numérica é confiável?',
    options: [
      {
        id: 'opt-a',
        text: 'Pelo estudo de convergência de malha, garantindo que o refinamento sucessivo estabiliza as tensões sem singularidades artificiais.',
      },
      {
        id: 'opt-b',
        text: 'Aceitando o valor da primeira rodada se as cores do mapa de von Mises estiverem suaves.',
      },
      {
        id: 'opt-c',
        text: 'Aumentando o limite de escoamento do material no modelo para evitar cores vermelhas.',
      },
      { id: 'opt-d', text: 'Fixando todos os graus de liberdade da peça em todos os nós.' },
    ],
    correctOptionId: 'opt-a',
    difficulty: 4,
  },
  {
    id: 'diag-q4',
    competency: 'COMP-MEF-02',
    title: 'Condições de Contorno e Hipótese de Saint-Venant',
    prompt:
      'O Princípio de Saint-Venant afirma que os efeitos locais de aplicação de carga ou restrição se dissipam rapidamente a uma distância da ordem de:',
    options: [
      { id: 'opt-a', text: 'Uma dimensão característica da seção transversal da peça.' },
      { id: 'opt-b', text: 'Dez vezes o comprimento total da estrutura.' },
      { id: 'opt-c', text: 'Apenas após a plastificação completa da seção.' },
      { id: 'opt-d', text: 'A distância é nula para qualquer material homogêneo.' },
    ],
    correctOptionId: 'opt-a',
    difficulty: 3,
  },
]

export default function DiagnosticAssessmentPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const userId = user?.id || 'demo-student-user'

  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<DiagnosticAssessmentConfig | null>(null)
  const [history, setHistory] = useState<StudentDiagnosticResult[]>([])
  const [isTestStarted, setIsTestStarted] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(30 * 60)
  const [isFinishing, setIsFinishing] = useState(false)
  const [diagnosticResult, setDiagnosticResult] = useState<StudentDiagnosticResult | null>(null)

  useEffect(() => {
    async function loadConfig() {
      setLoading(true)
      try {
        const conf = await AdaptiveProgressionService.getDiagnosticAssessment('track-resmat-flexao')
        const hist = await AdaptiveProgressionService.getStudentDiagnosticHistory(
          userId,
          'track-resmat-flexao',
        )
        setConfig(conf)
        setHistory(hist)
        if (conf?.durationMinutes) {
          setTimeRemainingSeconds(conf.durationMinutes * 60)
        }
      } catch (err) {
        console.warn('Erro ao carregar diagnóstico:', err)
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [userId])

  // Timer regressivo
  useEffect(() => {
    if (!isTestStarted || diagnosticResult) return
    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleFinishDiagnostic()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isTestStarted, diagnosticResult])

  const handleStart = () => {
    setIsTestStarted(true)
    setCurrentStepIndex(0)
    setSelectedAnswers({})
    setDiagnosticResult(null)
  }

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  }

  const handleFinishDiagnostic = async () => {
    setIsFinishing(true)
    try {
      let correct = 0
      const compScoresMap: Record<string, { total: number; correct: number }> = {}

      for (const q of DIAGNOSTIC_QUESTIONS_POOL) {
        if (!compScoresMap[q.competency]) {
          compScoresMap[q.competency] = { total: 0, correct: 0 }
        }
        compScoresMap[q.competency].total++

        if (selectedAnswers[q.id] === q.correctOptionId) {
          correct++
          compScoresMap[q.competency].correct++
        }
      }

      const totalQ = DIAGNOSTIC_QUESTIONS_POOL.length
      const overallScore = Math.round((correct / totalQ) * 100)

      const finalCompScores: Record<string, number> = {}
      const recommendedNodes: StudentDiagnosticResult['recommendedStartingNodes'] = []

      for (const [comp, stat] of Object.entries(compScoresMap)) {
        const mastery = Math.round((stat.correct / stat.total) * 100)
        finalCompScores[comp] = mastery

        let level: 'basico' | 'intermediario' | 'avancado' = 'basico'
        let recNode = 'node-fundamentos-flexao'

        if (mastery >= 75) {
          level = 'avancado'
          recNode = comp === 'COMP-MEF-01' ? 'node-mef-convergencia' : 'node-flexao-avancada'
        } else if (mastery >= 50) {
          level = 'intermediario'
          recNode = comp === 'COMP-MEF-01' ? 'node-mef-intro' : 'node-calculo-tensoes'
        }

        recommendedNodes.push({
          competency: comp,
          recommendedNodeId: recNode,
          masteryScore: mastery,
          level,
        })
      }

      const resPayload: StudentDiagnosticResult = {
        userId,
        assessmentId: config?.id || 'diag-resmat-mef-01',
        trackId: 'track-resmat-flexao',
        status: 'completed',
        competencyScores: finalCompScores,
        recommendedStartingNodes: recommendedNodes,
        totalQuestions: totalQ,
        correctQuestions: correct,
        scorePercent: overallScore,
        activeSeconds: (config?.durationMinutes || 30) * 60 - timeRemainingSeconds,
      }

      const saved = await AdaptiveProgressionService.completeDiagnosticAssessment(resPayload)
      setDiagnosticResult(saved)
      toast({
        title: 'Nivelamento Concluído!',
        description:
          'Seu perfil foi calibrado por competência com recomendações de ponto de partida.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar resultado',
        description: err?.message,
        variant: 'destructive',
      })
    } finally {
      setIsFinishing(false)
    }
  }

  const currentQ = DIAGNOSTIC_QUESTIONS_POOL[currentStepIndex]
  const minutes = Math.floor(timeRemainingSeconds / 60)
  const seconds = timeRemainingSeconds % 60

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-[#294149] space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-[#01B59A] uppercase tracking-wider">
          <Compass className="h-4 w-4" />
          <span>Fase 5 • Pacote B • Nivelamento Inicial & Diagnóstico Adaptativo</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          Avaliação Diagnóstica de Engenharia
        </h1>
        <p className="text-xs md:text-sm text-[#A8BBC0]">
          Mapeia seu conhecimento prévio por competência individual (um engenheiro experiente não
          domina todas as áreas por igual). Recomenda pontos de partida sem repetições
          desnecessárias.
        </p>
      </div>

      {!isTestStarted && !diagnosticResult ? (
        <div className="space-y-6">
          <Card className="bg-[#152228] border-[#294149]">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#01B59A]" />
                {config?.title || 'Diagnóstico de Nivelamento: Resistência dos Materiais & MEF'}
              </CardTitle>
              <CardDescription className="text-xs text-[#A8BBC0]">
                {config?.description ||
                  'Avaliação rápida sem penalidade de XP para identificar suas competências consolidadas.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#0C1317] border border-[#294149]">
                  <p className="text-[#A8BBC0] font-mono text-[10px]">Duração Limite</p>
                  <p className="text-white font-bold text-sm mt-1">
                    {config?.durationMinutes || 35} minutos
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#0C1317] border border-[#294149]">
                  <p className="text-[#A8BBC0] font-mono text-[10px]">Competências Avaliadas</p>
                  <p className="text-white font-bold text-sm mt-1">
                    {config?.competenciesCovered?.length || 4} áreas técnicas
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#0C1317] border border-[#294149]">
                  <p className="text-[#A8BBC0] font-mono text-[10px]">Permissão de Refazer</p>
                  <p className="text-white font-bold text-sm mt-1">
                    A cada {config?.retakeCooldownDays || 14} dias
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0C1317] border border-[#01B59A]/30 text-xs text-[#E6EAED] space-y-1">
                <span className="font-bold text-[#01B59A] block font-mono">
                  Regras Pedagógicas:
                </span>
                <p>• As questões são retiradas do banco oficial da Engenharia Divergente.</p>
                <p>
                  • O resultado não atribui uma nota única: cada competência recebe seu próprio
                  índice de domínio.
                </p>
                <p>
                  • Você poderá avançar direto para módulos avançados nas áreas que já demonstrar
                  domínio.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleStart}
                  className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-bold font-mono text-xs px-6 h-10"
                >
                  Iniciar Diagnóstico Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Histórico Anterior */}
          {history.length > 0 && (
            <Card className="bg-[#0C1317] border-[#294149]">
              <CardHeader className="pb-3 border-b border-[#294149]/60">
                <CardTitle className="text-sm font-bold text-white">
                  Diagnósticos Realizados Anteriormente
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                {history.map((h, i) => (
                  <div
                    key={h.id || i}
                    className="p-3 rounded-xl bg-[#152228] border border-[#294149] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">
                        Nivelamento em {new Date(h.completedAt || '').toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-[10px] text-[#A8BBC0] font-mono">
                        {h.correctQuestions} de {h.totalQuestions} acertos ({h.scorePercent}%)
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-[#01B59A]/40 text-[#01B59A] font-mono text-[10px]"
                    >
                      Concluído
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : isTestStarted && !diagnosticResult ? (
        // Fluxo de Resolução de Questões
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-mono text-[#A8BBC0]">
              Questão {currentStepIndex + 1} de {DIAGNOSTIC_QUESTIONS_POOL.length}
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#152228] border border-[#294149] font-mono text-xs text-[#01B59A]">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
              </span>
            </div>
          </div>

          <Card className="bg-[#152228] border-[#294149]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <Badge
                  variant="outline"
                  className="border-[#01B59A]/40 text-[#01B59A] font-mono text-[10px]"
                >
                  {currentQ.competency}
                </Badge>
                <span className="text-[10px] font-mono text-[#A8BBC0]">
                  Dificuldade {currentQ.difficulty}/5
                </span>
              </div>
              <CardTitle className="text-white text-base">{currentQ.title}</CardTitle>
              <div className="text-xs text-[#E6EAED] mt-2 leading-relaxed">
                <SanitizedMarkdownViewer content={currentQ.prompt} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {currentQ.options.map((opt) => {
                const isSelected = selectedAnswers[currentQ.id] === opt.id
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all text-xs leading-relaxed ${
                      isSelected
                        ? 'border-[#01B59A] bg-[#01B59A]/15 text-white ring-1 ring-[#01B59A]'
                        : 'border-[#294149] bg-[#0C1317] text-[#A8BBC0] hover:border-[#294149]/80 hover:text-white'
                    }`}
                  >
                    <SanitizedMarkdownViewer content={opt.text} />
                  </div>
                )
              })}

              <div className="pt-4 flex items-center justify-between border-t border-[#294149]">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentStepIndex === 0}
                  onClick={() => setCurrentStepIndex((p) => p - 1)}
                  className="border-[#294149] text-xs text-[#A8BBC0]"
                >
                  Anterior
                </Button>

                {currentStepIndex < DIAGNOSTIC_QUESTIONS_POOL.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentStepIndex((p) => p + 1)}
                    disabled={!selectedAnswers[currentQ.id]}
                    className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-bold text-xs"
                  >
                    Próxima Questão
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleFinishDiagnostic}
                    disabled={isFinishing || !selectedAnswers[currentQ.id]}
                    className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-bold text-xs"
                  >
                    {isFinishing ? 'Calculando...' : 'Finalizar Diagnóstico'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Resultado do Nivelamento
        <div className="space-y-6">
          <Card className="bg-[#152228] border-2 border-[#01B59A]">
            <CardHeader className="text-center pb-2">
              <div className="h-12 w-12 rounded-full bg-[#01B59A]/20 border border-[#01B59A]/40 flex items-center justify-center text-[#01B59A] mx-auto mb-2">
                <Award className="h-6 w-6" />
              </div>
              <CardTitle className="text-white text-xl">
                Diagnóstico Concluído com Sucesso!
              </CardTitle>
              <CardDescription className="text-xs text-[#A8BBC0]">
                O motor adaptativo mapeou suas competências e definiu o ponto de partida ideal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {/* Pontuação Global */}
              <div className="p-4 rounded-xl bg-[#0C1317] border border-[#294149] text-center space-y-1">
                <span className="text-[10px] font-mono text-[#A8BBC0] uppercase">
                  Acurácia Geral no Nivelamento
                </span>
                <p className="text-3xl font-extrabold font-mono text-[#01B59A]">
                  {diagnosticResult?.scorePercent}%
                </p>
                <p className="text-[11px] text-[#A8BBC0]">
                  {diagnosticResult?.correctQuestions} de {diagnosticResult?.totalQuestions}{' '}
                  questões resolvidas
                </p>
              </div>

              {/* Detalhamento por Competência */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#01B59A]" />
                  Domínio Individual por Competência
                </h3>
                <div className="space-y-3">
                  {diagnosticResult?.recommendedStartingNodes.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#0C1317] border border-[#294149] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-white">{item.competency}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            item.level === 'avancado'
                              ? 'border-[#01B59A]/40 text-[#01B59A]'
                              : item.level === 'intermediario'
                                ? 'border-[#C69B4B]/40 text-[#C69B4B]'
                                : 'border-[#294149] text-[#A8BBC0]'
                          }`}
                        >
                          Nível {item.level.toUpperCase()} ({item.masteryScore}%)
                        </Badge>
                      </div>
                      <Progress value={item.masteryScore} className="h-1.5 bg-[#152228]" />
                      <p className="text-[11px] text-[#A8BBC0]">
                        Ponto de partida recomendado:{' '}
                        <strong className="text-white font-mono">{item.recommendedNodeId}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <Button
                  asChild
                  className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-bold font-mono text-xs px-6 h-10"
                >
                  <Link to="/app/trilhas/track-resmat-flexao">Ir para a Trilha Adaptada →</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-[#294149] text-xs text-[#A8BBC0]"
                >
                  <Link to="/app">Voltar ao Painel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
