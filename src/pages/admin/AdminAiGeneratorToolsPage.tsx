import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Copy,
  Check,
  Download,
  FileCode,
  BookOpen,
  Send,
  Boxes,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ContentBlock, QuestionBankItem } from '@/types/cms'
import { BlockService } from '@/services/blockService'
import { QuestionBankService } from '@/services/questionBankService'
import { ImportExportService } from '@/services/importExportService'
import { getAllBlockDefinitions } from '@/components/cms/BlockRegistry'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

export const AdminAiGeneratorToolsPage: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()

  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [selectedBlockType, setSelectedBlockType] = useState<string>('single_choice')
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [questions, setQuestions] = useState<QuestionBankItem[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string>('')
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('')

  // Carrega blocos e questões existentes para permitir exportação rápida
  useEffect(() => {
    const loadExisting = async () => {
      const blks = await BlockService.listBlocks()
      const qsts = await QuestionBankService.listQuestions()
      setBlocks(blks)
      setQuestions(qsts)
      if (blks.length > 0) setSelectedBlockId(blks[0].id)
      if (qsts.length > 0) setSelectedQuestionId(qsts[0].id)
    }
    loadExisting()
  }, [])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast({ title: 'Copiado para a área de transferência!' })
    setTimeout(() => setCopiedKey(null), 2500)
  }

  // Exemplos de esquemas JSON por tipo de bloco
  const blockExamples: Record<string, object> = {
    single_choice: {
      id: 'blk-ia-sc-01',
      block_type: 'single_choice',
      title: 'Critério de von Mises vs Rankine',
      category: 'assessment',
      subject_area: 'Resistência dos Materiais',
      associated_competencies: ['COMP-RESMAT-03'],
      initial_difficulty: 3,
      estimated_minutes: 6,
      tags: ['Critérios', 'von Mises', 'Dúctil'],
      author: 'Gerado por ChatGPT/Claude',
      completion_policy: 'submitted',
      config: {
        prompt:
          'Em um vaso de pressão de parede fina com tensões principais $\\sigma_1 = 200\\text{ MPa}$ e $\\sigma_2 = 100\\text{ MPa}$ ($\\sigma_3 = 0$), qual é a tensão equivalente de von Mises $\\sigma_{vm}$?',
        options: [
          {
            id: 'opt-a',
            label: 'A',
            text: '$\\sigma_{vm} = 173{,}2\\text{ MPa}$',
            rationale:
              'Correto: $\\sigma_{vm} = \\sqrt{200^2 - 200(100) + 100^2} = \\sqrt{30000} \\approx 173{,}2\\text{ MPa}$.',
          },
          {
            id: 'opt-b',
            label: 'B',
            text: '$\\sigma_{vm} = 200{,}0\\text{ MPa}$',
            rationale:
              'Incorreto: $200\\text{ MPa}$ seria a máxima tensão principal (critério de Rankine), não de von Mises.',
          },
          {
            id: 'opt-c',
            label: 'C',
            text: '$\\sigma_{vm} = 300{,}0\\text{ MPa}$',
            rationale:
              'Incorreto: somar as tensões principais viola a formulação da energia de distorção.',
          },
        ],
        correctOptionId: 'opt-a',
        explanation:
          'Para o estado plano de tensões, a equação canônica de von Mises é $\\sigma_{vm} = \\sqrt{\\sigma_1^2 - \\sigma_1\\sigma_2 + \\sigma_2^2}$. Substituindo: $\\sqrt{40000 - 20000 + 10000} = 173{,}2\\text{ MPa}$.',
      },
    },
    numeric_response: {
      id: 'blk-ia-num-02',
      block_type: 'numeric_response',
      title: 'Tensão de Cisalhamento em Eixo sob Torção',
      category: 'assessment',
      subject_area: 'Mecânica dos Sólidos',
      associated_competencies: ['COMP-TORCAO-01'],
      initial_difficulty: 3,
      estimated_minutes: 8,
      tags: ['Torção', 'Eixos', 'Numérico'],
      author: 'Gerado por IA',
      completion_policy: 'submitted',
      config: {
        prompt:
          'Um eixo circular maciço de aço com diâmetro $d = 40\\text{ mm}$ transmite um torque $T = 1{,}2\\text{ kN}\\cdot\\text{m}$. Calcule a tensão máxima de cisalhamento $\\tau_{\\max}$ em $\\text{MPa}$:',
        expectedValue: 95.49,
        toleranceAbs: 1.0,
        unit: 'MPa',
        explanation:
          'Momento de inércia polar $J = \\frac{\\pi d^4}{32} = \\frac{\\pi (40)^4}{32} = 251.327\\text{ mm}^4$. Raio $c = 20\\text{ mm}$. Tensão $\\tau_{\\max} = \\frac{T c}{J} = \\frac{1.200.000 \\cdot 20}{251.327} = 95{,}49\\text{ MPa}$.',
      },
    },
    rich_text: {
      id: 'blk-ia-rt-03',
      block_type: 'rich_text',
      title: 'Equações Constitutivas da Lei de Hooke Generalizada',
      category: 'media',
      subject_area: 'Elasticidade',
      associated_competencies: ['COMP-ELAST-01'],
      initial_difficulty: 4,
      estimated_minutes: 10,
      tags: ['Hooke', 'Matriz Constitutiva', 'Teoria'],
      author: 'Gerado por IA',
      completion_policy: 'manual',
      config: {
        markdown:
          '## Relações Constitutivas em Meios Isotrópicos\n\nPara materiais elásticos lineares e isotrópicos, o tensor de deformações é relacionado ao tensor de tensões pela equação:\n\n$$\\boldsymbol{\\varepsilon} = \\frac{1 + \\nu}{E} \\boldsymbol{\\sigma} - \\frac{\\nu}{E} \\operatorname{tr}(\\boldsymbol{\\sigma}) \\mathbf{I}$$\n\nOnde $E$ é o módulo de Young e $\\nu$ o coeficiente de Poisson.',
      },
    },
    checklist: {
      id: 'blk-ia-chk-04',
      block_type: 'checklist',
      title: 'Checklist de Validação de Condições de Contorno MEF',
      category: 'interaction',
      subject_area: 'Simulação Estrutural',
      associated_competencies: ['COMP-MEF-BC'],
      initial_difficulty: 2,
      estimated_minutes: 5,
      tags: ['Apoios', 'Restrições', 'Checklist'],
      author: 'Gerado por IA',
      completion_policy: 'checked',
      config: {
        id: 'chk-bc-01',
        title: 'Verificação Prévia de Restrições Cinemáticas',
        items: [
          {
            id: 'i1',
            label: 'Eliminar todos os 6 modos de corpo rígido sem hiper-restringir a peça',
          },
          {
            id: 'i2',
            label: 'Evitar aplicar apoios pontuais sobre nós isolados que gerem tensões infinitas',
          },
          {
            id: 'i3',
            label: 'Verificar se forças nodais distribuídas refletem a pressão real calculada',
          },
        ],
      },
    },
  }

  // Modelo de Prompt Avançado para Claude e ChatGPT
  const AI_MASTER_PROMPT = `Você é um Engenheiro Sênior e Especialista Pedagógico na Engenharia Divergente Academy (plataforma LMS de alto rigor técnico para engenharia estrutural, mecânica e civil).

Sua tarefa é gerar pacotes de conteúdo educacional no formato JSON canônico "ediv-content-package" (schema_version: "1.0.0").

### DIRETRIZES TÉCNICAS OBRIGATÓRIAS:
1. PRECISÃO TÉCNICA E NORMAS: Use equações matemáticas estritamente corretas com notação LaTeX (entre $...$ ou $$...$$). Cite normas técnicas vigentes quando aplicável (NBR 8800, NBR 6118, Eurocode, AISC, ASTM).
2. HIPÓTESES EXPLÍCITAS: Enuncie claramente as hipóteses físicas (ex: elasticidade linear, vigas esbeltas de Euler-Bernoulli vs Timoshenko, regime de pequenas deformações, etc.).
3. UNIDADES COERENTES: Use o Sistema Internacional (SI) adaptado para engenharia (forças em N ou kN, comprimentos em mm ou m, tensões em MPa ou GPa). Especifique unidades em todos os cálculos numéricos.
4. GABARITOS E DISTRATORES JUSTIFICADOS: Em questões de escolha única, forneça justificativas didáticas específicas para CADA alternativa, explicando por que os distratores estão errados e o erro conceitual típico que eles representam.
5. DIFICULDADE ESTIMADA: Classifique o authoringLevel de 1 a 5 (L1: revisão guiada; L2: aplicação direta; L3: diagnóstico investigativo; L4: síntese/normas; L5: julgamento de engenharia).
6. REGRA EDITORIAL: O campo editorialStatus deve ser SEMPRE "draft" (todo conteúdo passará por validação Zod e aprovação humana).

### FORMATO DE SAÍDA ESPERADO (RESPONDA ESTRITAMENTE EM JSON VÁLIDO):
{
  "schema_version": "1.0.0",
  "package_id": "pkg-[slug-do-tema]",
  "name": "[Nome descritivo do pacote]",
  "description": "[Breve resumo pedagógico]",
  "author": "ChatGPT/Claude via Engenharia Divergente Academy",
  "exported_at": "${new Date().toISOString()}",
  "media_assets": [],
  "questions": [
    {
      "id": "qst-[id-unico]",
      "externalId": "[SIGLA-NIVEL-NUMERO, ex: MEF-L3-Q042]",
      "title": "[Título técnico]",
      "questionType": "single_choice",
      "subjectArea": "[Área do conhecimento]",
      "competencyCode": "[COMP-XXX-01]",
      "prerequisites": ["Pré-requisito 1"],
      "authoringLevel": 3,
      "promptMarkdown": "[Enunciado técnico com fórmulas LaTeX]",
      "options": [
        {
          "id": "opt-a",
          "label": "A",
          "textMarkdown": "[Texto da alternativa]",
          "distractorRationale": "[Justificativa técnica detalhada]"
        },
        {
          "id": "opt-b",
          "label": "B",
          "textMarkdown": "[Texto da alternativa]",
          "distractorRationale": "[Explicação de por que esta opção é um distrator]"
        }
      ],
      "privateKey": {
        "correctOptionIds": ["opt-a"],
        "rubricNotes": "[Rubrica de correção e critério]"
      },
      "hint": "[Dica pedagógica socrática]",
      "explanationMarkdown": "[Resolução passo a passo completa com equações]",
      "estimatedSeconds": 180,
      "xpReward": 25,
      "tags": ["Tag1", "Tag2"],
      "editorialStatus": "draft",
      "version": 1
    }
  ],
  "blocks": [
    {
      "id": "blk-[id-unico]",
      "block_type": "single_choice",
      "title": "[Título do bloco]",
      "description": "[Descrição]",
      "category": "assessment",
      "subject_area": "[Área]",
      "associated_competencies": ["COMP-XXX-01"],
      "initial_difficulty": 3,
      "estimated_minutes": 6,
      "tags": ["Tag1"],
      "author": "IA",
      "completion_policy": "submitted",
      "version": 1,
      "editorial_status": "draft",
      "config": {
        "prompt": "[Enunciado]",
        "options": [
          { "id": "opt-1", "label": "A", "text": "...", "rationale": "..." },
          { "id": "opt-2", "label": "B", "text": "...", "rationale": "..." }
        ],
        "correctOptionId": "opt-1",
        "explanation": "[Explicação técnica]"
      },
      "media_references": []
    }
  ]
}

Gere agora 3 questões e 2 blocos sobre o tema: [INSERIR TEMA DESEJADO AQUI, ex: Flexão de Vigas I sob NBR 8800 / Análise de Tensões por MEF].`

  // Exporta bloco selecionado como JSON
  const handleExportSingleBlock = () => {
    const block = blocks.find((b) => b.id === selectedBlockId)
    if (!block) return

    const jsonStr = JSON.stringify(block, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bloco_${block.id}_${block.blockType}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({ title: 'Bloco exportado com sucesso!' })
  }

  // Exporta questão selecionada como JSON
  const handleExportSingleQuestion = () => {
    const question = questions.find((q) => q.id === selectedQuestionId)
    if (!question) return

    const jsonStr = JSON.stringify(question, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `questao_${question.externalId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({ title: 'Questão exportada com sucesso!' })
  }

  // Exporta acervo completo no formato de pacote canônico
  const handleExportAllCanonicalPackage = () => {
    const pkg = ImportExportService.exportToCanonicalPackage({
      packageName: 'Engenharia Divergente — Exportação de Acervo Completo',
      description: 'Lote completo de blocos e questões exportados da biblioteca da plataforma.',
      blocks,
      questions,
    })

    const jsonStr = JSON.stringify(pkg, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ediv_pacote_canonica_completo_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: 'Pacote canônico exportado',
      description: `${blocks.length} blocos e ${questions.length} questões incluídos no arquivo.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#294149] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Apoio à Geração de Conteúdo com IA
            </h1>
            <Badge variant="outline" className="text-[10px] border-[#01B59A]/40 text-[#01B59A]">
              ChatGPT & Claude Ready
            </Badge>
          </div>
          <p className="text-xs text-[#A8BBC0] mt-1">
            Gere centenas de atividades com IA externa usando nossos modelos de prompt calibrados e
            schemas canônicos; exporte e reutilize conteúdos estruturados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportAllCanonicalPackage}
            className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-semibold text-xs"
          >
            <Download className="h-4 w-4 mr-1.5" /> Exportar Pacote Canônico Completo
          </Button>
        </div>
      </div>

      {/* Alerta de Governança Editorial */}
      <div className="p-3.5 rounded-xl border border-[#C69B4B]/40 bg-[#C69B4B]/10 text-xs text-[#E6EAED] flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-[#C69B4B] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">
            Protocolo de Governança e Revisão Editorial Obrigatória:
          </p>
          <p className="text-[#A8BBC0] leading-relaxed">
            Conteúdos gerados por Inteligência Artificial devem sempre entrar na plataforma no
            estado <strong>Rascunho (draft)</strong> e passar obrigatoriamente pela validação de
            schemas Zod e pela fila de <strong>Revisão Editorial</strong>. Nenhum exercício
            importado de IA é publicado automaticamente para os alunos sem auditoria técnica de um
            coordenador (papel Admin).
          </p>
        </div>
      </div>

      {/* Tabs com as 3 Ferramentas */}
      <Tabs defaultValue="prompts" className="space-y-4">
        <TabsList className="bg-[#152228] border border-[#294149] text-xs">
          <TabsTrigger
            value="prompts"
            className="data-[state=active]:bg-[#01B59A] data-[state=active]:text-black"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Modelos de Prompt para ChatGPT / Claude
          </TabsTrigger>
          <TabsTrigger
            value="schemas"
            className="data-[state=active]:bg-[#01B59A] data-[state=active]:text-black"
          >
            <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Documentação & Schemas JSON
          </TabsTrigger>
          <TabsTrigger
            value="export"
            className="data-[state=active]:bg-[#01B59A] data-[state=active]:text-black"
          >
            <FileCode className="h-3.5 w-3.5 mr-1.5" /> Exportador de Blocos e Questões
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: MODELO DE PROMPT CALIBRADO */}
        <TabsContent value="prompts" className="space-y-4">
          <div className="rounded-xl border border-[#294149] bg-[#152228] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#01B59A]" />
                  Prompt Mestre para Produção em Massa de Conteúdo
                </h3>
                <p className="text-xs text-[#A8BBC0] mt-0.5">
                  Copie e cole este prompt no ChatGPT (GPT-4o) ou Claude 3.5 Sonnet para obter
                  pacotes 100% compatíveis com o importador da plataforma.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => copyToClipboard(AI_MASTER_PROMPT, 'prompt-master')}
                className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 text-xs font-semibold"
              >
                {copiedKey === 'prompt-master' ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar Prompt Mestre
                  </>
                )}
              </Button>
            </div>

            <pre className="font-mono text-[11px] text-[#A8BBC0] bg-[#0C1317] p-4 rounded-lg border border-[#294149] overflow-x-auto whitespace-pre-wrap max-h-96 leading-relaxed">
              {AI_MASTER_PROMPT}
            </pre>
          </div>
        </TabsContent>

        {/* ABA 2: DOCUMENTAÇÃO & EXEMPLOS DE CADA TIPO */}
        <TabsContent value="schemas" className="space-y-4">
          <div className="rounded-xl border border-[#294149] bg-[#152228] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#01B59A]" />
                  Exemplos Canônicos por Tipo de Bloco
                </h3>
                <p className="text-xs text-[#A8BBC0] mt-0.5">
                  Estrutura exata validada pelos schemas Zod do pacote{' '}
                  <code>ediv-content-package</code>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedBlockType}
                  onChange={(e) => setSelectedBlockType(e.target.value)}
                  className="h-8 rounded-md bg-[#0C1317] border border-[#294149] text-white text-xs px-2 font-mono"
                >
                  <option value="single_choice">Alternativa Única (single_choice)</option>
                  <option value="numeric_response">
                    Numérica com Tolerância (numeric_response)
                  </option>
                  <option value="rich_text">Texto com Markdown/LaTeX (rich_text)</option>
                  <option value="checklist">Lista de Verificação (checklist)</option>
                </select>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(blockExamples[selectedBlockType], null, 2),
                      `example-${selectedBlockType}`,
                    )
                  }
                  className="h-8 border-[#294149] text-xs text-white hover:border-[#01B59A]"
                >
                  {copiedKey === `example-${selectedBlockType}` ? (
                    <>
                      <Check className="h-3 w-3 mr-1" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" /> Copiar JSON
                    </>
                  )}
                </Button>
              </div>
            </div>

            <pre className="font-mono text-[11px] text-[#01B59A] bg-[#0C1317] p-4 rounded-lg border border-[#294149] overflow-x-auto max-h-80">
              {JSON.stringify(blockExamples[selectedBlockType] || {}, null, 2)}
            </pre>
          </div>
        </TabsContent>

        {/* ABA 3: EXPORTADOR DE BLOCOS E QUESTÕES EXISTENTES */}
        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Exportar Bloco Individual */}
            <div className="rounded-xl border border-[#294149] bg-[#152228] p-4 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Boxes className="h-4 w-4 text-[#01B59A]" />
                Exportar Bloco Existente como JSON
              </div>
              <p className="text-xs text-[#A8BBC0]">
                Selecione qualquer bloco da biblioteca para exportar sua estrutura individual em
                JSON.
              </p>

              <div>
                <select
                  value={selectedBlockId}
                  onChange={(e) => setSelectedBlockId(e.target.value)}
                  className="w-full h-9 rounded-md bg-[#0C1317] border border-[#294149] text-white text-xs px-2"
                >
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.blockType}] {b.title} (v{b.version})
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleExportSingleBlock}
                className="w-full bg-[#152228] hover:bg-[#152228]/80 border border-[#294149] text-white text-xs font-semibold"
              >
                <Download className="h-3.5 w-3.5 mr-1.5 text-[#01B59A]" /> Baixar JSON do Bloco
              </Button>
            </div>

            {/* Exportar Questão Individual */}
            <div className="rounded-xl border border-[#294149] bg-[#152228] p-4 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <HelpCircle className="h-4 w-4 text-[#C69B4B]" />
                Exportar Questão como JSON
              </div>
              <p className="text-xs text-[#A8BBC0]">
                Exporta a questão com enunciado, alternativas justificadas e gabarito protegido.
              </p>

              <div>
                <select
                  value={selectedQuestionId}
                  onChange={(e) => setSelectedQuestionId(e.target.value)}
                  className="w-full h-9 rounded-md bg-[#0C1317] border border-[#294149] text-white text-xs px-2"
                >
                  {questions.map((q) => (
                    <option key={q.id} value={q.id}>
                      [{q.externalId}] {q.title} (Nível L{q.authoringLevel})
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleExportSingleQuestion}
                className="w-full bg-[#152228] hover:bg-[#152228]/80 border border-[#294149] text-white text-xs font-semibold"
              >
                <Download className="h-3.5 w-3.5 mr-1.5 text-[#C69B4B]" /> Baixar JSON da Questão
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
