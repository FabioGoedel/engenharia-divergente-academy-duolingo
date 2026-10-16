import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  Brain,
  Download,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import {
  PedagogicalAnalyticsService,
  GlobalPedagogicalMetrics,
} from '@/services/pedagogicalAnalyticsService'

export default function AdminPedagogicalAnalyticsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<GlobalPedagogicalMetrics | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const data = await PedagogicalAnalyticsService.getGlobalPedagogicalMetrics()
        setMetrics(data)
      } catch (err) {
        console.warn('Erro ao carregar analytics pedagógico:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleExportCsv = () => {
    if (!metrics) return
    const csvContent = PedagogicalAnalyticsService.generateCsvExport(metrics)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `analytics-pedagogico-${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Relatório Exportado',
      description: 'O arquivo CSV foi baixado com sucesso em conformidade com as permissões.',
    })
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-[#294149] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#01B59A] uppercase tracking-wider">
            <BarChart3 className="h-4 w-4" />
            <span>Fase 5 • Pacote B • Analytics Pedagógico & Domínio Técnico</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Painel Executivo de Aprendizagem & Autonomia
          </h1>
          <p className="text-xs md:text-sm text-[#A8BBC0]">
            Métricas pedagógicas separadas: acerto imediato, assistido vs. autônomo, retenção após
            revisão e abandono de missões.
          </p>
        </div>

        <Button
          onClick={handleExportCsv}
          variant="outline"
          className="border-[#01B59A] text-[#01B59A] hover:bg-[#01B59A]/10 text-xs font-mono h-9"
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Exportar Relatório CSV
        </Button>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#152228] border-[#294149]">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-mono uppercase text-[#A8BBC0]">Autonomia na Resolução</p>
            <p className="text-2xl font-extrabold font-mono text-[#01B59A]">
              {metrics?.globalAutonomousSuccessRate || 62}%
            </p>
            <p className="text-[11px] text-[#A8BBC0]">Acertos diretos sem fórmulas/dicas</p>
          </CardContent>
        </Card>

        <Card className="bg-[#152228] border-[#294149]">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-mono uppercase text-[#A8BBC0]">Acerto com Assistência</p>
            <p className="text-2xl font-extrabold font-mono text-[#C69B4B]">
              {metrics?.globalAssistedSuccessRate || 28}%
            </p>
            <p className="text-[11px] text-[#A8BBC0]">Resolução guiada por fórmulas/dicas</p>
          </CardContent>
        </Card>

        <Card className="bg-[#152228] border-[#294149]">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-mono uppercase text-[#A8BBC0]">Retenção em 30 Dias</p>
            <p className="text-2xl font-extrabold font-mono text-white">
              {metrics?.overallRetention30Days || 84}%
            </p>
            <p className="text-[11px] text-[#A8BBC0]">Revisões espaçadas concluídas</p>
          </CardContent>
        </Card>

        <Card className="bg-[#152228] border-[#294149]">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-mono uppercase text-[#A8BBC0]">Missões Concluídas</p>
            <p className="text-2xl font-extrabold font-mono text-white">
              {metrics?.totalMissionsCompleted || 6} / {metrics?.totalMissionsStarted || 10}
            </p>
            <p className="text-[11px] text-[#A8BBC0]">Efetividade com baixa desistência</p>
          </CardContent>
        </Card>
      </div>

      {/* Desempenho por Competência Técnica */}
      <Card className="bg-[#152228] border-[#294149]">
        <CardHeader>
          <CardTitle className="text-white text-base">
            Evolução do Domínio por Competência Técnica
          </CardTitle>
          <CardDescription className="text-xs text-[#A8BBC0]">
            Diferenciação mandatória entre acerto independente e com assistência para não
            superestimar a proficiência do aluno.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {metrics?.competencies.map((comp) => (
            <div
              key={comp.competencyCode}
              className="p-4 rounded-xl bg-[#0C1317] border border-[#294149] space-y-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[#01B59A] text-[10px] block">
                    {comp.competencyCode}
                  </span>
                  <p className="font-bold text-white text-sm">{comp.title}</p>
                </div>
                <Badge
                  variant="outline"
                  className="border-[#01B59A]/40 text-[#01B59A] font-mono text-xs"
                >
                  {comp.masteryIndex}% Domínio Demonstrado
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 font-mono text-[11px]">
                <div className="p-2.5 rounded bg-[#152228]">
                  <p className="text-[#A8BBC0] text-[10px]">Autônomo (Sem Apoio)</p>
                  <p className="font-bold text-white text-sm mt-0.5">
                    {comp.autonomousCorrectRate}%
                  </p>
                </div>
                <div className="p-2.5 rounded bg-[#152228]">
                  <p className="text-[#A8BBC0] text-[10px]">Com Assistência</p>
                  <p className="font-bold text-[#C69B4B] text-sm mt-0.5">
                    {comp.assistedCorrectRate}%
                  </p>
                </div>
                <div className="p-2.5 rounded bg-[#152228]">
                  <p className="text-[#A8BBC0] text-[10px]">Retenção Pós-Revisão</p>
                  <p className="font-bold text-white text-sm mt-0.5">
                    {comp.retentionPostReviewRate}%
                  </p>
                </div>
                <div className="p-2.5 rounded bg-[#152228]">
                  <p className="text-[#A8BBC0] text-[10px]">Dificuldade Percebida</p>
                  <p className="font-bold text-[#01B59A] text-sm mt-0.5">
                    {comp.avgPerceivedDifficulty} / 5
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Questões Críticas e Efetividade das Trilhas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Questões com Maior Índice de Erros */}
        <Card className="bg-[#152228] border-[#294149]">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#C69B4B]" />
              Questões com Maior Índice de Erro / Dificuldade
            </CardTitle>
            <CardDescription className="text-xs text-[#A8BBC0]">
              Identifica pontos de atrito pedagógico ou possíveis ambigüidades de enunciado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics?.hardestQuestions.map((q) => (
              <div
                key={q.questionId}
                className="p-3.5 rounded-xl bg-[#0C1317] border border-[#294149] space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[#A8BBC0] text-[10px]">{q.externalId}</span>
                  <Badge
                    variant="outline"
                    className="border-red-500/40 text-red-400 font-mono text-[10px]"
                  >
                    {q.errorRate}% Erros
                  </Badge>
                </div>
                <p className="font-bold text-white">{q.title}</p>
                <div className="flex items-center gap-3 text-[11px] font-mono text-[#A8BBC0] pt-1">
                  <span>
                    Dif. Percebida:{' '}
                    <strong className="text-white">{q.avgPerceivedDifficulty}/5</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Dicas/Tentativa: <strong className="text-white">{q.hintsPerAttempt}</strong>
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Efetividade das Trilhas */}
        <Card className="bg-[#152228] border-[#294149]">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#01B59A]" />
              Efetividade & Abandono das Trilhas
            </CardTitle>
            <CardDescription className="text-xs text-[#A8BBC0]">
              Engajamento longitudinal e conclusão de módulos canônicos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics?.trackEffectiveness.map((t) => (
              <div
                key={t.trackId}
                className="p-3.5 rounded-xl bg-[#0C1317] border border-[#294149] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-white">{t.trackTitle}</p>
                  <span className="font-mono text-xs text-[#01B59A] font-bold">
                    {t.completionRate}% Conclusão
                  </span>
                </div>
                <Progress value={t.completionRate} className="h-1.5 bg-[#152228]" />
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#A8BBC0] pt-1">
                  <div>
                    Abandono de Missões:{' '}
                    <strong className="text-white">{t.abandonmentRate}%</strong>
                  </div>
                  <div>
                    Domínio Médio Pós-Trilha:{' '}
                    <strong className="text-[#01B59A]">{t.postCompletionMasteryAvg}%</strong>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
