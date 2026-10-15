import React from 'react'
import { BlockTypeId, BlockCategory, BlockCompletionPolicy, BlockPriority } from '@/types/cms'
import {
  SingleChoiceBlockRenderer,
  MultipleChoiceBlockRenderer,
  TrueFalseBlockRenderer,
  NumericResponseBlockRenderer,
  OrderedStepsBlockRenderer,
  RichTextBlockRenderer,
  VideoEmbedBlockRenderer,
  PdfReaderBlockRenderer,
  ChecklistBlockRenderer,
  ImageBlockRenderer,
  FormulaReferenceBlockRenderer,
  MilestoneVideoBlockRenderer,
  CtaBlockRenderer,
  ConditionalGateBlockRenderer,
} from './renderers/P0BlockRenderers'
import {
  SingleChoiceBlockEditor,
  NumericResponseBlockEditor,
  VideoEmbedBlockEditor,
  RichTextBlockEditor,
  GenericJsonBlockEditor,
} from './editors/P0BlockEditors'

export interface BlockRegistryItem {
  type: BlockTypeId
  version: string
  title: string
  description: string
  category: BlockCategory
  priority: BlockPriority
  completionPolicy: BlockCompletionPolicy
  supportedOutputs: string[]
  validateConfig: (config: Record<string, unknown>) => { valid: boolean; errors?: string[] }
  EditorComponent: React.ComponentType<{
    config: Record<string, unknown>
    onChange: (config: Record<string, unknown>) => void
  }>
  StudentComponent: React.ComponentType<{
    config: Record<string, unknown>
    onComplete?: () => void
    isReadOnly?: boolean
  }>
  defaultConfig: Record<string, unknown>
}

// Catálogo interno tipado
const REGISTRY: Map<BlockTypeId, BlockRegistryItem> = new Map()

export function registerBlock(item: BlockRegistryItem) {
  REGISTRY.set(item.type, item)
}

export function getBlockDefinition(type: BlockTypeId): BlockRegistryItem | undefined {
  return REGISTRY.get(type)
}

export function getAllBlockDefinitions(): BlockRegistryItem[] {
  return Array.from(REGISTRY.values())
}

// ==========================================
// REGISTRO DOS 14 TIPOS P0 (FUNCIONAIS)
// ==========================================

// 1. Single Choice
registerBlock({
  type: 'single_choice',
  version: '1.0.0',
  title: 'Alternativa Única Explicativa',
  description: 'Questão de múltipla escolha com justificativa técnica individual por alternativa.',
  category: 'assessment',
  priority: 'P0',
  completionPolicy: 'submitted',
  supportedOutputs: ['score', 'selectedOptionId', 'isCorrect'],
  validateConfig: (config) => {
    const errors: string[] = []
    if (!config.prompt) errors.push('O enunciado é obrigatório.')
    const opts = (config.options as unknown[]) || []
    if (opts.length < 2) errors.push('São necessárias pelo menos 2 alternativas.')
    if (!config.correctOptionId) errors.push('Uma alternativa correta deve ser selecionada.')
    return { valid: errors.length === 0, errors }
  },
  EditorComponent: SingleChoiceBlockEditor,
  StudentComponent: SingleChoiceBlockRenderer,
  defaultConfig: {
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
})

// 2. Multiple Choice
registerBlock({
  type: 'multiple_choice',
  version: '1.0.0',
  title: 'Múltipla Escolha',
  description: 'Questão que permite selecionar várias respostas corretas simultâneas.',
  category: 'assessment',
  priority: 'P0',
  completionPolicy: 'submitted',
  supportedOutputs: ['score', 'selectedOptionIds'],
  validateConfig: (config) => {
    const errors: string[] = []
    if (!config.prompt) errors.push('O enunciado é obrigatório.')
    const opts = (config.options as unknown[]) || []
    if (opts.length < 2) errors.push('São necessárias pelo menos 2 alternativas.')
    const correct = (config.correctOptionIds as string[]) || []
    if (correct.length === 0) errors.push('Selecione pelo menos uma alternativa correta.')
    return { valid: errors.length === 0, errors }
  },
  EditorComponent: GenericJsonBlockEditor,
  StudentComponent: MultipleChoiceBlockRenderer,
  defaultConfig: {
    prompt: 'Quais das seguintes hipóteses são válidas para vigas de Euler-Bernoulli?',
    options: [
      {
        id: 'opt-1',
        label: 'A',
        text: 'Seções planas normais à linha elástica permanecem planas após a flexão.',
      },
      { id: 'opt-2', label: 'B', text: 'A deformação por cisalhamento transversal é desprezada.' },
      {
        id: 'opt-3',
        label: 'C',
        text: 'Grandes rotações e plasticidade total são inerentes à formulação clássica.',
      },
    ],
    correctOptionIds: ['opt-1', 'opt-2'],
    explanation:
      'A teoria clássica de Euler-Bernoulli desconsidera o cisalhamento transversal (adequada para vigas esbeltas L/h > 10).',
  },
})

// 3. True / False
registerBlock({
  type: 'true_false',
  version: '1.0.0',
  title: 'Verdadeiro ou Falso Comentado',
  description: 'Afirmação técnica para julgamento investigativo com justificativa posterior.',
  category: 'assessment',
  priority: 'P0',
  completionPolicy: 'submitted',
  supportedOutputs: ['isCorrect'],
  validateConfig: (config) => {
    const errors: string[] = []
    if (!config.statement && !config.prompt) errors.push('A afirmação a ser julgada é obrigatória.')
    return { valid: errors.length === 0, errors }
  },
  EditorComponent: GenericJsonBlockEditor,
  StudentComponent: TrueFalseBlockRenderer,
  defaultConfig: {
    statement:
      'O refinamento h (diminuição do tamanho dos elementos) sempre elimina singularidades de tensão em cantos reentrantes de 90°.',
    correctAnswer: false,
    explanation:
      'Falso: Em cantos vivos teóricos, a tensão analítica tende ao infinito. Refinar a malha apenas eleva o valor numérico (não há convergência). Deve-se aplicar raio de adoçamento ou avaliar por mecânica da fratura.',
  },
})

// 4. Numeric Response
registerBlock({
  type: 'numeric_response',
  version: '1.0.0',
  title: 'Resposta Numérica com Tolerância',
  description: 'Cálculo com validação de casas decimais pt-BR, unidade e margem de erro.',
  category: 'assessment',
  priority: 'P0',
  completionPolicy: 'submitted',
  supportedOutputs: ['userNumericValue', 'isWithinTolerance'],
  validateConfig: (config) => {
    const errors: string[] = []
    if (!config.prompt) errors.push('O enunciado do problema é obrigatório.')
    if (typeof config.expectedValue !== 'number')
      errors.push('O valor esperado numérico é obrigatório.')
    return { valid: errors.length === 0, errors }
  },
  EditorComponent: NumericResponseBlockEditor,
  StudentComponent: NumericResponseBlockRenderer,
  defaultConfig: {
    prompt:
      'Calcule a tensão normal máxima em MPa em uma barra de seção circular de diâmetro 20 mm submetida a tração axial de 45 kN:',
    expectedValue: 143.24,
    toleranceAbs: 1.5,
    unit: 'MPa',
    explanation: 'Área = π * (10 mm)² = 314.16 mm². Tensão = 45000 N / 314.16 mm² = 143.24 MPa.',
  },
})

// 5. Ordered Steps
registerBlock({
  type: 'ordered_steps',
  version: '1.0.0',
  title: 'Ordenação de Etapas',
  description: 'Sequenciamento lógico de procedimentos de engenharia e modelagem.',
  category: 'interaction',
  priority: 'P0',
  completionPolicy: 'submitted',
  supportedOutputs: ['isCorrectSequence'],
  validateConfig: (config) => {
    const errors: string[] = []
    const steps = (config.steps as unknown[]) || []
    if (steps.length < 2) errors.push('Mínimo de 2 etapas necessárias.')
    return { valid: errors.length === 0, errors }
  },
  EditorComponent: GenericJsonBlockEditor,
  StudentComponent: OrderedStepsBlockRenderer,
  defaultConfig: {
    prompt: 'Ordene o fluxo correto de validação de um modelo numérico em elementos finitos:',
    steps: [
      { id: 'st-1', text: 'Definição da física e hipóteses de contorno do problema real' },
      { id: 'st-2', text: 'Construção da geometria simplificada e desfeaturement' },
      { id: 'st-3', text: 'Geração de malha preliminar e verificação de condições de apoio' },
      { id: 'st-4', text: 'Estudo de convergência de malha (análise h ou p)' },
      { id: 'st-5', text: 'Validação cruzada com modelo analítico ou dados experimentais' },
    ],
    correctOrder: ['st-1', 'st-2', 'st-3', 'st-4', 'st-5'],
    explanation: 'A validação precede a aceitação de qualquer resultado de tensões para projeto.',
  },
})

// 6. Rich Text
registerBlock({
  type: 'rich_text',
  version: '1.0.0',
  title: 'Texto Técnico & Fórmulas (Markdown/LaTeX)',
  description: 'Explicações ricas com equações matemáticas e formatação sanitizada.',
  category: 'media',
  priority: 'P0',
  completionPolicy: 'manual',
  supportedOutputs: ['read'],
  validateConfig: (config) => {
    const errors: string[] = []
    if (!config.markdown && !config.text) errors.push('O texto em Markdown é obrigatório.')
    return { valid: errors.length === 0, errors }
  },
  EditorComponent: RichTextBlockEditor,
  StudentComponent: RichTextBlockRenderer,
  defaultConfig: {
    markdown: `## Formulação Variacional no MEF\n\nO princípio dos trabalhos virtuais estabelece o equilíbrio integral sobre o volume $\\Omega$:\n\n$$\\int_{\\Omega} \\boldsymbol{\\sigma} : \\delta \\boldsymbol{\\varepsilon} \\, d\\Omega = \\int_{\\partial\\Omega} \\mathbf{t} \\cdot \\delta \\mathbf{u} \\, d\\Gamma$$\n\nOnde:\n- $\\boldsymbol{\\sigma}$ representa o tensor de tensões de Cauchy\n- $\\delta \\boldsymbol{\\varepsilon}$ são as deformações virtuais compatíveis\n- $\\mathbf{t}$ são as trações superficiais prescritas na fronteira`,
  },
})

// 7. Video Embed
registerBlock({
  type: 'video_embed',
  version: '1.0.0',
  title: 'Vídeo YouTube Integrado',
  description: 'Apresentação audiovisual via player oficial do YouTube.',
  category: 'media',
  priority: 'P0',
  completionPolicy: 'watched',
  supportedOutputs: ['watched', 'watchTimeSeconds'],
  validateConfig: (config) => {
    const errors: string[] = []
    if (!config.youtubeId && !config.videoId)
      errors.push('O identificador do YouTube é obrigatório.')
    return { valid: errors.length === 0, errors }
  },
  EditorComponent: VideoEmbedBlockEditor,
  StudentComponent: VideoEmbedBlockRenderer,
  defaultConfig: {
    title: 'Diferença entre Singularidade e Concentrador de Tensões',
    youtubeId: 'kJQP7kiw5Fk',
    durationMinutes: 18,
  },
})

// 8. PDF Reader
registerBlock({
  type: 'pdf_reader',
  version: '1.0.0',
  title: 'Leitor de PDF Técnico',
  description: 'Visualizador de apostilas, normas e memoriais com controle de zoom.',
  category: 'media',
  priority: 'P0',
  completionPolicy: 'manual',
  supportedOutputs: ['downloaded', 'readPercent'],
  validateConfig: (config) => {
    const errors: string[] = []
    if (!config.pdfUrl) errors.push('A URL do documento PDF é obrigatória.')
    return { valid: errors.length === 0, errors }
  },
  EditorComponent: GenericJsonBlockEditor,
  StudentComponent: PdfReaderBlockRenderer,
  defaultConfig: {
    title: 'Caderno de Exercícios: Formulação 1D de Elementos Finitos',
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
})

// 9. Checklist
registerBlock({
  type: 'checklist',
  version: '1.0.0',
  title: 'Lista de Verificação (Checklist)',
  description: 'Critérios e verificações obrigatórias de projeto com persistência local.',
  category: 'interaction',
  priority: 'P0',
  completionPolicy: 'checked',
  supportedOutputs: ['allChecked', 'checkedCount'],
  validateConfig: (config) => {
    const errors: string[] = []
    const items = (config.items as unknown[]) || []
    if (items.length === 0) errors.push('A lista de verificação deve ter pelo menos 1 item.')
    return { valid: errors.length === 0, errors }
  },
  EditorComponent: GenericJsonBlockEditor,
  StudentComponent: ChecklistBlockRenderer,
  defaultConfig: {
    id: 'chk-mef-audit',
    title: 'Checklist de Auditoria de Modelo Estrutural (MEF)',
    items: [
      { id: 'c1', label: 'Verificar unidades coerentes (Ex: N, mm, MPa, tonelada)' },
      { id: 'c2', label: 'Conferir se não há mecanismos livres (matriz com pivô nulo)' },
      { id: 'c3', label: 'Validar reações de apoio comparando com o somatório estático manual' },
      { id: 'c4', label: 'Avaliar descontinuidade de tensões entre elementos vizinhos' },
    ],
  },
})

// 10. Image
registerBlock({
  type: 'image',
  version: '1.0.0',
  title: 'Imagem / Diagrama Técnico',
  description: 'Ilustração de malha, diagrama de esforços ou foto de ensaio laboratorial.',
  category: 'media',
  priority: 'P0',
  completionPolicy: 'manual',
  supportedOutputs: ['viewed'],
  validateConfig: (config) => {
    const errors: string[] = []
    if (!config.imageUrl) errors.push('A URL da imagem é obrigatória.')
    return { valid: errors.length === 0, errors }
  },
  EditorComponent: GenericJsonBlockEditor,
  StudentComponent: ImageBlockRenderer,
  defaultConfig: {
    imageUrl: 'https://img.usecurling.com/p/800/400?q=finite%20element%20mesh',
    alt: 'Distribuição de tensões de von Mises em suporte mecânico',
    caption: 'Figura 3.2 — Gradiente de tensões após refinamento adaptativo da malha.',
  },
})

// 11. Formula Reference
registerBlock({
  type: 'formula_reference',
  version: '1.0.0',
  title: 'Painel de Fórmulas de Referência',
  description: 'Quadro síntese de relações constitutivas e equações para consulta rápida.',
  category: 'media',
  priority: 'P0',
  completionPolicy: 'manual',
  supportedOutputs: ['consulted'],
  validateConfig: (config) => {
    const errors: string[] = []
    const formulas = (config.formulas as unknown[]) || []
    if (formulas.length === 0) errors.push('Adicione pelo menos uma fórmula de referência.')
    return { valid: errors.length === 0, errors }
  },
  EditorComponent: GenericJsonBlockEditor,
  StudentComponent: FormulaReferenceBlockRenderer,
  defaultConfig: {
    title: 'Relações Fundamentais de Elasticidade Isotrópica',
    formulas: [
      {
        label: 'Lei de Hooke Unidimensional',
        latex: '\\sigma = E \\cdot \\varepsilon',
        description: 'Relação linear válida até o limite de proporcionalidade.',
      },
      {
        label: 'Módulo de Elasticidade Transversal',
        latex: 'G = \\frac{E}{2(1 + \\nu)}',
        description: 'Dependência entre E e coeficiente de Poisson.',
      },
      {
        label: 'Tensão de von Mises',
        latex: '\\sigma_{vm} = \\sqrt{\\sigma_1^2 - \\sigma_1\\sigma_2 + \\sigma_2^2}',
        description: 'Estado plano de tensões ($\\sigma_3 = 0$).',
      },
    ],
  },
})

// 12. Milestone Video
registerBlock({
  type: 'milestone_video',
  version: '1.0.0',
  title: 'Vídeo de Marco de Jornada',
  description: 'Mensagem do coordenador em transições críticas da trilha.',
  category: 'flow',
  priority: 'P0',
  completionPolicy: 'watched',
  supportedOutputs: ['watched'],
  validateConfig: (config) => {
    const errors: string[] = []
    if (!config.youtubeId) errors.push('O ID do vídeo é obrigatório.')
    return { valid: errors.length === 0, errors }
  },
  EditorComponent: GenericJsonBlockEditor,
  StudentComponent: MilestoneVideoBlockRenderer,
  defaultConfig: {
    mentorName: 'Prof. Dra. Mariana Bittencourt',
    headline: 'Parabéns pela conclusão da Fase de Formulação 1D!',
    youtubeId: 'kJQP7kiw5Fk',
  },
})

// 13. CTA (Chamada Comercial Contextual)
registerBlock({
  type: 'cta',
  version: '1.0.0',
  title: 'Chamada Contextual (CTA)',
  description: 'Ponto de conversão para extensões técnicas ou especializações.',
  category: 'marketing',
  priority: 'P0',
  completionPolicy: 'composite',
  supportedOutputs: ['clicked'],
  validateConfig: (config) => {
    const errors: string[] = []
    if (!config.title) errors.push('O título da chamada é obrigatório.')
    if (!config.targetUrl) errors.push('O link de destino é obrigatório.')
    return { valid: errors.length === 0, errors }
  },
  EditorComponent: GenericJsonBlockEditor,
  StudentComponent: CtaBlockRenderer,
  defaultConfig: {
    title: 'Pronto para dominar o cálculo de Galpões Industriais?',
    description:
      'Acesse o módulo de pós-graduação em Dimensionamento de Estruturas Metálicas (NBR 8800).',
    buttonText: 'Conhecer Extensão NBR 8800',
    targetUrl: '/app/assinatura',
  },
})

// 14. Conditional Gate
registerBlock({
  type: 'conditional_gate',
  version: '1.0.0',
  title: 'Gate de Competência Condicional',
  description: 'Trava de avanço que exige pré-requisitos pedagógicos cumpridos.',
  category: 'flow',
  priority: 'P0',
  completionPolicy: 'manual',
  supportedOutputs: ['isUnlocked'],
  validateConfig: (config) => {
    const errors: string[] = []
    if (!config.title) errors.push('O título do portão é obrigatório.')
    return { valid: errors.length === 0, errors }
  },
  EditorComponent: GenericJsonBlockEditor,
  StudentComponent: ConditionalGateBlockRenderer,
  defaultConfig: {
    title: 'Portão de Transição: Validação de Modelos CAE',
    requirement:
      'Exige nota mínima de 80% no Quiz de Convergência de Malha e entrega da tarefa prática.',
    isUnlocked: false,
  },
})

// ==========================================
// REGISTRO DOS TIPOS P1/P2 (PLANEJADOS / CATÁLOGO)
// ==========================================

const PLANNED_BLOCKS: Array<{
  type: BlockTypeId
  title: string
  description: string
  category: BlockCategory
  priority: BlockPriority
}> = [
  // --- P1 (Especificação Técnica §5) ---
  {
    type: 'match_pairs',
    title: 'Associação de Pares (Match Pairs)',
    description:
      'Associação conceitual bilateral entre conceitos, fórmulas e aplicações de engenharia.',
    category: 'assessment',
    priority: 'P1',
  },
  {
    type: 'fill_equation',
    title: 'Preenchimento de Equação (Fill Equation)',
    description: 'Complementação de lacunas em relações constitutivas e deduções matemáticas.',
    category: 'assessment',
    priority: 'P1',
  },
  {
    type: 'hotspot_image',
    title: 'Imagem com Pontos de Interesse (Hotspot Image)',
    description:
      'Identificação visual interativa de pontos críticos, singularidades e condições de contorno.',
    category: 'interaction',
    priority: 'P1',
  },
  {
    type: 'drag_drop',
    title: 'Arrastar e Soltar (Drag & Drop)',
    description:
      'Posicionamento e classificação interativa de componentes mecânicos e estruturais.',
    category: 'interaction',
    priority: 'P1',
  },
  {
    type: 'compare_models',
    title: 'Comparador de Modelos (Compare Models)',
    description:
      'Análise comparativa lado a lado entre formulações analíticas e simulações numéricas.',
    category: 'interaction',
    priority: 'P1',
  },
  {
    type: 'error_detection',
    title: 'Detecção de Erros (Error Detection)',
    description:
      'Diagnóstico e auditoria técnica de inconsistências em memoriais de cálculo ou malhas.',
    category: 'assessment',
    priority: 'P1',
  },
  {
    type: 'engineering_decision',
    title: 'Decisão de Engenharia (Engineering Decision)',
    description:
      'Árvore de decisão situacional com trade-offs de segurança, custo e viabilidade técnica.',
    category: 'interaction',
    priority: 'P1',
  },
  {
    type: 'mind_map',
    title: 'Mapa Mental Técnico (Mind Map)',
    description: 'Representação hierárquica e conexões entre disciplinas e normas aplicáveis.',
    category: 'media',
    priority: 'P1',
  },
  {
    type: 'flashcards',
    title: 'Cartões de Memorização Ativa (Flashcards)',
    description:
      'Revisão espaçada de conceitos-chave, critérios de escoamento e definições normativas.',
    category: 'interaction',
    priority: 'P1',
  },
  {
    type: 'audio',
    title: 'Áudio / Explicação Falada (Audio)',
    description: 'Comentários técnicos e laudos periciais explicados em formato de áudio imersivo.',
    category: 'media',
    priority: 'P1',
  },
  {
    type: 'download',
    title: 'Download de Recursos (Download)',
    description: 'Disponibilização de planilhas, scripts e arquivos de suporte para o aluno.',
    category: 'media',
    priority: 'P1',
  },
  {
    type: 'competency_assessment',
    title: 'Avaliação de Competência (Competency Assessment)',
    description:
      'Diagnóstico situacional do nível de maturidade e domínio técnico da matriz de competências.',
    category: 'assessment',
    priority: 'P1',
  },
  {
    type: 'adaptive_review',
    title: 'Revisão Adaptativa (Adaptive Review)',
    description:
      'Trilha dinâmica de reforço baseada nos gaps diagnosticados nas questões anteriores.',
    category: 'flow',
    priority: 'P1',
  },
  {
    type: 'ai_tutor',
    title: 'Tutor de Inteligência Artificial (AI Tutor)',
    description:
      'Assistência pedagógica com foco socrático e embasamento nas normas e memoriais do curso.',
    category: 'interaction',
    priority: 'P1',
  },

  // --- P2 (Especificação Técnica §5) ---
  {
    type: 'beam_load_simulator',
    title: 'Simulador de Cargas em Vigas (Beam Load Simulator)',
    description:
      'Simulação interativa de diagramas de momento fletor e esforço cortante sob carregamentos.',
    category: 'interaction',
    priority: 'P2',
  },
  {
    type: 'stress_contour_interpretation',
    title: 'Interpretação de Contorno de Tensões (Stress Contour Interpretation)',
    description:
      'Leitura crítica de franjas de tensão de von Mises e identificação de artefatos numéricos.',
    category: 'interaction',
    priority: 'P2',
  },
  {
    type: 'parameter_slider',
    title: 'Controle Paramétrico Dinâmico (Parameter Slider)',
    description: 'Ajuste de variáveis de projeto em tempo real com resposta imediata nos cálculos.',
    category: 'interaction',
    priority: 'P2',
  },
  {
    type: 'graph_plotter',
    title: 'Plotter Gráfico Interativo (Graph Plotter)',
    description:
      'Traçado de curvas tensão-deformação, convergência de malha e diagramas de equilíbrio.',
    category: 'media',
    priority: 'P2',
  },
  {
    type: 'unit_conversion',
    title: 'Conversor de Unidades de Engenharia (Unit Conversion)',
    description:
      'Validação e conversão consistente entre sistemas internacional e empírico de unidades.',
    category: 'interaction',
    priority: 'P2',
  },
  {
    type: 'interactive_fbd',
    title: 'Diagrama de Corpo Livre Interativo (Interactive FBD)',
    description: 'Montagem visual e equilíbrio de forças e momentos sobre elementos mecânicos.',
    category: 'interaction',
    priority: 'P2',
  },
  {
    type: 'external_lti_scorm_adapter',
    title: 'Adaptador Externo LTI / SCORM (External LTI SCORM Adapter)',
    description:
      'Integração interoperável com laboratórios virtuais e pacotes legados de treinamento.',
    category: 'flow',
    priority: 'P2',
  },
  {
    type: 'rubric_free_text',
    title: 'Resposta Discursiva com Rubrica (Rubric Free Text)',
    description:
      'Avaliação de memoriais e justificativas discursivas guiada por matriz de critérios técnicos.',
    category: 'assessment',
    priority: 'P2',
  },
]

for (const pb of PLANNED_BLOCKS) {
  registerBlock({
    type: pb.type,
    version: '0.1.0-planejado',
    title: pb.title,
    description: pb.description,
    category: pb.category,
    priority: pb.priority,
    completionPolicy: 'composite',
    supportedOutputs: ['planned'],
    validateConfig: () => ({ valid: true }),
    EditorComponent: () => (
      <div className="p-4 rounded border border-dashed border-[#C69B4B]/40 bg-[#152228]/40 text-xs text-[#C69B4B]">
        Tipo planejado ({pb.priority}). O editor deste bloco estará disponível na Fase 3/4.
      </div>
    ),
    StudentComponent: () => (
      <div className="p-4 rounded border border-dashed border-[#294149] bg-[#0C1317] text-xs text-[#A8BBC0]">
        Bloco {pb.title} planejado para entregas futuras.
      </div>
    ),
    defaultConfig: { status: 'planned' },
  })
}
