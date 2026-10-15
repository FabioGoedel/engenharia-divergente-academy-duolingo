import React from 'react'
import {
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  Calendar,
  Database,
  ArrowRight,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ADMIN_COURSES } from '@/data/demoData'
import { useToast } from '@/hooks/use-toast'

export default function AdminReportsPage() {
  const { toast } = useToast()

  const handleExportCsv = () => {
    toast({
      title: 'Exportação de Relatório (Demonstração)',
      description:
        'Download de arquivo .csv simulado. Os dados refletem o dataset demonstrativo da Fase 1.',
    })
  }

  const completionData = ADMIN_COURSES.map((c) => ({
    name: c.title.split(':')[0].substring(0, 18),
    taxa: c.completionRate,
    alunos: c.enrolledStudents,
  }))

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#C69B4B] uppercase tracking-wider mb-1">
            <FileText className="h-4 w-4" />
            <span>Auditoria, Desempenho & Roadmap</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Relatórios & Planejamento da Fase 2
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Análise consolidada da eficácia de ensino e planejamento objetivo das próximas etapas.
          </p>
        </div>

        <Button
          onClick={handleExportCsv}
          variant="outline"
          className="border-border text-xs h-9 self-start sm:self-auto flex items-center gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar CSV (Demonstração)</span>
        </Button>
      </div>

      {/* Gráfico de Eficácia e Taxa de Conclusão */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground">
              Taxa de Conclusão por Trilha Cadastrada (%)
            </CardTitle>
            <span className="text-[10px] font-mono text-primary uppercase">
              Métrica de Retenção
            </span>
          </div>
          <CardDescription className="text-xs">
            Percentual de alunos que completaram com êxito todos os módulos da trilha.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="#A8BBC0" fontSize={11} tickLine={false} />
                <YAxis stroke="#A8BBC0" fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#152228',
                    borderColor: '#294149',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [`${val}%`, 'Taxa de Conclusão']}
                />
                <Bar dataKey="taxa" fill="#01B59A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO OBRIGATÓRIA: Planejamento Objetivo da Próxima Fase (Fase 2) */}
      <Card className="bg-card border-[#01B59A]/40 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-bold text-foreground">
                Plano Objetivo da Próxima Fase: Fase 2 — CMS & Biblioteca Multimaterial
              </CardTitle>
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-mono">
              ROADMAP OFICIAL
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Entregáveis e escopo técnico acordados para a continuação da plataforma Engenharia
            Divergente.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-border bg-background/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-mono">
                  1
                </span>
                <span>Editor de Trilhas & Estrutura Hierárquica</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Interface administrativa para criação drag-and-drop de módulos, aulas e tópicos, com
                vinculação de pré-requisitos lógicos e regras de pontuação de XP.
              </p>
              <div className="text-[11px] font-mono text-[#C69B4B]">
                Status atual: <strong>PENDENTE</strong> (estruturado conceitualmente em SQL)
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-background/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-mono">
                  2
                </span>
                <span>Biblioteca Multimaterial & Storage</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Upload e streaming de vídeo-aulas (integração Bunny/Vimeo/Cloudflare), arquivos de
                malha (.step, .iges, .sldprt), cadernos Jupyter de formulação MEF e PDFs normativos.
              </p>
              <div className="text-[11px] font-mono text-[#C69B4B]">
                Status atual: <strong>PENDENTE</strong> (aguardando Supabase Storage)
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-background/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-mono">
                  3
                </span>
                <span>Player de Atividades & Submissão Numérica</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Reprodutor multimídia integrado com verificação automática de respostas numéricas
                (tolerância de convergência de tensão e deslocamento).
              </p>
              <div className="text-[11px] font-mono text-[#C69B4B]">
                Status atual: <strong>PENDENTE</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-background/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-mono">
                  4
                </span>
                <span>Conexão Real do Supabase (Auth, RLS, Webhooks)</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Substituição pontual dos métodos de <code>src/services/</code> por chamadas ao
                cliente Supabase real, executando a migration <code>0001_initial_schema.sql</code>{' '}
                já pronta.
              </p>
              <div className="text-[11px] font-mono text-primary">
                Pronto para conexão imediata via variáveis de ambiente
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
