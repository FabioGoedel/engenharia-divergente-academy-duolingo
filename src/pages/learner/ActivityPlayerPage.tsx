import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  RotateCcw,
  Sliders,
  ChevronRight,
  Lightbulb,
  Award,
  Layers,
  BookOpen,
  Info,
  ShieldAlert,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ActivityService } from '@/services/activityService'
import {
  ActivityMissionDefinition,
  ActivityExerciseStudentPayload,
  ActivityMissionProgress,
  ExerciseGradeResult,
} from '@/types/activity'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { SanitizedMarkdownViewer, MathFormula } from '@/components/cms/SanitizedMarkdownViewer'
import { EngineeringCalculator } from '@/components/calculator/EngineeringCalculator'
import { useToast } from '@/hooks/use-toast'
import { runAcademyEngineeringTests, TestResult } from '@/lib/testRunner'

export const ActivityPlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [mission, setMission] = useState<ActivityMissionDefinition | null>(null)
  const [exercises, setExercises] = useState<ActivityExerciseStudentPayload[]>([])
  const [progress, setProgress] = useState<ActivityMissionProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado do exercício atual
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [numericInput, setNumericInput] = useState('')
  const [hintsRevealed, setHintsRevealed] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastGrade, setLastGrade] = useState<ExerciseGradeResult | null>(null)

  // Metadados pedagógicos pós-resposta
  const [perceivedDifficulty, setPerceivedDifficulty] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const [guessed, setGuessed] = useState(false)

  // Painel de Testes Automatizados (Critério 10)
  const [showTestsModal, setShowTestsModal] = useState(false)
  const [testSummary, setTestSummary] = useState<{
    running: boolean
    allPassed?: boolean
    passedCount?: number
    failedCount?: number
    results?: TestResult[]
  }>({ running: false })

  const handleRunDiagnostics = async () => {
    setTestSummary({ running: true })
    setShowTestsModal(true)
    try {
      const outcome = await runAcademyEngineeringTests()
      setTestSummary({
        running: false,
        allPassed: outcome.allPassed,
        passedCount: outcome.passedCount,
        failedCount: outcome.failedCount,
        results: outcome.results,
      })
    } catch {
      setTestSummary({ running: false, allPassed: false, failedCount: 1 })
    }
  }

  const currentExercise: ActivityExerciseStudentPayload | undefined = exercises[currentIndex]

  // Carrega os dados da missão e do progresso do usuário
  useEffect(() => {
    async function init() {
      setLoading(true)
      setError(null)
      try {
        const missionIdOrSlug = id || 'mis-resmat-flexao-01'
        const missionDef = await ActivityService.getMissionDefinition(missionIdOrSlug)

        if (!missionDef) {
          setError('Missão não encontrada ou ainda não publicada.')
          setLoading(false)
          return
        }

        setMission(missionDef)
        const exerciseList = await ActivityService.getMissionStudentExercises(missionDef.id)
        setExercises(exerciseList)

        // Inicia ou retoma a tentativa
        const currentUserId = user?.id || 'demo-student-user'
        const prog = await ActivityService.startOrResumeAttempt(missionDef.id, currentUserId)
        setProgress(prog)
        setCurrentIndex(prog.currentExerciseIndex || 0)

        // Se o exercício atual já foi respondido nessa tentativa, restaura feedback
        const currentExId = exerciseList[prog.currentExerciseIndex || 0]?.id
        if (currentExId && prog.answers[currentExId]) {
          const prior = prog.answers[currentExId]
          setLastGrade(prior.result)
          if (prior.submission.studentAnswer.selectedOptionIds?.[0]) {
            setSelectedOptionId(prior.submission.studentAnswer.selectedOptionIds[0])
          }
          if (prior.submission.studentAnswer.numericValue) {
            setNumericInput(String(prior.submission.studentAnswer.numericValue))
          }
          setHintsRevealed(prior.submission.hintsUsedCount || 0)
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Falha ao inicializar a missão.')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [id, user?.id])

  // Limpa campos ao mudar de exercício
  const handleSelectExerciseIndex = async (index: number) => {
    if (!progress || index < 0 || index >= exercises.length) return
    setCurrentIndex(index)
    setSelectedOptionId(null)
    setNumericInput('')
    setHintsRevealed(0)
    setLastGrade(null)
    setPerceivedDifficulty(null)
    setGuessed(false)

    const exId = exercises[index]?.id
    if (exId && progress.answers[exId]) {
      const prior = progress.answers[exId]
      setLastGrade(prior.result)
      if (prior.submission.studentAnswer.selectedOptionIds?.[0]) {
        setSelectedOptionId(prior.submission.studentAnswer.selectedOptionIds[0])
      }
      if (prior.submission.studentAnswer.numericValue) {
        setNumericInput(String(prior.submission.studentAnswer.numericValue))
      }
      setHintsRevealed(prior.submission.hintsUsedCount || 0)
    }

    await ActivityService.setExerciseIndex(progress.attemptId, index)
  }

  // Recebe valor transferido da calculadora técnica
  const handleCalculatorTransfer = (formatted: string) => {
    setNumericInput(formatted)
    toast({
      title: 'Resultado Transferido!',
      description: `O valor ${formatted} foi preenchido no campo de resposta.`,
    })
  }

  // Solicita exibição de dica opcional
  const handleRevealNextHint = () => {
    if (!currentExercise || hintsRevealed >= currentExercise.hints.length) return
    const nextHint = currentExercise.hints[hintsRevealed]
    setHintsRevealed((prev) => prev + 1)
    toast({
      title: 'Dica Revelada',
      description: `Dica ativada (-${nextHint.xpCost} XP se acertar).`,
    })
  }

  // Submissão da resposta à camada de serviço
  const handleSubmitAnswer = async () => {
    if (!currentExercise || !progress) return

    // Valida preenchimento prévio
    if (
      (currentExercise.type === 'single_choice' ||
        currentExercise.type === 'engineering_decision') &&
      !selectedOptionId
    ) {
      toast({
        title: 'Selecione uma alternativa',
        description: 'É necessário indicar uma alternativa antes de confirmar.',
        variant: 'destructive',
      })
      return
    }

    if (currentExercise.type === 'numeric_response' && !numericInput.trim()) {
      toast({
        title: 'Insira um valor numérico',
        description: 'Digite o valor calculado ou use o botão transferir da calculadora.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const studentAnswer = {
        selectedOptionIds: selectedOptionId ? [selectedOptionId] : undefined,
        numericValue: numericInput,
        choiceId: selectedOptionId || undefined,
      }

      const outcome = await ActivityService.submitExerciseAnswer(
        {
          attemptId: progress.attemptId,
          exerciseId: currentExercise.id,
          studentAnswer,
          hintsUsedCount: hintsRevealed,
          perceivedDifficulty: perceivedDifficulty || undefined,
          guessed,
        },
        user?.id || 'demo-student-user',
      )

      setLastGrade(outcome.gradeResult)
      setProgress(outcome.updatedProgress)

      if (outcome.gradeResult.isCorrect) {
        toast({
          title: 'Resposta Correta!',
          description:
            outcome.xpAwardedInThisAction > 0
              ? `Parabéns! +${outcome.xpAwardedInThisAction} XP conquistados.`
              : 'Exercício validado (XP já registrado nesta tentativa).',
        })
      } else {
        toast({
          title: 'Resposta Incorreta',
          description: 'Leia o comentário técnico e tente novamente.',
          variant: 'destructive',
        })
      }
    } catch (err: unknown) {
      toast({
        title: 'Erro ao validar resposta',
        description: err instanceof Error ? err.message : 'Falha no serviço de avaliação.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextExercise = () => {
    if (currentIndex < exercises.length - 1) {
      handleSelectExerciseIndex(currentIndex + 1)
    }
  }

  const handleRestartMission = async () => {
    if (!mission) return
    const currentUserId = user?.id || 'demo-student-user'
    const newProg = await ActivityService.resetAttempt(mission.id, currentUserId)
    setProgress(newProg)
    setCurrentIndex(0)
    setSelectedOptionId(null)
    setNumericInput('')
    setHintsRevealed(0)
    setLastGrade(null)
    toast({
      title: 'Missão Reiniciada',
      description: 'Uma nova tentativa foi aberta para prática deliberada.',
    })
  }

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#01B59A] border-t-transparent mx-auto" />
        <p className="text-xs font-mono text-[#A8BBC0] uppercase tracking-wider">
          Carregando motor interativo da missão...
        </p>
      </div>
    )
  }

  if (error || !mission || exercises.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-xl border border-[#C86F63]/50 bg-[#C86F63]/10 text-[#C86F63] text-sm">
          {error || 'Missão não disponível no catálogo.'}
        </div>
        <Button asChild variant="outline" className="border-[#294149] text-white">
          <Link to="/app/trilhas">Voltar ao Mapa de Trilhas</Link>
        </Button>
      </div>
    )
  }

  const isCurrentExerciseCompleted = Boolean(
    progress?.completedExerciseIds.includes(currentExercise?.id || ''),
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Barra de Topo da Missão */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#294149] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to={`/app/trilhas/${mission.trackSlug}`}
              className="text-xs text-[#A8BBC0] hover:text-[#01B59A] flex items-center gap-1 transition-colors font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Mapa da Trilha
            </Link>
            <span className="text-[#A8BBC0]">•</span>
            <Badge
              variant="outline"
              className="text-[10px] border-[#01B59A]/40 text-[#01B59A] font-mono"
            >
              Missão Ativa
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {mission.title}
          </h1>
          <p className="text-xs text-[#A8BBC0] max-w-2xl">{mission.headline}</p>
        </div>

        {/* Placar Gamificado Sóbrio de Progresso e XP */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRunDiagnostics}
            className="border-[#294149] text-xs text-[#A8BBC0] hover:text-[#01B59A] font-mono h-9"
            title="Executar verificação de cálculo, tolerância e idempotência"
          >
            <ShieldAlert className="h-3.5 w-3.5 mr-1 text-[#01B59A]" />
            Testes Técnicos
          </Button>

          <div className="bg-[#152228] border border-[#294149] rounded-xl px-3 py-1.5 text-right font-mono">
            <span className="text-[10px] text-[#A8BBC0] block uppercase">XP na Sessão</span>
            <span className="text-base font-bold text-[#01B59A]">
              +{progress?.totalXpEarned || 0} XP
            </span>
          </div>

          <div className="bg-[#152228] border border-[#294149] rounded-xl px-3 py-1.5 text-right font-mono">
            <span className="text-[10px] text-[#A8BBC0] block uppercase">Progresso</span>
            <span className="text-sm font-bold text-white">
              {progress?.completedExerciseIds.length || 0} / {exercises.length}
            </span>
          </div>
        </div>
      </div>

      {/* Régua de Navegação dos 5 Exercícios Progressivos */}
      <div className="grid grid-cols-5 gap-2">
        {exercises.map((ex, idx) => {
          const isDone = progress?.completedExerciseIds.includes(ex.id)
          const isCurrent = idx === currentIndex

          return (
            <button
              key={ex.id}
              type="button"
              onClick={() => handleSelectExerciseIndex(idx)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isCurrent
                  ? 'border-[#01B59A] bg-[#01B59A]/15 ring-2 ring-[#01B59A]/30'
                  : isDone
                    ? 'border-[#1D957A]/50 bg-[#1D957A]/10 hover:border-[#1D957A]'
                    : 'border-[#294149] bg-[#0C1317] hover:border-[#294149]/80 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className={isCurrent ? 'text-[#01B59A] font-bold' : 'text-[#A8BBC0]'}>
                  0{ex.order}
                </span>
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#01B59A]" />
                ) : (
                  <span className="text-[9px] text-[#A8BBC0] font-mono">
                    {ex.type === 'numeric_response' ? 'NUM' : 'MULT'}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-white truncate mt-1">
                {ex.title.replace(/^\d+\.\s*/, '')}
              </p>
            </button>
          )
        })}
      </div>

      {/* Card Principal do Exercício Ativo */}
      <div className="rounded-2xl border border-[#294149] bg-[#0C1317] p-5 sm:p-7 shadow-2xl space-y-6">
        {/* Cabeçalho do Exercício */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#294149] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-[#152228] text-[#01B59A] border border-[#294149] text-[10px] font-mono">
                Exercício {currentExercise.order} de {exercises.length}
              </Badge>
              <span className="text-[11px] font-mono text-[#A8BBC0]">
                {currentExercise.competencyCode}
              </span>
              <span className="text-[11px] font-mono text-[#A8BBC0]">•</span>
              <span className="text-[11px] font-mono text-[#01B59A]">
                +{currentExercise.xpRewardBase} XP base
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{currentExercise.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            {currentExercise.hints.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRevealNextHint}
                disabled={
                  hintsRevealed >= currentExercise.hints.length || isCurrentExerciseCompleted
                }
                className="border-[#294149] text-xs text-[#A8BBC0] hover:text-[#01B59A] h-8"
              >
                <Lightbulb className="h-3.5 w-3.5 mr-1.5 text-[#C69B4B]" />
                {hintsRevealed >= currentExercise.hints.length
                  ? 'Todas as dicas vistas'
                  : `Ver Dica (${hintsRevealed}/${currentExercise.hints.length})`}
              </Button>
            )}
          </div>
        </div>

        {/* Dicas Reveladas (com aviso pedagógico de penalidade de XP) */}
        {hintsRevealed > 0 && (
          <div className="space-y-2">
            {currentExercise.hints.slice(0, hintsRevealed).map((h, i) => (
              <div
                key={h.id}
                className="rounded-xl border border-[#C69B4B]/30 bg-[#C69B4B]/10 p-3.5 text-xs text-white space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-[#C69B4B]">
                  <span className="flex items-center gap-1">
                    <Lightbulb className="h-3.5 w-3.5" /> Dica Técnica {i + 1}
                  </span>
                  <span>Custo: -{h.xpCost} XP</span>
                </div>
                <SanitizedMarkdownViewer content={h.textMarkdown} />
              </div>
            ))}
          </div>
        )}

        {/* Enunciado Formatado em Markdown e LaTeX */}
        <div className="text-sm leading-relaxed text-[#E6EAED]">
          <SanitizedMarkdownViewer content={currentExercise.promptMarkdown} />
        </div>

        {/* ÁREA DE RESPOSTA INTERATIVA DEPENDENDO DO TIPO */}
        <div className="pt-2">
          {/* Caso 1: Escolha Única / Decisão */}
          {(currentExercise.type === 'single_choice' ||
            currentExercise.type === 'engineering_decision') && (
            <div className="space-y-2.5">
              {currentExercise.options?.map((opt) => {
                const isSelected = selectedOptionId === opt.id
                let borderClass = 'border-[#294149] hover:border-[#01B59A]/60 bg-[#152228]/60'

                if (lastGrade) {
                  const isCorrectOption = lastGrade.correctOptionIds?.includes(opt.id)
                  if (isCorrectOption) {
                    borderClass = 'border-[#01B59A] bg-[#01B59A]/15 text-white'
                  } else if (isSelected && !lastGrade.isCorrect) {
                    borderClass = 'border-[#C86F63] bg-[#C86F63]/15 text-white'
                  } else {
                    borderClass = 'border-[#294149]/40 opacity-50'
                  }
                } else if (isSelected) {
                  borderClass = 'border-[#01B59A] bg-[#01B59A]/10 text-white'
                }

                return (
                  <div
                    key={opt.id}
                    onClick={() => !lastGrade && setSelectedOptionId(opt.id)}
                    className={`flex items-start gap-3 rounded-xl border p-4 transition-all cursor-pointer ${borderClass}`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-mono font-bold mt-0.5 ${
                        isSelected
                          ? 'border-[#01B59A] bg-[#01B59A] text-black'
                          : 'border-[#294149] text-[#A8BBC0]'
                      }`}
                    >
                      {opt.label}
                    </div>

                    <div className="flex-1 text-sm text-[#E6EAED]">
                      <SanitizedMarkdownViewer content={opt.textMarkdown} />
                    </div>

                    {lastGrade && lastGrade.correctOptionIds?.includes(opt.id) && (
                      <CheckCircle2 className="h-5 w-5 text-[#01B59A] shrink-0 mt-0.5" />
                    )}
                    {lastGrade && isSelected && !lastGrade.isCorrect && (
                      <XCircle className="h-5 w-5 text-[#C86F63] shrink-0 mt-0.5" />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Caso 2: Numérico com suporte pt-BR e unidade */}
          {currentExercise.type === 'numeric_response' && (
            <div className="rounded-xl border border-[#294149] bg-[#152228]/50 p-4 space-y-3">
              <label className="text-xs font-mono uppercase tracking-wider text-[#A8BBC0] block">
                Insira sua resposta calculada:
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    value={numericInput}
                    onChange={(e) => setNumericInput(e.target.value)}
                    disabled={Boolean(lastGrade?.isCorrect)}
                    placeholder={currentExercise.numericPlaceholder || 'Ex: 25,0'}
                    className="border-[#294149] bg-[#0C1317] text-white font-mono text-base h-11"
                  />
                </div>

                {currentExercise.numericUnit && (
                  <span className="font-mono text-sm font-bold text-[#01B59A] self-center shrink-0">
                    [{currentExercise.numericUnit}]
                  </span>
                )}
              </div>

              <p className="text-[11px] text-[#A8BBC0]">
                Dica: O formato numérico brasileiro com vírgula ou ponto é aceito. Você pode efetuar
                os cálculos na calculadora técnica integrada e clicar em "Transferir".
              </p>
            </div>
          )}
        </div>

        {/* FEEDBACK COMENTADO APÓS SUBMISSÃO */}
        {lastGrade && (
          <div className="rounded-xl border border-[#294149] bg-[#152228] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#294149] pb-3">
              <div className="flex items-center gap-2">
                {lastGrade.isCorrect ? (
                  <span className="text-[#01B59A] flex items-center gap-1.5 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5" /> Resposta Correta!
                  </span>
                ) : (
                  <span className="text-[#C86F63] flex items-center gap-1.5 font-bold text-sm">
                    <XCircle className="h-5 w-5" /> Resposta Incorreta
                  </span>
                )}
              </div>

              {lastGrade.isCorrect && (
                <Badge className="bg-[#01B59A] text-black font-mono font-bold text-xs">
                  +{lastGrade.xpEarned} XP Concedidos
                </Badge>
              )}
            </div>

            {/* Justificativa do distrator se aplicável */}
            {lastGrade.feedbackRationale && (
              <div className="p-3 rounded-lg bg-[#0C1317] border border-[#294149] text-xs space-y-1">
                <span className="font-mono text-[#01B59A] font-bold block">
                  Análise da sua escolha:
                </span>
                <p className="text-[#E6EAED]">{lastGrade.feedbackRationale}</p>
              </div>
            )}

            {/* Detalhes numéricos de tolerância */}
            {lastGrade.numericDetails && (
              <div className="p-3 rounded-lg bg-[#0C1317] border border-[#294149] text-xs font-mono space-y-1 text-[#A8BBC0]">
                <div>
                  Valor esperado:{' '}
                  <span className="text-white font-bold">
                    {lastGrade.numericDetails.expected} {lastGrade.numericDetails.unit}
                  </span>{' '}
                  (Tolerância: ±{lastGrade.numericDetails.tolerance})
                </div>
                {lastGrade.numericDetails.userParsedValue !== undefined && (
                  <div>
                    Valor computado da sua entrada:{' '}
                    <span className="text-[#01B59A]">
                      {lastGrade.numericDetails.userParsedValue} {lastGrade.numericDetails.unit}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Resolução Técnica Completa com LaTeX */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-white block">
                Comentário Técnico & Resolução:
              </span>
              <div className="text-xs leading-relaxed text-[#A8BBC0] pt-1 border-t border-[#294149]">
                <SanitizedMarkdownViewer content={lastGrade.explanationMarkdown} />
              </div>
            </div>

            {/* Avaliação de Dificuldade Percebida (1-5) e "Acertei, mas não tinha certeza" */}
            <div className="pt-3 border-t border-[#294149] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-mono text-[#A8BBC0]">
                  Qual foi a dificuldade percebida desta questão?
                </span>
                <div className="flex items-center gap-1.5">
                  {([1, 2, 3, 4, 5] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPerceivedDifficulty(lvl)}
                      className={`h-7 w-7 rounded-md font-mono text-xs font-bold transition-colors ${
                        perceivedDifficulty === lvl
                          ? 'bg-[#01B59A] text-black'
                          : 'bg-[#0C1317] text-[#A8BBC0] hover:text-white border border-[#294149]'
                      }`}
                      title={`Nível ${lvl}`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {lastGrade.isCorrect && (
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="chk-guess"
                    checked={guessed}
                    onCheckedChange={(c) => setGuessed(Boolean(c))}
                  />
                  <label
                    htmlFor="chk-guess"
                    className="text-xs text-[#A8BBC0] cursor-pointer select-none"
                  >
                    Acertei, mas não tinha total certeza (registrar para telemetria adaptativa)
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Barra de Ações (Confirmar ou Avançar) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#294149]">
          <div className="text-xs font-mono text-[#A8BBC0]">
            {isCurrentExerciseCompleted && (
              <span className="text-[#01B59A] flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Exercício concluído nesta tentativa
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!lastGrade?.isCorrect ? (
              <Button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-bold text-xs h-10 px-5"
              >
                {isSubmitting ? 'Avaliando...' : 'Confirmar Resposta'}
              </Button>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {currentIndex < exercises.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNextExercise}
                    className="w-full sm:w-auto bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-bold text-xs h-10 px-5 flex items-center gap-1.5"
                  >
                    <span>Próximo Exercício</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => navigate(`/app/trilhas/${mission.trackSlug}`)}
                    className="w-full sm:w-auto bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-bold text-xs h-10 px-5 flex items-center gap-1.5"
                  >
                    <span>Concluir Missão & Voltar à Trilha</span>
                    <Award className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bloco de Conclusão Global se a Missão for finalizada */}
      {progress?.isCompleted && (
        <div className="rounded-2xl border-2 border-[#01B59A] bg-gradient-to-r from-[#152228] to-[#0C1317] p-6 text-center space-y-3 shadow-2xl">
          <Award className="h-10 w-10 text-[#01B59A] mx-auto" />
          <h3 className="text-xl font-extrabold text-white">
            Missão de Flexão de Vigas Concluída com Sucesso!
          </h3>
          <p className="text-xs text-[#A8BBC0] max-w-xl mx-auto">
            Você percorreu os 5 exercícios fundamentais de dimensionamento, cálculo de flecha e
            julgamento de estados limites.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRestartMission}
              className="border-[#294149] text-xs text-white"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Praticar Novamente
            </Button>
            <Button
              asChild
              className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-bold text-xs"
            >
              <Link to={`/app/trilhas/${mission.trackSlug}`}>Retornar à Trilha</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Calculadora Técnica Integrada (painel flutuante / adaptativo) */}
      <EngineeringCalculator
        onTransferResult={handleCalculatorTransfer}
        targetUnit={currentExercise.numericUnit}
      />

      {/* Modal / Gaveta de Diagnósticos de Teste (Critério 10) */}
      {showTestsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-xl w-full rounded-2xl border border-[#294149] bg-[#0C1317] p-5 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#294149] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#01B59A]" />
                <h3 className="text-sm font-bold font-mono text-white">
                  Diagnóstico Técnico Automatizado (Critério 10)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTestsModal(false)}
                className="text-[#A8BBC0] hover:text-white text-xs font-mono"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              {testSummary.running ? (
                <div className="py-8 text-center space-y-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#01B59A] border-t-transparent mx-auto" />
                  <p className="text-[#A8BBC0]">Executando suíte de testes de engenharia...</p>
                </div>
              ) : testSummary.results ? (
                <div className="space-y-3">
                  <div
                    className={`p-3 rounded-lg border text-xs ${
                      testSummary.allPassed
                        ? 'border-[#01B59A]/50 bg-[#01B59A]/10 text-[#01B59A]'
                        : 'border-[#C86F63]/50 bg-[#C86F63]/10 text-[#C86F63]'
                    }`}
                  >
                    <span className="font-bold">
                      {testSummary.allPassed
                        ? `✓ Todos os ${testSummary.passedCount} testes passaram com sucesso!`
                        : `✗ ${testSummary.failedCount} teste(s) falharam.`}
                    </span>
                    <p className="text-[11px] text-[#A8BBC0] mt-0.5">
                      Parser aritmético sem eval, conversões de engenharia, tolerâncias e
                      idempotência de XP.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    {testSummary.results.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-2 p-2 rounded bg-[#152228] border border-[#294149]/60"
                      >
                        <span className="text-[11px] text-white">{r.name}</span>
                        {r.passed ? (
                          <span className="text-[#01B59A] font-bold shrink-0">PASS</span>
                        ) : (
                          <span className="text-[#C86F63] font-bold shrink-0">
                            FAIL ({r.error})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-2 border-t border-[#294149] flex justify-between items-center text-[11px] font-mono text-[#A8BBC0]">
              <span>Suíte validada em runtime (cliente/serviço)</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRunDiagnostics}
                className="h-7 text-xs border-[#294149]"
              >
                Rodar Novamente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActivityPlayerPage
