/**
 * Pacote Canônico de Demonstração e Exemplo (ediv-content-package v1.0.0)
 *
 * Pacote válido completo contendo blocos dos tipos P0, questões com equações LaTeX,
 * gabaritos protegidos, distratores justificados e referências estruturadas.
 * Disponível na UI para download e para testes de validação imediata.
 */

import { EdivContentPackage } from '@/schemas/canonicalSchemas'

export const DEMO_CANONICAL_PACKAGE: EdivContentPackage = {
  schema_version: '1.0.0',
  package_id: 'pkg-eng-divergente-mef-resmat-v1',
  name: 'Fundamentos de MEF & Resistência dos Materiais — Lote de Demonstração',
  description:
    'Pacote mestre de atividades pedagógicas de engenharia estrutural com questões com LaTeX, blocos avaliativos e interativos.',
  author: 'Coordenação de Engenharia Divergente Academy',
  exported_at: '2025-02-26T12:00:00Z',
  media_assets: [
    {
      id: 'med-pkg-001',
      title: 'Diagrama de Esforços Solicitantes em Pórtico Plano',
      description: 'Ilustração vetorial normalizada de esforços internos cortantes e momentos.',
      assetType: 'image',
      provider: 'external_url',
      externalId: 'diag-portico-01',
      publicUrl: 'https://img.usecurling.com/p/800/450?q=structural%20engineering%20diagram',
      thumbnailUrl: '',
      licenseInfo: 'Engenharia Divergente — Uso Aberto',
      tags: ['Estruturas', 'Diagramas'],
      accessRules: {
        requiresEntitlement: false,
      },
    },
    {
      id: 'med-pkg-002',
      title: 'Vídeo: Singularidades vs Concentradores de Tensão',
      assetType: 'youtube_video',
      provider: 'youtube',
      externalId: 'kJQP7kiw5Fk',
      publicUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      durationSeconds: 1080,
      licenseInfo: 'Canal Oficial Engenharia Divergente',
      tags: ['Vídeo', 'MEF'],
      accessRules: {
        requiresEntitlement: true,
      },
    },
  ],
  questions: [
    {
      id: 'qst-pkg-001',
      externalId: 'MEF-L3-Q101',
      title: 'Convergência de Malha em Elasticidade Linear 2D',
      questionType: 'single_choice',
      subjectArea: 'Método dos Elementos Finitos',
      competencyCode: 'COMP-MEF-02',
      prerequisites: ['Mecânica dos Sólidos II'],
      authoringLevel: 3,
      promptMarkdown:
        'Ao refinar sucessivamente uma malha de elementos finitos $h$ em uma placa com furo circular sob tração uniaxial, qual comportamento assintótico deve ser observado para o pico de tensão $\\sigma_{\\max}$ segundo a teoria de Kirsch?\n\nConsidere elasticidade linear isotrópica e raio do furo $R \\ll W$ (largura da placa).',
      options: [
        {
          id: 'opt-a',
          label: 'A',
          textMarkdown:
            'A tensão máxima converge monotonicamente para aproximadamente $3\\sigma_0$ (três vezes a tensão nominal remota).',
          distractorRationale:
            'Correto: o fator teórico de concentração de tensões de Kirsch para furo circular em placa infinita é exatamente $K_t = 3$.',
        },
        {
          id: 'opt-b',
          label: 'B',
          textMarkdown:
            'A tensão máxima diverge assintoticamente para o infinito a cada redução do tamanho do elemento $h$.',
          distractorRationale:
            'Incorreto: o furo circular tem curvatura suave (raio $R > 0$); não há singularidade, a tensão converge para um valor finito real.',
        },
        {
          id: 'opt-c',
          label: 'C',
          textMarkdown:
            'A tensão oscila aleatoriamente devido ao fenômeno de travamento volumétrico em estado plano de deformação.',
          distractorRationale:
            'Incorreto: travamento volumétrico só ocorre quando o coeficiente de Poisson $\\nu \\to 0{,}5$ (materiais incompressíveis).',
        },
        {
          id: 'opt-d',
          label: 'D',
          textMarkdown:
            'O pico de tensão diminui continuamente até atingir o valor da tensão média da seção líquida.',
          distractorRationale:
            'Incorreto: o refinamento revela o gradiente de concentrador, elevando o valor numérico até o valor exato de Kirsch.',
        },
      ],
      privateKey: {
        correctOptionIds: ['opt-a'],
        rubricNotes:
          'O aluno deve demonstrar que conhece a solução de Kirsch e que distingue concentrador de singularidade.',
      },
      hint: 'Lembre-se da relação analítica $K_t = \\sigma_{\\max} / \\sigma_0 = 3$ deduzida por Kirsch em 1898.',
      explanationMarkdown:
        'A solução exata de Kirsch para uma placa plana tracionada com furo circular estabelece que na borda do furo (para $\\theta = \\pi/2$): $\\sigma_{\\theta\\theta} = \\sigma_0 (1 + 2) = 3\\sigma_0$. Como o contorno possui raio finito $R$, não há singularidade matemática; logo a análise MEF converge satisfatoriamente.',
      estimatedSeconds: 200,
      xpReward: 25,
      tags: ['MEF', 'Kirsch', 'Concentrador', 'Elasticidade'],
      editorialStatus: 'draft',
      version: 1,
    },
    {
      id: 'qst-pkg-002',
      externalId: 'RES-L2-Q102',
      title: 'Tensão de Cisalhamento Médio em Rebite',
      questionType: 'numeric_response',
      subjectArea: 'Resistência dos Materiais',
      competencyCode: 'COMP-RESMAT-02',
      prerequisites: ['Estática'],
      authoringLevel: 2,
      promptMarkdown:
        'Uma junta sobreposta é fixada por um único rebite de diâmetro nominal $d = 16\\text{ mm}$. A força de tração transmitida pela chapa é $P = 32\\text{ kN}$.\n\nCalcule a tensão média de cisalhamento transversal $\\tau$ atuante no rebite em Megapascais ($\\text{MPa}$).',
      options: [],
      privateKey: {
        numericExpectedValue: 159.15,
        numericToleranceAbs: 1.5,
        numericToleranceRel: 1.0,
        numericUnit: 'MPa',
        rubricNotes:
          'Área de corte $A = \\pi \\cdot (8\\text{ mm})^2 \\approx 201{,}06\\text{ mm}^2$. Tensão $\\tau = 32000 / 201{,}06 = 159{,}15\\text{ MPa}$.',
      },
      hint: 'Considere corte simples: a área resistente ao cisalhamento é a área circular transversal do fuste do rebite.',
      explanationMarkdown:
        'A área da seção transversal resistente ao cisalhamento simples é:\n$$A = \\frac{\\pi d^2}{4} = \\frac{\\pi \\cdot (16\\text{ mm})^2}{4} \\approx 201{,}06\\text{ mm}^2$$\n\nA tensão tangencial média é:\n$$\\tau = \\frac{P}{A} = \\frac{32.000\\text{ N}}{201{,}06\\text{ mm}^2} \\approx 159{,}15\\text{ MPa}$$',
      numericUnit: 'MPa',
      numericToleranceAbs: 1.5,
      numericToleranceRel: 1.0,
      estimatedSeconds: 150,
      xpReward: 20,
      tags: ['Cisalhamento', 'Rebites', 'Ligações Mecânicas'],
      editorialStatus: 'draft',
      version: 1,
    },
    {
      id: 'qst-pkg-003',
      externalId: 'EST-L4-Q103',
      title: 'Hipóteses da Teoria de Vigas de Timoshenko',
      questionType: 'multiple_choice',
      subjectArea: 'Mecânica dos Sólidos Avançada',
      competencyCode: 'COMP-VIGAS-03',
      prerequisites: ['Resistência dos Materiais II'],
      authoringLevel: 4,
      promptMarkdown:
        'Em comparação com a formulação clássica de Euler-Bernoulli, quais hipóteses e características são distintivas da **Teoria de Vigas de Timoshenko**?',
      options: [
        {
          id: 'opt-1',
          label: 'A',
          textMarkdown:
            'A seção transversal plana não necessita permanecer estritamente perpendicular à linha elástica deformada, permitindo distorção angular por cisalhamento transversal $\\gamma_{xz}$.',
          distractorRationale:
            'Correto: esta é a premissa central da teoria de primeira ordem de cisalhamento (FSDT).',
        },
        {
          id: 'opt-2',
          label: 'B',
          textMarkdown:
            'Exige a aplicação de um fator de correção de cisalhamento (fator de forma $\\kappa$) para compensar a distribuição não-uniforme real de tensões tangenciais na seção.',
          distractorRationale:
            'Correto: por exemplo, $\\kappa = 5/6$ para seção retangular e $\\kappa \\approx 0{,}9$ para perfis I.',
        },
        {
          id: 'opt-3',
          label: 'C',
          textMarkdown:
            'É restrita exclusivamente a vigas infinitamente esbeltas ($L/h > 50$), onde a deformação cortante é nula.',
          distractorRationale:
            'Incorreto: Timoshenko foi desenvolvida especificamente para vigas curtas e moderadamente espessas ($L/h < 10$).',
        },
      ],
      privateKey: {
        correctOptionIds: ['opt-1', 'opt-2'],
        rubricNotes: 'Critério de correção: o aluno deve assinalar A e B.',
      },
      hint: 'Pense em como vigas curtas reagem quando a altura da viga $h$ é da mesma ordem de grandeza do comprimento do vão $L$.',
      explanationMarkdown:
        "A teoria de Timoshenko relaxa a restrição de ortogonalidade de Euler-Bernoulli, introduzindo um grau de liberdade de rotação independente $\\theta(x) \\neq w'(x)$. Logo $\\gamma = w' - \\theta$. Para corrigir a hipótese de cisalhamento constante na altura, adota-se o fator de correção de cisalhamento $\\kappa$.",
      estimatedSeconds: 240,
      xpReward: 30,
      tags: ['Timoshenko', 'Euler-Bernoulli', 'Cisalhamento', 'Vigas'],
      editorialStatus: 'draft',
      version: 1,
    },
    {
      id: 'qst-pkg-004',
      externalId: 'EST-L1-Q104',
      title: 'Equilíbrio Estático em Treliças Planas Isostáticas',
      questionType: 'true_false',
      subjectArea: 'Estática das Estruturas',
      competencyCode: 'COMP-ESTAT-01',
      prerequisites: ['Física Geral I'],
      authoringLevel: 1,
      promptMarkdown:
        'Em uma treliça plana ideal onde todas as barras são retas, as cargas são aplicadas estritamente nos nós e as conexões são rótulas perfeitas sem atrito, todas as barras desenvolvem momentos fletores significativos ao longo do comprimento.',
      options: [],
      privateKey: {
        correctOptionIds: ['F'],
        rubricNotes:
          'Afirmação Falsa. Barras de treliça ideal desenvolvem apenas esforço axial direto (tração ou compressão).',
      },
      hint: 'Considere a definição elementar de barra biarticulada carregada unicamente nas extremidades.',
      explanationMarkdown:
        'Afirmação **FALSA**. Por hipótese de projeto estrutural clássico, treliças ideais possuem cargas nodais e conexões rotuladas, gerando exclusivamente **esforços normais axiais** (tração ou compressão pura). Momentos fletores decorrentes de rigidez de nós ou peso próprio são efeitos secundários verificados em detalhamento executivo.',
      estimatedSeconds: 90,
      xpReward: 15,
      tags: ['Treliças', 'Isostática', 'Nível 1'],
      editorialStatus: 'draft',
      version: 1,
    },
    {
      id: 'qst-pkg-005',
      externalId: 'NUM-L3-Q105',
      title: 'Sequência de Execução de um Resolvedor Estático Linear MEF',
      questionType: 'ordered_steps',
      subjectArea: 'Método dos Elementos Finitos',
      competencyCode: 'COMP-MEF-ALGO',
      prerequisites: ['Álgebra Linear Computacional'],
      authoringLevel: 3,
      promptMarkdown:
        'Ordene a sequência cronológica correta dos passos computacionais executados pelo núcleo do resolvedor MEF estático linear:',
      options: [],
      privateKey: {
        correctStepOrder: ['step-1', 'step-2', 'step-3', 'step-4', 'step-5'],
        rubricNotes:
          '1. Matrizes elementares -> 2. Montagem global -> 3. Condições de contorno -> 4. Solução do sistema linear -> 5. Pós-processamento de tensões.',
      },
      hint: 'Lembre-se da montagem do sistema global $\\mathbf{K}\\mathbf{u} = \\mathbf{F}$ antes de aplicar os apoios.',
      explanationMarkdown:
        'O fluxo algorítmico canônico é:\n1. Cálculo das matrizes de rigidez de cada elemento $\\mathbf{k}^e$\n2. Montagem da matriz de rigidez global $\\mathbf{K}$\n3. Aplicação das condições de contorno de Dirichlet e Neumann\n4. Solução do sistema linear de deslocamentos nodais $\\mathbf{u} = \\mathbf{K}^{-1}\\mathbf{F}$\n5. Pós-processamento para recuperação de deformações $\\boldsymbol{\\varepsilon} = \\mathbf{B}\\mathbf{u}$ e tensões $\\boldsymbol{\\sigma} = \\mathbf{D}\\boldsymbol{\\varepsilon}$.',
      estimatedSeconds: 200,
      xpReward: 25,
      tags: ['MEF', 'Algoritmos', 'Ordenação'],
      editorialStatus: 'draft',
      version: 1,
    },
  ],
  blocks: [
    {
      id: 'blk-pkg-001',
      block_type: 'single_choice',
      title: 'Critério de Escoamento Multiaxial para Materiais Dúcteis',
      description: 'Questão avaliativa sobre von Mises vs Rankine e Tresca.',
      category: 'assessment',
      subject_area: 'Resistência dos Materiais',
      associated_competencies: ['COMP-RESMAT-03', 'COMP-CRIT-01'],
      initial_difficulty: 3,
      estimated_minutes: 6,
      tags: ['Escoamento', 'von Mises', 'Critérios'],
      author: 'Equipe Pedagógica eDiv',
      completion_policy: 'submitted',
      version: 1,
      editorial_status: 'draft',
      config: {
        prompt:
          'Para prever o início do escoamento plástico em um componente de aço carbono submetido a estado plano de tensões multiaxial com $\\sigma_1 = 180\\text{ MPa}$ e $\\sigma_2 = -120\\text{ MPa}$, qual critério físico reflete a energia que altera a forma sem variação volumétrica?',
        options: [
          {
            id: 'opt-1',
            label: 'A',
            text: 'Critério da Máxima Energia de Distorção (von Mises / Hencky)',
            rationale:
              'Correto: separa o tensor hidrostático do tensor desviador de tensões, com excelente correlação para metais dúcteis.',
          },
          {
            id: 'opt-2',
            label: 'B',
            text: 'Critério da Máxima Tensão Principal (Rankine)',
            rationale:
              'Incorreto: Rankine é indicado primordialmente para materiais frágeis onde a ruptura por tração governa.',
          },
          {
            id: 'opt-3',
            label: 'C',
            text: 'Critério de Mohr-Coulomb com ângulo de atrito zero',
            rationale: 'Inadequado para o escoamento contínuo isotrópico de ligas metálicas.',
          },
        ],
        correctOptionId: 'opt-1',
        explanation:
          'O critério de von Mises estabelece que o escoamento se inicia quando a energia de distorção por unidade de volume atinge o valor correspondente no ensaio uniaxial de tração: $\\sigma_{vm} = \\sqrt{\\sigma_1^2 - \\sigma_1\\sigma_2 + \\sigma_2^2} = \\sqrt{180^2 - 180(-120) + 120^2} = \\sqrt{32400 + 21600 + 14400} = 261{,}5\\text{ MPa}$.',
      },
      media_references: [],
    },
    {
      id: 'blk-pkg-002',
      block_type: 'numeric_response',
      title: 'Cálculo de Tensão Normal em Seção Retangular',
      description: 'Exercício numérico com validação pt-BR e tolerância em MPa.',
      category: 'assessment',
      subject_area: 'Resistência dos Materiais',
      associated_competencies: ['COMP-RESMAT-01'],
      initial_difficulty: 2,
      estimated_minutes: 5,
      tags: ['Cálculo', 'Tensão Normal', 'Numérico'],
      author: 'Equipe Pedagógica eDiv',
      completion_policy: 'submitted',
      version: 1,
      editorial_status: 'draft',
      config: {
        prompt:
          'Calcule a tensão normal direta $\\sigma$ em MPa em uma barra de seção retangular de base $b = 50\\text{ mm}$ e altura $h = 20\\text{ mm}$ submetida a uma força axial de tração de $80\\text{ kN}$:',
        expectedValue: 80.0,
        toleranceAbs: 0.5,
        unit: 'MPa',
        explanation:
          'Área da seção $A = 50 \\times 20 = 1000\\text{ mm}^2$. Tensão $\\sigma = 80000\\text{ N} / 1000\\text{ mm}^2 = 80{,}0\\text{ MPa}$.',
      },
      media_references: [],
    },
    {
      id: 'blk-pkg-003',
      block_type: 'rich_text',
      title: 'Formulação Variacional: O Princípio dos Trabalhos Virtuais',
      description: 'Texto técnico com Markdown sanitizado e equações LaTeX.',
      category: 'media',
      subject_area: 'Mecânica dos Sólidos',
      associated_competencies: ['COMP-MEF-01'],
      initial_difficulty: 4,
      estimated_minutes: 12,
      tags: ['PTV', 'Formulação Fraca', 'Teoria'],
      author: 'Coordenação eDiv',
      completion_policy: 'manual',
      version: 1,
      editorial_status: 'draft',
      config: {
        markdown: `## Princípio dos Trabalhos Virtuais (PTV) em Meios Contínuos\n\nO equilíbrio mecânico global do corpo sólido contínuo sob hipóteses de pequenas deformações pode ser expresso em forma fraca integral sobre o domínio $\\Omega$:\n\n$$\\int_{\\Omega} \\boldsymbol{\\sigma} : \\delta\\boldsymbol{\\varepsilon} \\, d\\Omega = \\int_{\\Omega} \\mathbf{b} \\cdot \\delta\\mathbf{u} \\, d\\Omega + \\int_{\\Gamma_t} \\bar{\\mathbf{t}} \\cdot \\delta\\mathbf{u} \\, d\\Gamma$$\n\n### Onde:\n- $\\boldsymbol{\\sigma}$ é o tensor simétrico de tensões de Cauchy\n- $\\delta\\boldsymbol{\\varepsilon} = \\frac{1}{2}(\\nabla\\delta\\mathbf{u} + (\\nabla\\delta\\mathbf{u})^T)$ são as deformações virtuais cinematicamente admissíveis\n- $\\mathbf{b}$ são as forças de corpo volumétricas (ex: gravidade $\\rho\\mathbf{g}$)\n- $\\bar{\\mathbf{t}}$ são as forças de superfície prescritas na fronteira natural $\\Gamma_t$\n\nAo discretizar o campo de deslocamentos virtuais $\\delta\\mathbf{u} = \\mathbf{N}\\delta\\mathbf{d}$, recupera-se a equação clássica de rigidez do MEF: $\\mathbf{K}\\mathbf{d} = \\mathbf{F}$.`,
      },
      media_references: [],
    },
    {
      id: 'blk-pkg-004',
      block_type: 'checklist',
      title: 'Checklist de Verificação de Qualidade de Malha CAE',
      description: 'Conferência obrigatória antes da emissão de laudos de elementos finitos.',
      category: 'interaction',
      subject_area: 'Auditoria Estrutural',
      associated_competencies: ['COMP-QUAL-01'],
      initial_difficulty: 3,
      estimated_minutes: 8,
      tags: ['Qualidade', 'Malha', 'Checklist'],
      author: 'Coordenação eDiv',
      completion_policy: 'checked',
      version: 1,
      editorial_status: 'draft',
      config: {
        id: 'chk-pkg-01',
        title: 'Critérios de Aceitação de Malha (Aspect Ratio e Jacobian)',
        items: [
          { id: 'c1', label: 'Aspect Ratio de todos os elementos quadriláteros inferior a 5:1' },
          {
            id: 'c2',
            label: 'Jacobiano de distorção angular maior ou igual a 0,7 em toda a malha',
          },
          {
            id: 'c3',
            label: 'Ausência de elementos triangulares em regiões de alto gradiente de flexão',
          },
          { id: 'c4', label: 'Pelo menos 3 elementos na espessura de cascas e mesas sob flexão' },
        ],
      },
      media_references: [],
    },
  ],
}
