import { MediaAsset, QuestionBankItem, ContentBlock, EditorialReviewItem } from '@/types/cms'

/**
 * Dataset Central de Demonstração para a Fase 2 (CMS & Multimídia)
 * Todos os registros possuem explicitamente `isDemo: true`.
 *
 * Itens que simulam persistência de Storage ou Telemetria são explicitamente
 * marcados com `isPendingStorage: true` ou `isPendingTelemetry: true`.
 */

export const INITIAL_DEMO_MEDIA_ASSETS: MediaAsset[] = [
  {
    id: 'med-001',
    title: 'Aula Magna: Formulação Fraca e Teorema de Galerkin',
    description:
      'Dedução matemática da passagem da equação diferencial forte para a forma fraca integral.',
    assetType: 'youtube_video',
    provider: 'youtube',
    externalId: 'kJQP7kiw5Fk',
    publicUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    thumbnailUrl: 'https://img.usecurling.com/p/640/360?q=engineering%20math%20chalkboard',
    durationSeconds: 1680, // 28 minutos
    transcriptText: 'Nesta aula discutimos a aproximação por resíduos ponderados...',
    licenseInfo: 'Engenharia Divergente — Uso Exclusivo na Plataforma',
    accessRules: { requiresEntitlement: true, allowedProductIds: ['crs-002'] },
    tags: ['MEF', 'Formulação Fraca', 'Galerkin', 'Cálculo Avançado'],
    relatedProductId: 'crs-002',
    isPendingStorage: false,
    createdByName: 'Coord. Dra. Mariana Bittencourt',
    createdAt: '2025-02-10T10:00:00Z',
    updatedAt: '2025-02-15T14:30:00Z',
    isDemo: true,
  },
  {
    id: 'med-002',
    title: 'Estudo de Caso: Fadiga e Colapso de Eixo Rotor Industrial',
    description:
      'Gravação da autópsia da peça fraturada no laboratório de metalografia com análise microscópica.',
    assetType: 'private_video',
    provider: 'cloudflare_stream',
    externalId: 'stream-cfs-77492a-pending',
    publicUrl:
      'https://customer-pending.cloudflarestream.com/stream-cfs-77492a-pending/manifest/video.m3u8',
    thumbnailUrl: 'https://img.usecurling.com/p/640/360?q=metal%20fracture%20microscope',
    durationSeconds: 2150,
    transcriptText:
      'Observa-se nitidamente as marcas de praia (beach marks) iniciadas na raiz do chanfro...',
    licenseInfo: 'Confidencial — Laudo Pericial Licenciado para Fins Didáticos',
    accessRules: { requiresEntitlement: true },
    tags: ['Fadiga', 'Metalografia', 'Perícia', 'SOLIDWORKS Simulation'],
    relatedProductId: 'crs-003',
    isPendingStorage: true, // PENDENTE de credenciais Cloudflare Stream
    createdByName: 'Eng. Lucas Miranda',
    createdAt: '2025-02-12T16:20:00Z',
    updatedAt: '2025-02-12T16:20:00Z',
    isDemo: true,
  },
  {
    id: 'med-003',
    title: 'Apostila Completa: Tabelas de Perfis Estruturais Gerdau (NBR 8800)',
    description:
      'Catálogo técnico normalizado com propriedades geométricas, momentos de inércia e raios de giração.',
    assetType: 'pdf_document',
    provider: 's3_storage',
    externalId: 'docs/nbr-8800-perfis-w.pdf',
    publicUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    thumbnailUrl: 'https://img.usecurling.com/p/640/360?q=steel%20beams%20blueprint',
    fileSizeBytes: 14857600,
    transcriptText:
      'Tabelas completas de perfis I e H laminados para cálculo de flambagem local...',
    licenseInfo: 'Domínio Público / Gerdau Aços Longos',
    accessRules: { requiresEntitlement: false },
    tags: ['NBR 8800', 'Estruturas Metálicas', 'Perfis W', 'Tabelas Técnicas'],
    relatedProductId: 'crs-004',
    isPendingStorage: true, // PENDENTE de bucket S3 de produção
    createdByName: 'Coord. Dra. Mariana Bittencourt',
    createdAt: '2025-01-20T08:00:00Z',
    updatedAt: '2025-01-20T08:00:00Z',
    isDemo: true,
  },
  {
    id: 'med-004',
    title: 'Podcast: Os 5 Erros Mais Graves ao Simular Não-Linearidades de Contato',
    description:
      'Debate técnico sobre penetração de malha, multiplicadores de Lagrange e estabilização de Newton-Raphson.',
    assetType: 'audio',
    provider: 'external_url',
    externalId: 'pod-mef-ep04',
    publicUrl: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
    thumbnailUrl: 'https://img.usecurling.com/p/640/360?q=podcast%20microphone%20engineering',
    durationSeconds: 1420,
    licenseInfo: 'Engenharia Divergente Podcast',
    accessRules: { requiresEntitlement: true },
    tags: ['Áudio', 'Contato', 'CAE', 'Newton-Raphson'],
    isPendingStorage: false,
    createdByName: 'Coord. Dra. Mariana Bittencourt',
    createdAt: '2025-02-18T11:00:00Z',
    updatedAt: '2025-02-18T11:00:00Z',
    isDemo: true,
  },
  {
    id: 'med-005',
    title: 'Diagrama Técnico: Comparação de Convergência Elementos CST vs Q4',
    description:
      'Gráfico vetorial comparando a rigidez artificial do triângulo de deformação constante em relação ao quadrilátero.',
    assetType: 'image',
    provider: 'external_url',
    externalId: 'img-cst-vs-q4',
    publicUrl: 'https://img.usecurling.com/p/800/500?q=finite%20element%20strain%20contour',
    thumbnailUrl: 'https://img.usecurling.com/p/640/360?q=finite%20element%20mesh',
    licenseInfo: 'Engenharia Divergente',
    accessRules: { requiresEntitlement: false },
    tags: ['CST', 'Q4', 'Malha 2D', 'Diagramas'],
    relatedProductId: 'crs-002',
    isPendingStorage: false,
    createdByName: 'Eng. Lucas Miranda',
    createdAt: '2025-02-05T09:15:00Z',
    updatedAt: '2025-02-05T09:15:00Z',
    isDemo: true,
  },
]

export const INITIAL_DEMO_QUESTIONS: QuestionBankItem[] = [
  {
    id: 'qst-001',
    externalId: 'MEF-L3-Q001',
    title: 'Singularidade vs Concentrador de Tensão em Canto Reentrante',
    questionType: 'single_choice',
    subjectArea: 'Método dos Elementos Finitos',
    competencyCode: 'COMP-MEF-CONV',
    prerequisites: ['Mecânica dos Sólidos II', 'Teoria da Elasticidade'],
    authoringLevel: 3,
    promptMarkdown: `Ao realizar um teste de convergência de malha em uma chapa plana tracionada com um canto reentrante vivo de $90^\\circ$, um engenheiro júnior observa que a tensão máxima de von Mises $\\sigma_{vm}$ continua crescendo indefinidamente a cada refinamento $h$.

Qual é o diagnóstico físico e a conduta investigativa correta?`,
    options: [
      {
        id: 'opt-a',
        label: 'A',
        textMarkdown:
          'Trata-se de uma singularidade matemática de tensão. O modelo contínuo prevê tensão infinita na quina viva; o refinamento da malha não convergirá. Deve-se incluir um raio de concordância realista ou avaliar a região por Mecânica da Fratura Linear Elástica (MFLE).',
        distractorRationale:
          'Correto: cantos matematicamente vivos geram singularidade teórica; o refinamento indefinido é um erro conceitual comum.',
      },
      {
        id: 'opt-b',
        label: 'B',
        textMarkdown:
          'A formulação do elemento está com shear locking (travamento por cisalhamento); deve-se trocar os elementos Q4 por CST imediatamente.',
        distractorRationale:
          'Incorreto: CST tem rigidez artificial ainda maior e não resolve uma descontinuidade geométrica pontual.',
      },
      {
        id: 'opt-c',
        label: 'C',
        textMarkdown:
          'O algoritmo de resolução estática linear está divergindo por erro de arredondamento de ponto flutuante.',
        distractorRationale:
          'Incorreto: o resolvedor converge para a solução numérica da malha discretizada, o problema é conceitual no domínio da geometria.',
      },
      {
        id: 'opt-d',
        label: 'D',
        textMarkdown:
          'Basta aplicar integração reduzida para amortecer o gradiente numérico de tensões no nó crítico.',
        distractorRationale:
          'Incorreto: integração reduzida pode induzir modos de energia zero (hourglassing) sem solucionar a causa física.',
      },
    ],
    privateKey: {
      correctOptionIds: ['opt-a'],
      rubricNotes:
        'Critério de correção: o aluno deve diferenciar claramente singularidade (tensão divergente) de concentrador real (tensão convergente finita).',
    },
    hint: 'Lembre-se da solução analítica de Williams para cantos reentrantes em elasticidade plana.',
    explanationMarkdown: `Em vértices internos com raio nulo, a solução analítica da Teoria da Elasticidade prevê um gradiente assintótico com $\\sigma \\propto r^{\\lambda - 1}$, onde $\\lambda < 1$. Logo, quando $r \\to 0$, a tensão teórica tende ao infinito. Nenhum refinamento da malha apresentará platô de convergência numérico. Em projetos reais, aplica-se o raio de corte do processo de fabricação ou critérios de mecânica da fratura.`,
    estimatedSeconds: 240,
    xpReward: 30,
    tags: ['MEF', 'Convergência', 'Singularidade', 'Williams', 'Nível 3'],
    editorialStatus: 'published',
    version: 2,
    reviewedBy: 'Coord. Dra. Mariana Bittencourt',
    reviewedAt: '2025-02-14T11:00:00Z',
    reviewNotes: 'Validado tecnicamente. Exemplo clássico do módulo MDZAM.',
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: '2025-02-14T11:00:00Z',
    telemetryStats: {
      totalAttempts: 142,
      accuracyRate: 64.5,
      isContested: false,
      perceivedDifficulty: 'adequada',
      isPendingTelemetry: true,
    },
    isDemo: true,
  },
  {
    id: 'qst-002',
    externalId: 'MEC-L2-Q008',
    title: 'Cálculo de Tensão Normal em Seção Circular Submetida a Tração',
    questionType: 'numeric_response',
    subjectArea: 'Resistência dos Materiais',
    competencyCode: 'COMP-RESMAT-01',
    prerequisites: ['Estática dos Corpos Rígidos'],
    authoringLevel: 2,
    promptMarkdown: `Uma haste cilíndrica de aço estrutural ASTM A36 possui diâmetro nominal $d = 25\\text{ mm}$ e está tracionada axialmente por uma força normal $N = 75\\text{ kN}$.

Calcule a tensão normal média $\\sigma$ que atua na seção transversal em Megapascais ($\\text{MPa}$).`,
    options: [],
    privateKey: {
      numericExpectedValue: 152.79,
      numericToleranceAbs: 1.0,
      numericToleranceRel: 1.0,
      numericUnit: 'MPa',
      rubricNotes:
        'Área da seção $A = \\frac{\\pi d^2}{4} = \\frac{\\pi \\cdot 25^2}{4} \\approx 490.87\\text{ mm}^2$. Tensão = 75000 / 490.87 = 152.79 MPa.',
    },
    hint: 'Não se esqueça de converter $75\\text{ kN}$ para $75.000\\text{ N}$ e diâmetro para milímetros para obter o resultado diretamente em $\\text{N/mm}^2 = \\text{MPa}$.',
    explanationMarkdown: `A área da seção é dada por:
$$A = \\frac{\\pi \\cdot (25\\text{ mm})^2}{4} = 490{,}87\\text{ mm}^2$$

A tensão normal direta média é:
$$\\sigma = \\frac{N}{A} = \\frac{75.000\\text{ N}}{490{,}87\\text{ mm}^2} \\approx 152{,}79\\text{ MPa}$$

Como o aço A36 possui limite de escoamento $f_y \\approx 250\\text{ MPa}$, a peça trabalha com folga no regime puramente elástico.`,
    numericUnit: 'MPa',
    numericToleranceAbs: 1.0,
    numericToleranceRel: 1.0,
    estimatedSeconds: 150,
    xpReward: 20,
    tags: ['Tração', 'Tensão Normal', 'Cálculo Numérico', 'Nível 2'],
    editorialStatus: 'published',
    version: 1,
    reviewedBy: 'Coord. Dra. Mariana Bittencourt',
    reviewedAt: '2025-01-28T14:00:00Z',
    createdAt: '2025-01-28T10:00:00Z',
    updatedAt: '2025-01-28T14:00:00Z',
    telemetryStats: {
      totalAttempts: 98,
      accuracyRate: 88.0,
      isContested: false,
      perceivedDifficulty: 'facil',
      isPendingTelemetry: true,
    },
    isDemo: true,
  },
  {
    id: 'qst-003',
    externalId: 'NBR-L4-Q015',
    title: 'Verificação de Flambagem Lateral com Torção (FLT) conforme NBR 8800',
    questionType: 'multiple_choice',
    subjectArea: 'Estruturas Metálicas',
    competencyCode: 'COMP-NBR8800-FLT',
    prerequisites: ['Resistência dos Materiais II', 'Estabilidade Elástica'],
    authoringLevel: 4,
    promptMarkdown: `No dimensionamento de uma viga de alma não-esbelta de seção I submetida a momento fletor uniforme em torno do eixo de maior inércia, quais medidas de projeto são efetivas para evitar ou mitigar o estado limite último de **Flambagem Lateral com Torção (FLT)**?`,
    options: [
      {
        id: 'opt-1',
        label: 'A',
        textMarkdown:
          'Reduzir o comprimento destravado $L_b$ através do posicionamento de contenções laterais contínuas ou discretas na mesa comprimida.',
        distractorRationale:
          'Correto: $L_b \\le L_p$ garante que a viga atinja o momento de plastificação total $M_{pl}$ sem FLT.',
      },
      {
        id: 'opt-2',
        label: 'B',
        textMarkdown:
          'Aumentar a rigidez à torção de Saint-Venant ($J$) e o empenamento ($C_w$) da seção transversal do perfil.',
        distractorRationale:
          'Correto: a resistência elástica à torção e ao empenamento eleva diretamente o momento crítico elástico $M_{cr}$.',
      },
      {
        id: 'opt-3',
        label: 'C',
        textMarkdown:
          'Substituir o aço por outro de maior resistência (ex: de ASTM A36 para ASTM A572 Grau 50) mantendo a mesma geometria e os mesmos apoios.',
        distractorRationale:
          'Incorreto: o módulo de elasticidade $E$ é idêntico para todos os aços estruturais (~200 GPa); aumentar o escoamento apenas torna o perfil ainda mais suscetível à instabilidade elástica precoce.',
      },
      {
        id: 'opt-4',
        label: 'D',
        textMarkdown:
          'Adicionar enrijecedores transversais verticais no meio do vão sem ligá-los a elementos de contraventamento externo.',
        distractorRationale:
          'Incorreto: enrijecedores transversais combatem flambagem por cisalhamento na alma, mas não impedem a rotação de corpo rígido da seção associada à FLT se não houver apoio externo.',
      },
    ],
    privateKey: {
      correctOptionIds: ['opt-1', 'opt-2'],
      rubricNotes:
        'Critério: o engenheiro deve saber que estabilidade elástica depende de rigidez ($E$, $I_y$, $J$, $C_w$) e geometria de travamento ($L_b$), e NÃO da tensão de escoamento $f_y$.',
    },
    hint: 'Considere a fórmula do momento crítico elástico $M_{cr}$ e a dependência do módulo de elasticidade longitudinal $E$.',
    explanationMarkdown: `A instabilidade por FLT é um fenômeno primordialmente geométrico de perda de equilíbrio bifurcacional. Ele decorre da esbeltez da mesa comprimida fletida fora do plano de maior inércia acoplada à torção.
- Diminuir $L_b$ reduz a esbeltez $\\lambda = L_b / r_y$.
- Elevar $J$ e $C_w$ aumenta diretamente a rigidez torcional.
- Trocar o material para maior $f_y$ **não** altera o módulo $E \\approx 200\\text{ GPa}$, portanto o momento crítico $M_{cr}$ elástico permanece inalterado.`,
    estimatedSeconds: 300,
    xpReward: 40,
    tags: ['NBR 8800', 'FLT', 'Instabilidade', 'Vigas', 'Nível 4'],
    editorialStatus: 'in_review',
    version: 1,
    reviewNotes: 'Aguardando validação da equipe editorial antes de promover a publicado.',
    createdAt: '2025-02-20T15:00:00Z',
    updatedAt: '2025-02-20T15:00:00Z',
    telemetryStats: {
      totalAttempts: 34,
      accuracyRate: 41.2,
      isContested: true,
      perceivedDifficulty: 'dificil',
      isPendingTelemetry: true,
    },
    isDemo: true,
  },
  {
    id: 'qst-004',
    externalId: 'MEF-L5-Q022',
    title: 'Julgamento Crítico de Plastificação e Redistribuição em Viga Biengastada',
    questionType: 'true_false',
    subjectArea: 'Cálculo Avançado',
    competencyCode: 'COMP-MEF-PLAST',
    prerequisites: ['Teoria da Plasticidade', 'Método dos Elementos Finitos'],
    authoringLevel: 5,
    promptMarkdown: `Em uma viga contínua de aço dúctil sob flexão, ao atingir a tensão de escoamento $f_y$ na fibra mais solicitada do engaste, a estrutura entra imediatamente em colapso plástico global catastrófico, inviabilizando qualquer cálculo além do regime elástico linear.`,
    options: [],
    privateKey: {
      correctOptionIds: ['F'],
      rubricNotes:
        'Falso. O escoamento da fibra externa marca apenas o limite de proporcionalidade da seção. Há a reserva plástica de forma ($Z/W > 1$) e a capacidade de formação de rótulas plásticas sucessivas em estruturas hiperestáticas.',
    },
    hint: 'Diferencie momento de início de escoamento $M_y$ de momento de plastificação total $M_{pl}$ e lembre-se do teorema estático da plasticidade.',
    explanationMarkdown: `Afirmação **FALSA**.
Em vigas hiperestáticas feitas de material dúctil com capacidade de deformação plástica:
1. O escoamento da primeira fibra inicia no momento $M_y = W \\cdot f_y$.
2. A seção ainda possui reserva dada pelo fator de forma $\\alpha = Z / W$ (cerca de 1,12 a 1,15 para perfis I e 1,50 para seções retangulares).
3. Após a plastificação total da seção de engaste ($M_{pl}$), forma-se uma rótula plástica que mantém sua capacidade resistente enquanto o incremento de carregamento é redistribuído para o vão central, até a formação de um mecanismo cinemático completo.`,
    estimatedSeconds: 180,
    xpReward: 35,
    tags: ['Plasticidade', 'Rótula Plástica', 'Hiperestática', 'Nível 5'],
    editorialStatus: 'draft',
    version: 1,
    createdAt: '2025-02-22T09:30:00Z',
    updatedAt: '2025-02-22T09:30:00Z',
    telemetryStats: {
      totalAttempts: 12,
      accuracyRate: 50.0,
      isContested: false,
      perceivedDifficulty: 'dificil',
      isPendingTelemetry: true,
    },
    isDemo: true,
  },
]

export const INITIAL_DEMO_BLOCKS: ContentBlock[] = [
  {
    id: 'blk-001',
    blockType: 'single_choice',
    category: 'assessment',
    title: 'Diagnóstico de Singularidades de Tensão (Williams)',
    description:
      'Bloco avaliativo sobre distinção entre canto vivo teórico e concentrador geométrico.',
    editorialStatus: 'published',
    version: 2,
    completionPolicy: 'submitted',
    tags: ['MEF', 'Convergência', 'Avaliação'],
    referencedQuestionId: 'qst-001',
    config: {
      prompt:
        'Qual dos critérios abaixo é mais adequado para materiais dúcteis sob estado multiaxial de tensões?',
      options: [
        {
          id: 'opt-1',
          label: 'A',
          text: 'Critério de von Mises (Energia de Distorção)',
          rationale:
            'Correto: considera a energia que causa distorção angular sem variação de volume.',
        },
        {
          id: 'opt-2',
          label: 'B',
          text: 'Critério de Rankine (Tensão Principal Máxima)',
          rationale: 'Incorreto: Rankine é indicado primordialmente para materiais frágeis.',
        },
        {
          id: 'opt-3',
          label: 'C',
          text: 'Critério de Coulomb-Mohr sem atrito interno',
          rationale: 'Inadequado para o comportamento dúctil isotrópico geral.',
        },
      ],
      correctOptionId: 'opt-1',
      explanation:
        'Para aços estruturais e ligas dúcteis, o critério de von Mises prediz o início do escoamento com excelente correlação experimental.',
    },
    createdByName: 'Coord. Dra. Mariana Bittencourt',
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-02-14T11:00:00Z',
    trackReferences: [
      {
        courseTitle: 'Método do Zero ao MEF (MDZAM)',
        courseSlug: 'metodo-zero-ao-mef',
        moduleTitle: 'Fase 03 — Convergência de Malha e Singularidades',
      },
    ],
    isDemo: true,
  },
  {
    id: 'blk-002',
    blockType: 'video_embed',
    category: 'media',
    title: 'Vídeo: Formulação Fraca e Teorema dos Trabalhos Virtuais',
    description: 'Player de vídeo incorporado do YouTube com integração no curso MDZAM.',
    editorialStatus: 'published',
    version: 1,
    completionPolicy: 'watched',
    tags: ['Vídeo', 'MEF', 'Formulação Fraca'],
    referencedMediaId: 'med-001',
    config: {
      title: 'Aula Magna: Da Equação Forte à Formulação Fraca',
      youtubeId: 'kJQP7kiw5Fk',
      durationMinutes: 28,
    },
    createdByName: 'Coord. Dra. Mariana Bittencourt',
    createdAt: '2025-01-22T14:00:00Z',
    updatedAt: '2025-01-22T14:00:00Z',
    trackReferences: [
      {
        courseTitle: 'Formação Contínua: Fundamentos e Pensamento Divergente',
        courseSlug: 'formacao-continua-introdutoria',
        moduleTitle: 'Módulo 03 — Formulação Fraca e Princípio dos Trabalhos Virtuais',
      },
    ],
    isDemo: true,
  },
  {
    id: 'blk-003',
    blockType: 'numeric_response',
    category: 'assessment',
    title: 'Cálculo de Tensão Normal em Haste Tracionada',
    description: 'Exercício numérico com tolerância e unidade em MPa.',
    editorialStatus: 'published',
    version: 1,
    completionPolicy: 'submitted',
    tags: ['Resistência dos Materiais', 'Numérico', 'Cálculo'],
    referencedQuestionId: 'qst-002',
    config: {
      prompt: 'Calcule a tensão normal em MPa para diâmetro de 25 mm e carga axial de 75 kN:',
      expectedValue: 152.79,
      toleranceAbs: 1.0,
      unit: 'MPa',
      explanation: 'Área = π * (12.5)² = 490.87 mm². Tensão = 75000 / 490.87 = 152.79 MPa.',
    },
    createdByName: 'Coord. Dra. Mariana Bittencourt',
    createdAt: '2025-01-28T10:00:00Z',
    updatedAt: '2025-01-28T10:00:00Z',
    trackReferences: [
      {
        courseTitle: 'Formação Contínua: Fundamentos e Pensamento Divergente',
        courseSlug: 'formacao-continua-introdutoria',
        moduleTitle: 'Módulo 02 — Mecânica dos Sólidos: Da Teoria ao Campo',
      },
    ],
    isDemo: true,
  },
  {
    id: 'blk-004',
    blockType: 'pdf_reader',
    category: 'media',
    title: 'Manual de Perfis Estruturais Gerdau (NBR 8800)',
    description: 'Leitor de documento PDF embutido na interface.',
    editorialStatus: 'published',
    version: 1,
    completionPolicy: 'manual',
    tags: ['PDF', 'NBR 8800', 'Material de Apoio'],
    referencedMediaId: 'med-003',
    config: {
      title: 'Tabelas de Perfis I e H Laminados',
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
    createdByName: 'Eng. Lucas Miranda',
    createdAt: '2025-02-01T11:00:00Z',
    updatedAt: '2025-02-01T11:00:00Z',
    trackReferences: [
      {
        courseTitle: 'Dimensionamento de Estruturas Metálicas (NBR 8800)',
        courseSlug: 'estruturas-metalicas',
        moduleTitle: 'Capítulo 02 — Elementos Comprimidos e Tracionados',
      },
    ],
    isDemo: true,
  },
  {
    id: 'blk-005',
    blockType: 'checklist',
    category: 'interaction',
    title: 'Checklist de Blindagem de Modelo CAE',
    description: 'Lista de conferência pré-emissão de relatório técnico pericial.',
    editorialStatus: 'published',
    version: 1,
    completionPolicy: 'checked',
    tags: ['Checklist', 'Qualidade', 'Auditoria'],
    config: {
      id: 'chk-audit-01',
      title: 'Verificações Obrigatórias Antes de Aprovar a Malha',
      items: [
        {
          id: 'item-1',
          label: 'Conferir consistência de unidades (sistema coerente N, mm, t, MPa)',
        },
        {
          id: 'item-2',
          label:
            'Verificar se reações de apoio fecham o equilíbrio estático global com precisão < 0.1%',
        },
        {
          id: 'item-3',
          label: 'Descartar singularidades em cantos vivos antes de ler picos de tensão',
        },
        { id: 'item-4', label: 'Testar malha refinada e comprovar variação de resultado < 5%' },
      ],
    },
    createdByName: 'Coord. Dra. Mariana Bittencourt',
    createdAt: '2025-02-05T09:00:00Z',
    updatedAt: '2025-02-05T09:00:00Z',
    isDemo: true,
  },
]

export const INITIAL_DEMO_REVIEWS: EditorialReviewItem[] = [
  {
    id: 'rev-001',
    entityType: 'question',
    entityId: 'qst-003',
    title: 'Verificação de Flambagem Lateral com Torção (FLT) conforme NBR 8800',
    categoryOrType: 'multiple_choice (Nível 4)',
    currentStatus: 'in_review',
    requestedBy: 'Eng. Lucas Miranda',
    assignedReviewer: 'Coord. Dra. Mariana Bittencourt',
    requestedAt: '2025-02-20T15:05:00Z',
    notes:
      'Revisar se a explicação sobre o módulo de elasticidade invariante está suficientemente clara.',
    isDemo: true,
  },
  {
    id: 'rev-002',
    entityType: 'question',
    entityId: 'qst-004',
    title: 'Julgamento Crítico de Plastificação e Redistribuição em Viga Biengastada',
    categoryOrType: 'true_false (Nível 5)',
    currentStatus: 'draft',
    requestedBy: 'Eng. Lucas Miranda',
    requestedAt: '2025-02-22T09:35:00Z',
    notes: 'Rascunho inicial. Falta adicionar fórmula do momento plástico.',
    isDemo: true,
  },
]
