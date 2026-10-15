/**
 * Engenharia Divergente Academy — Dataset de Demonstração Centralizado
 *
 * AVISO DE CONFORMIDADE:
 * "Não use dados fictícios como se fossem dados reais. Dados de demonstração
 * devem estar explicitamente identificados e separados do ambiente de produção."
 *
 * Todos os registros possuem a flag `isDemo: true`.
 * Quando o Supabase for conectado, a camada de serviços consumirá o banco e este
 * arquivo permanecerá apenas para testes de vitrine e modo preview.
 */

export const IS_DEMO = true
export const DEMO_NOTICE_TEXT =
  'Modo demonstração ativo — nenhum dado real é salvo ou compartilhado. Integração com banco de dados marcada como PENDENTE (Fase 1).'

export type Role = 'student' | 'content_editor' | 'admin' | 'super_admin'

export interface UserSession {
  id: string
  name: string
  email: string
  role: Role
  avatarUrl?: string
  headline?: string
  creaNumber?: string // engenharia
  streakDays: number
  totalXp: number
  isDemo: true
}

export interface StudentCourse {
  id: string
  slug: string
  title: string
  category: string
  level: 'Iniciante' | 'Intermediário' | 'Avançado'
  description: string
  workloadHours: number
  progressPercent: number
  completedLessons: number
  totalLessons: number
  lastAccessed: string
  hasEntitlement: boolean
  entitlementReason?: string
  coverGradient: string
  badgeText: string
  isDemo: true
}

export interface TrackModule {
  id: string
  order: number
  title: string
  description: string
  state: 'concluido' | 'disponivel' | 'bloqueado' | 'revisao'
  estimatedHours: number
  topics: string[]
  isDemo: true
}

export interface TrackDetail {
  id: string
  slug: string
  title: string
  headline: string
  description: string
  level: string
  totalHours: number
  hasEntitlement: boolean
  entitlementReason: string
  modules: TrackModule[]
  prerequisites: string[]
  isDemo: true
}

export interface DeadlineItem {
  id: string
  courseTitle: string
  taskTitle: string
  dueDate: string
  dueInDays: number
  isOverdue: boolean
  isDemo: true
}

export interface WeeklyStudyDay {
  day: string
  hours: number
  targetHours: number
  isDemo: true
}

export interface HistoricalWeek {
  week: string
  hours: number
  accumulated: number
  isDemo: true
}

export interface CompetencyScore {
  name: string
  level: string
  scorePercent: number
  category: string
  isDemo: true
}

export interface StudySession {
  id: string
  date: string
  courseName: string
  durationMinutes: number
  focusArea: string
  isDemo: true
}

export interface CertificateItem {
  id: string
  code: string
  courseTitle: string
  issueDate?: string
  studentName: string
  instructor: string
  workloadHours: number
  gradeScore?: number
  isEarned: boolean
  verificationHash?: string
  isDemo: true
}

export interface AchievementItem {
  id: string
  title: string
  description: string
  icon: string
  earned: boolean
  earnedAt?: string
  category: 'consistencia' | 'desempenho' | 'engenharia' | 'comunidade'
  rarity: 'Comum' | 'Rara' | 'Épica' | 'Lendária'
  xpReward: number
  isDemo: true
}

export interface EntitlementItem {
  id: string
  productCode: string
  productName: string
  tier: 'Assinatura Base' | 'Extensão Técnica' | 'Especialização Fechada'
  grantedVia: string
  validUntil: string
  isActive: boolean
  notes: string
  isDemo: true
}

export interface AdminStudentRow {
  id: string
  name: string
  email: string
  crea?: string
  primaryCourse: string
  progress: number
  status: 'Ativo' | 'Inativo' | 'Pendente'
  enrolledAt: string
  lastActive: string
  isDemo: true
}

export interface AdminCourseRow {
  id: string
  slug: string
  title: string
  category: string
  enrolledStudents: number
  completionRate: number
  workloadHours: number
  status: 'Publicado' | 'Rascunho' | 'Em revisão'
  isDemo: true
}

export interface AdminEnrollmentRow {
  id: string
  studentName: string
  studentEmail: string
  courseTitle: string
  enrolledAt: string
  progress: number
  status: 'Ativa' | 'Concluída' | 'Cancelada'
  isDemo: true
}

export interface AdminActivityItem {
  id: string
  timestamp: string
  actorName: string
  action: string
  target: string
  type: 'matricula' | 'conclusao' | 'certificado' | 'sistema'
  isDemo: true
}

// ==========================================
// DADOS DE DEMONSTRAÇÃO
// ==========================================

export const DEMO_USERS: Record<string, UserSession> = {
  'aluno@demo.com': {
    id: 'usr-student-001',
    name: 'Eng. Lucas Miranda',
    email: 'aluno@demo.com',
    role: 'student',
    headline: 'Engenheiro Mecânico • Foco em Análise Estrutural',
    creaNumber: 'SP-2021104829',
    streakDays: 14,
    totalXp: 2840,
    isDemo: true,
  },
  'admin@demo.com': {
    id: 'usr-admin-001',
    name: 'Coord. Dra. Mariana Bittencourt',
    email: 'admin@demo.com',
    role: 'admin',
    headline: 'Coordenadora Acadêmica • Engenharia Divergente',
    creaNumber: 'PR-199840231',
    streakDays: 45,
    totalXp: 9150,
    isDemo: true,
  },
  'editor@demo.com': {
    id: 'usr-editor-001',
    name: 'Eng. Roberto Vasconcelos',
    email: 'editor@demo.com',
    role: 'content_editor',
    headline: 'Editor Técnico de Conteúdo • Engenharia Divergente',
    creaNumber: 'MG-201590124',
    streakDays: 20,
    totalXp: 4320,
    isDemo: true,
  },
}

export const STUDENT_COURSES: StudentCourse[] = [
  {
    id: 'crs-001',
    slug: 'formacao-continua-introdutoria',
    title: 'Formação Contínua: Fundamentos e Pensamento Divergente',
    category: 'Nivelamento & Métodos',
    level: 'Iniciante',
    description:
      'Alinhamento epistemológico, boas práticas de modelagem e postura investigativa para resolução de problemas reais de engenharia.',
    workloadHours: 24,
    progressPercent: 68,
    completedLessons: 17,
    totalLessons: 25,
    lastAccessed: 'Hoje às 14:32',
    hasEntitlement: true,
    coverGradient: 'from-emerald-950/60 to-teal-900/40',
    badgeText: 'Disponível via Assinatura',
    isDemo: true,
  },
  {
    id: 'crs-002',
    slug: 'metodo-zero-ao-mef',
    title: 'Método do Zero ao MEF (MDZAM)',
    category: 'Cálculo Avançado',
    level: 'Intermediário',
    description:
      'Formulação variacional, elementos finitos 1D/2D/3D, critérios de convergência e validação analítica para projetos de alta responsabilidade.',
    workloadHours: 60,
    progressPercent: 42,
    completedLessons: 21,
    totalLessons: 50,
    lastAccessed: 'Ontem às 20:10',
    hasEntitlement: true,
    coverGradient: 'from-teal-950/70 to-slate-900/50',
    badgeText: 'Entitlement Ativo',
    isDemo: true,
  },
  {
    id: 'crs-003',
    slug: 'solidworks-simulation',
    title: 'SOLIDWORKS Simulation: Análise Estática e Fadiga',
    category: 'Ferramentas CAE',
    level: 'Intermediário',
    description:
      'Configuração de malhas, condições de contorno de contato, não-linearidades geométricas e verificação de fadiga segundo normas.',
    workloadHours: 45,
    progressPercent: 15,
    completedLessons: 6,
    totalLessons: 40,
    lastAccessed: 'Há 4 dias',
    hasEntitlement: true,
    coverGradient: 'from-cyan-950/70 to-zinc-900/50',
    badgeText: 'Entitlement Ativo',
    isDemo: true,
  },
  {
    id: 'crs-004',
    slug: 'estruturas-metalicas',
    title: 'Dimensionamento de Estruturas Metálicas (NBR 8800)',
    category: 'Engenharia Estrutural',
    level: 'Avançado',
    description:
      'Estados limites últimos e de serviço, estabilidade global, ligações parafusadas/soldadas e modelos computacionais com vigas mistas.',
    workloadHours: 80,
    progressPercent: 0,
    completedLessons: 0,
    totalLessons: 48,
    lastAccessed: 'Não iniciado',
    hasEntitlement: false,
    entitlementReason:
      'Requer Entitlement Especializado "Extensão Estruturas Metálicas". A assinatura básica não inclui módulos de pós-graduação técnica.',
    coverGradient: 'from-slate-950/80 to-zinc-950/60',
    badgeText: 'Bloqueado por Entitlement',
    isDemo: true,
  },
]

export const TRACK_DETAILS: Record<string, TrackDetail> = {
  'formacao-continua-introdutoria': {
    id: 'trk-001',
    slug: 'formacao-continua-introdutoria',
    title: 'Formação Contínua: Fundamentos e Pensamento Divergente',
    headline: 'A base matemática e atitudinal do engenheiro investigativo',
    description:
      'Trilha estruturada para transicionar da resolução mecânica de fórmulas para a análise crítica de problemas complexos de projeto e manufatura.',
    level: 'Iniciante / Fundamentos',
    totalHours: 24,
    hasEntitlement: true,
    entitlementReason: 'Liberado pela Assinatura Base Anual.',
    prerequisites: ['Álgebra Linear básica', 'Cálculo Diferencial e Integral I'],
    modules: [
      {
        id: 'mod-1',
        order: 1,
        title: 'Módulo 01 — Epistemologia e Heurística na Engenharia',
        description: 'Diferença entre modelo matemático, aproximação numérica e realidade física.',
        state: 'concluido',
        estimatedHours: 4,
        topics: ['Limites dos modelos', 'Ordem de grandeza', 'Detecção de anomalias conceituais'],
        isDemo: true,
      },
      {
        id: 'mod-2',
        order: 2,
        title: 'Módulo 02 — Mecânica dos Sólidos: Da Teoria ao Campo',
        description: 'Tensões principais, círculos de Mohr e hipóteses constitutivas fundamentais.',
        state: 'concluido',
        estimatedHours: 6,
        topics: [
          'Tensores de tensão e deformação',
          'Critérios de Tresca e von Mises',
          'Sensibilidade',
        ],
        isDemo: true,
      },
      {
        id: 'mod-3',
        order: 3,
        title: 'Módulo 03 — Formulação Fraca e Princípio dos Trabalhos Virtuais',
        description: 'Ponte matemática entre equações diferenciais e métodos numéricos discretos.',
        state: 'disponivel',
        estimatedHours: 8,
        topics: ['Trabalhos virtuais', 'Funcionais de energia', 'Resíduos ponderados (Galerkin)'],
        isDemo: true,
      },
      {
        id: 'mod-4',
        order: 4,
        title: 'Módulo 04 — Estudos de Caso Reais de Falha Estrutural',
        description:
          'Análise post-mortem de falhas industriais documentadas com relatórios técnicos.',
        state: 'bloqueado',
        estimatedHours: 6,
        topics: [
          'Flambagem inesperada',
          'Fadiga em solda de alta resistência',
          'Elaboração de laudo',
        ],
        isDemo: true,
      },
    ],
    isDemo: true,
  },
  'metodo-zero-ao-mef': {
    id: 'trk-002',
    slug: 'metodo-zero-ao-mef',
    title: 'Método do Zero ao MEF (MDZAM)',
    headline: 'Domínio analítico e computacional do Método dos Elementos Finitos',
    description:
      'Construção passo a passo do método: matrizes de rigidez elementares, montagem global, condições de fronteira essenciais/naturais e pós-processamento confiável.',
    level: 'Intermediário a Avançado',
    totalHours: 60,
    hasEntitlement: true,
    entitlementReason: 'Liberado por matrícula adquirida (MDZAM Turma 04).',
    prerequisites: ['Mecânica dos Sólidos II', 'Cálculo Numérico', 'Álgebra Matricial'],
    modules: [
      {
        id: 'mef-1',
        order: 1,
        title: 'Fase 01 — Formulação 1D: Barras e Vigas de Euler-Bernoulli',
        description: 'Dedução exata das funções de forma e matrizes de rigidez.',
        state: 'concluido',
        estimatedHours: 12,
        topics: ['Funções de interpolação', 'Matriz de rigidez da barra', 'Pórticos planos'],
        isDemo: true,
      },
      {
        id: 'mef-2',
        order: 2,
        title: 'Fase 02 — Estado Plano de Tensão e Deformação (2D)',
        description: 'Elementos triangulares CST, LST e quadrilaterais isoparamétricos Q4.',
        state: 'disponivel',
        estimatedHours: 16,
        topics: ['Coordenadas naturais', 'Jacobiano de transformação', 'Integração de Gauss'],
        isDemo: true,
      },
      {
        id: 'mef-3',
        order: 3,
        title: 'Fase 03 — Convergência de Malha, Singularidades e Erros de Discretização',
        description:
          'Como blindar seus laudos contra artefatos numéricos causados por cantos vivos e apoios pontuais.',
        state: 'revisao',
        estimatedHours: 14,
        topics: [
          'Teorema de Saint-Venant',
          'Singularidades vs. Concentradores',
          'Indicadores h e p',
        ],
        isDemo: true,
      },
      {
        id: 'mef-4',
        order: 4,
        title: 'Fase 04 — Sólidos 3D, Contato e Não-linearidade Física',
        description:
          'Tetrápodes, hexaedros e plasticidade de von Mises aplicada a peças automotivas e de máquinas.',
        state: 'bloqueado',
        estimatedHours: 18,
        topics: [
          'Algoritmo Newton-Raphson',
          'Formulação de contato penalizado/Lagrange',
          'Validação',
        ],
        isDemo: true,
      },
    ],
    isDemo: true,
  },
  'solidworks-simulation': {
    id: 'trk-003',
    slug: 'solidworks-simulation',
    title: 'SOLIDWORKS Simulation: Análise Estática e Fadiga',
    headline: 'Prática CAE profissional sem confiar cegamente nos botões do software',
    description:
      'Diretrizes de modelagem CAD voltada para simulação, controle fino de malha e validação cruzada com fórmulas analíticas consagradas.',
    level: 'Intermediário',
    totalHours: 45,
    hasEntitlement: true,
    entitlementReason: 'Entitlement liberado pelo pacote Simulação Prática.',
    prerequisites: ['Modelagem 3D básica em CAD', 'Resistência dos Materiais'],
    modules: [
      {
        id: 'sw-1',
        order: 1,
        title: 'Módulo 01 — Simplificação Geométrica Inteligente',
        description:
          'Desfeaturement sem perda de rigidez global ou de caminhos de carga primários.',
        state: 'concluido',
        estimatedHours: 8,
        topics: ['Supressão de raios secundários', 'Uso de corpos de casca e viga', 'Simetria'],
        isDemo: true,
      },
      {
        id: 'sw-2',
        order: 2,
        title: 'Módulo 02 — Conectores e Restrições Físicas Realistas',
        description:
          'Substituição de apoios engastados artificiais por molas elásticas e parafusos pré-carregados.',
        state: 'disponivel',
        estimatedHours: 12,
        topics: ['Parafusos virtuais com torque', 'Apoios elásticos', 'Pinos e juntas'],
        isDemo: true,
      },
      {
        id: 'sw-3',
        order: 3,
        title: 'Módulo 03 — Avaliação de Fadiga por Tensão Alternada',
        description:
          'Curvas S-N, correção por média de Goodman/Soderberg e dano acumulado de Miner.',
        state: 'bloqueado',
        estimatedHours: 15,
        topics: ['Curvas de Wöhler', 'Fatores de Marin (acabamento superficial)', 'Vida em ciclos'],
        isDemo: true,
      },
      {
        id: 'sw-4',
        order: 4,
        title: 'Módulo 04 — Emissão e Defesa de Relatório de Conformidade',
        description:
          'Estruturação do dossiê comprobatório segundo exigências de auditorias e seguradoras.',
        state: 'bloqueado',
        estimatedHours: 10,
        topics: ['Matriz de incertezas', 'Rastreabilidade de malha', 'Assinatura técnica'],
        isDemo: true,
      },
    ],
    isDemo: true,
  },
  'estruturas-metalicas': {
    id: 'trk-004',
    slug: 'estruturas-metalicas',
    title: 'Dimensionamento de Estruturas Metálicas (NBR 8800)',
    headline: 'Cálculo de galpões industriais, mezaninos e ligações segundo a norma brasileira',
    description:
      'Aplicação aprofundada dos métodos de verificação de flambagem local e global, vigas mistas com conectores de cisalhamento e projeto detalhado de ligações soldadas e parafusadas.',
    level: 'Avançado',
    totalHours: 80,
    hasEntitlement: false,
    entitlementReason:
      'Acesso restrito: este produto exige aquisição individual ou plano Corporativo Master. A assinatura anual base NÃO inclui este programa técnico de pós-graduação.',
    prerequisites: ['NBR 8800:2008', 'Mecânica das Estruturas III', 'Estabilidade Elástica'],
    modules: [
      {
        id: 'em-1',
        order: 1,
        title: 'Capítulo 01 — Fundamentos da NBR 8800 e Ações em Edificações',
        description: 'Combinações de ações normais e excepcionais (NBR 8681 e NBR 6123).',
        state: 'bloqueado',
        estimatedHours: 15,
        topics: ['Vento em galpões', 'Combinações ELU/ELS', 'Aços estruturais ARBL'],
        isDemo: true,
      },
      {
        id: 'em-2',
        order: 2,
        title: 'Capítulo 02 — Elementos Comprimidos e Tracionados',
        description: 'Curvas de flambagem Euler, flambagem por torção e flexotorção.',
        state: 'bloqueado',
        estimatedHours: 20,
        topics: ['Índice de esbeltez reduzido', 'Seções esbeltas e compactas', 'Efeito Shear Lag'],
        isDemo: true,
      },
      {
        id: 'em-3',
        order: 3,
        title: 'Capítulo 03 — Vigas e Flambagem Lateral com Torção (FLT)',
        description:
          'Momento fletor resistente e determinação de espaçamento ótimo de contraventamentos.',
        state: 'bloqueado',
        estimatedHours: 25,
        topics: ['Fator Cb', 'Apoios de contenção lateral', 'Aberturas em almas de perfis'],
        isDemo: true,
      },
      {
        id: 'em-4',
        order: 4,
        title: 'Capítulo 04 — Ligações Parafusadas e Soldadas Resistentes a Momento',
        description:
          'Chapas de topo estendidas, cordões de solda de penetração total e ancoragens.',
        state: 'bloqueado',
        estimatedHours: 20,
        topics: ['Alavancamento (Prying Action)', 'Tensão admissível vs. ELU', 'Chumbadores'],
        isDemo: true,
      },
    ],
    isDemo: true,
  },
}

export const DEADLINES: DeadlineItem[] = [
  {
    id: 'dd-1',
    courseTitle: 'Método do Zero ao MEF',
    taskTitle: 'Entrega do Exercício 03: Malha de Viga em Balanço no Python',
    dueDate: '28 de Março',
    dueInDays: 3,
    isOverdue: false,
    isDemo: true,
  },
  {
    id: 'dd-2',
    courseTitle: 'Formação Contínua',
    taskTitle: 'Quiz Teórico: Princípio de Galerkin e Resíduos Ponderados',
    dueDate: '31 de Março',
    dueInDays: 6,
    isOverdue: false,
    isDemo: true,
  },
  {
    id: 'dd-3',
    courseTitle: 'SOLIDWORKS Simulation',
    taskTitle: 'Verificação do Fator de Concentração de Tensão Kt em Eixo Entalhado',
    dueDate: '04 de Abril',
    dueInDays: 10,
    isOverdue: false,
    isDemo: true,
  },
]

export const WEEKLY_STUDY_HOURS: WeeklyStudyDay[] = [
  { day: 'Seg', hours: 2.2, targetHours: 2.0, isDemo: true },
  { day: 'Ter', hours: 1.8, targetHours: 2.0, isDemo: true },
  { day: 'Qua', hours: 3.0, targetHours: 2.0, isDemo: true },
  { day: 'Qui', hours: 2.5, targetHours: 2.0, isDemo: true },
  { day: 'Sex', hours: 1.2, targetHours: 2.0, isDemo: true },
  { day: 'Sáb', hours: 4.5, targetHours: 3.0, isDemo: true },
  { day: 'Dom', hours: 1.0, targetHours: 1.5, isDemo: true },
]

export const HISTORICAL_PROGRESS: HistoricalWeek[] = [
  { week: 'Sem 01', hours: 11.2, accumulated: 11.2, isDemo: true },
  { week: 'Sem 02', hours: 13.5, accumulated: 24.7, isDemo: true },
  { week: 'Sem 03', hours: 9.8, accumulated: 34.5, isDemo: true },
  { week: 'Sem 04', hours: 15.0, accumulated: 49.5, isDemo: true },
  { week: 'Sem 05', hours: 14.2, accumulated: 63.7, isDemo: true },
  { week: 'Sem 06', hours: 16.8, accumulated: 80.5, isDemo: true },
  { week: 'Sem 07', hours: 13.9, accumulated: 94.4, isDemo: true },
  { week: 'Sem 08', hours: 16.2, accumulated: 110.6, isDemo: true },
]

export const COMPETENCIES: CompetencyScore[] = [
  {
    name: 'Mecânica dos Sólidos Analítica',
    level: 'Avançado',
    scorePercent: 88,
    category: 'Teoria',
    isDemo: true,
  },
  {
    name: 'Formulação de Elementos Finitos 1D/2D',
    level: 'Intermediário',
    scorePercent: 72,
    category: 'Cálculo',
    isDemo: true,
  },
  {
    name: 'Diagnóstico de Singularidades de Tensão',
    level: 'Avançado',
    scorePercent: 84,
    category: 'Prática CAE',
    isDemo: true,
  },
  {
    name: 'Interpretação de Normas Estruturais',
    level: 'Intermediário',
    scorePercent: 65,
    category: 'Regulatório',
    isDemo: true,
  },
  {
    name: 'Elaboração de Dossiês e Pareceres Técnicos',
    level: 'Intermediário',
    scorePercent: 70,
    category: 'Engenharia',
    isDemo: true,
  },
]

export const RECENT_SESSIONS: StudySession[] = [
  {
    id: 'ses-1',
    date: '25/03/2025 • 14:32',
    courseName: 'Formação Contínua',
    durationMinutes: 52,
    focusArea: 'Formulação Fraca e Resíduos de Galerkin',
    isDemo: true,
  },
  {
    id: 'ses-2',
    date: '24/03/2025 • 20:10',
    courseName: 'Método do Zero ao MEF',
    durationMinutes: 75,
    focusArea: 'Resolução Numérica de Sistema Global com Cholesky',
    isDemo: true,
  },
  {
    id: 'ses-3',
    date: '23/03/2025 • 16:05',
    courseName: 'SOLIDWORKS Simulation',
    durationMinutes: 40,
    focusArea: 'Refinamento Adaptativo de Malha baseada em Tensão',
    isDemo: true,
  },
  {
    id: 'ses-4',
    date: '21/03/2025 • 19:45',
    courseName: 'Método do Zero ao MEF',
    durationMinutes: 60,
    focusArea: 'Funções de Forma Hermitianas para Vigas',
    isDemo: true,
  },
]

export const CERTIFICATES: CertificateItem[] = [
  {
    id: 'cert-001',
    code: 'EDIV-CERT-2024-FCPD-0881',
    courseTitle: 'Formação Contínua: Fundamentos e Pensamento Divergente',
    issueDate: '12 de Fevereiro de 2025',
    studentName: 'Lucas Miranda',
    instructor: 'Dra. Mariana Bittencourt',
    workloadHours: 24,
    gradeScore: 9.4,
    isEarned: true,
    verificationHash: '9a7f-bc31-01b5-9a4f-ediv',
    isDemo: true,
  },
  {
    id: 'cert-002',
    code: 'EDIV-CERT-2025-MDZAM-PENDING',
    courseTitle: 'Método do Zero ao MEF (MDZAM)',
    studentName: 'Lucas Miranda',
    instructor: 'Dra. Mariana Bittencourt',
    workloadHours: 60,
    isEarned: false,
    isDemo: true,
  },
  {
    id: 'cert-003',
    code: 'EDIV-CERT-2025-SWSS-PENDING',
    courseTitle: 'SOLIDWORKS Simulation: Análise Estática e Fadiga',
    studentName: 'Lucas Miranda',
    instructor: 'Eng. Renato Falcão',
    workloadHours: 45,
    isEarned: false,
    isDemo: true,
  },
  {
    id: 'cert-004',
    code: 'EDIV-CERT-2025-STRMET-LOCKED',
    courseTitle: 'Dimensionamento de Estruturas Metálicas (NBR 8800)',
    studentName: 'Lucas Miranda',
    instructor: 'Dr. Claudio Vasconcelos',
    workloadHours: 80,
    isEarned: false,
    isDemo: true,
  },
]

export const ACHIEVEMENTS: AchievementItem[] = [
  {
    id: 'ach-1',
    title: 'Rigor Newtoniano',
    description: 'Completou 10 exercícios numéricos consecutivos sem recorrer a gabaritos rápidos.',
    icon: 'Brain',
    earned: true,
    earnedAt: '18/03/2025',
    category: 'desempenho',
    rarity: 'Rara',
    xpReward: 350,
    isDemo: true,
  },
  {
    id: 'ach-2',
    title: 'Constância de Laboratório',
    description: 'Manteve 14 dias consecutivos de estudo ativo sem interrupções.',
    icon: 'Flame',
    earned: true,
    earnedAt: '24/03/2025',
    category: 'consistencia',
    rarity: 'Comum',
    xpReward: 200,
    isDemo: true,
  },
  {
    id: 'ach-3',
    title: 'Caçador de Singularidades',
    description: 'Identificou corretamente um ponto de singularidade fictícia em malha MEF.',
    icon: 'Crosshair',
    earned: true,
    earnedAt: '05/03/2025',
    category: 'engenharia',
    rarity: 'Épica',
    xpReward: 600,
    isDemo: true,
  },
  {
    id: 'ach-4',
    title: 'Mestre da Norma NBR',
    description:
      'Concluiu a avaliação estrutural com aderência de 100% aos coeficientes da NBR 8800.',
    icon: 'ShieldCheck',
    earned: false,
    category: 'engenharia',
    rarity: 'Lendária',
    xpReward: 1200,
    isDemo: true,
  },
  {
    id: 'ach-5',
    title: 'Primeiro Parecer Divergente',
    description: 'Publicou um questionamento fundamentado no fórum de revisão por pares.',
    icon: 'MessageSquareCheck',
    earned: true,
    earnedAt: '28/02/2025',
    category: 'comunidade',
    rarity: 'Comum',
    xpReward: 150,
    isDemo: true,
  },
]

export const ENTITLEMENTS: EntitlementItem[] = [
  {
    id: 'ent-001',
    productCode: 'EDIV-SUB-BASE',
    productName: 'Assinatura Anual Engenharia Divergente',
    tier: 'Assinatura Base',
    grantedVia: 'Plano Anual Renováveis',
    validUntil: '15/01/2026',
    isActive: true,
    notes: 'Acesso total à comunidade técnica, workshops mensais e trilhas de formação contínua.',
    isDemo: true,
  },
  {
    id: 'ent-002',
    productCode: 'EDIV-CRS-MDZAM',
    productName: 'Método do Zero ao MEF (MDZAM)',
    tier: 'Extensão Técnica',
    grantedVia: 'Matrícula Direta Turma 04',
    validUntil: 'Vitalício (acesso ao conteúdo gravado)',
    isActive: true,
    notes: 'Direito a suporte direto em plantões de dúvidas quinzenais com a coordenação.',
    isDemo: true,
  },
  {
    id: 'ent-003',
    productCode: 'EDIV-CRS-SWSS',
    productName: 'SOLIDWORKS Simulation: Análise Estática e Fadiga',
    tier: 'Extensão Técnica',
    grantedVia: 'Upgrade de Pacote Numérico',
    validUntil: '15/01/2026',
    isActive: true,
    notes: 'Inclui biblioteca de malhas prontas e arquivos de geometria parametrizada.',
    isDemo: true,
  },
  {
    id: 'ent-004',
    productCode: 'EDIV-CRS-STRMET',
    productName: 'Dimensionamento de Estruturas Metálicas (NBR 8800)',
    tier: 'Especialização Fechada',
    grantedVia: 'Não adquirido',
    validUntil: '—',
    isActive: false,
    notes:
      'Bloqueado. A assinatura padrão não dá acesso automático a formações técnicas avançadas.',
    isDemo: true,
  },
]

// ==========================================
// DADOS ADMIN
// ==========================================

export const ADMIN_STATS = {
  totalStudents: 348,
  activeStudentsPercentage: 86.2,
  publishedCourses: 4,
  completionRateAverage: 64.5,
  monthlyRevenueDemo: 'R$ 84.650,00',
  isDemo: true,
}

export const ADMIN_STUDENTS: AdminStudentRow[] = [
  {
    id: 'std-001',
    name: 'Eng. Lucas Miranda',
    email: 'aluno@demo.com',
    crea: 'SP-2021104829',
    primaryCourse: 'Método do Zero ao MEF',
    progress: 42,
    status: 'Ativo',
    enrolledAt: '15/01/2025',
    lastActive: 'Hoje',
    isDemo: true,
  },
  {
    id: 'std-002',
    name: 'Eng. Beatriz Siqueira',
    email: 'beatriz.siqueira@eng.com.br',
    crea: 'MG-184920412',
    primaryCourse: 'SOLIDWORKS Simulation',
    progress: 85,
    status: 'Ativo',
    enrolledAt: '03/12/2024',
    lastActive: 'Ontem',
    isDemo: true,
  },
  {
    id: 'std-003',
    name: 'Carlos Eduardo Ramos',
    email: 'carlos.ramos@metalurgica.ind.br',
    crea: 'RS-102948210',
    primaryCourse: 'Formação Contínua: Fundamentos',
    progress: 100,
    status: 'Ativo',
    enrolledAt: '10/11/2024',
    lastActive: 'Há 2 dias',
    isDemo: true,
  },
  {
    id: 'std-004',
    name: 'Juliana Pires de Camargo',
    email: 'juliana.pires@consultoria.com',
    crea: 'PR-19284022',
    primaryCourse: 'Método do Zero ao MEF',
    progress: 18,
    status: 'Pendente',
    enrolledAt: '22/03/2025',
    lastActive: 'Há 3 dias',
    isDemo: true,
  },
  {
    id: 'std-005',
    name: 'Eng. Felipe Dornelles',
    email: 'felipe.dornelles@petroeng.com',
    crea: 'RJ-29402918',
    primaryCourse: 'SOLIDWORKS Simulation',
    progress: 0,
    status: 'Inativo',
    enrolledAt: '05/01/2025',
    lastActive: 'Há 28 dias',
    isDemo: true,
  },
]

export const ADMIN_COURSES: AdminCourseRow[] = [
  {
    id: 'crs-adm-1',
    slug: 'formacao-continua-introdutoria',
    title: 'Formação Contínua: Fundamentos e Pensamento Divergente',
    category: 'Nivelamento & Métodos',
    enrolledStudents: 312,
    completionRate: 78,
    workloadHours: 24,
    status: 'Publicado',
    isDemo: true,
  },
  {
    id: 'crs-adm-2',
    slug: 'metodo-zero-ao-mef',
    title: 'Método do Zero ao MEF (MDZAM)',
    category: 'Cálculo Avançado',
    enrolledStudents: 184,
    completionRate: 59,
    workloadHours: 60,
    status: 'Publicado',
    isDemo: true,
  },
  {
    id: 'crs-adm-3',
    slug: 'solidworks-simulation',
    title: 'SOLIDWORKS Simulation: Análise Estática e Fadiga',
    category: 'Ferramentas CAE',
    enrolledStudents: 142,
    completionRate: 51,
    workloadHours: 45,
    status: 'Publicado',
    isDemo: true,
  },
  {
    id: 'crs-adm-4',
    slug: 'estruturas-metalicas',
    title: 'Dimensionamento de Estruturas Metálicas (NBR 8800)',
    category: 'Engenharia Estrutural',
    enrolledStudents: 64,
    completionRate: 40,
    workloadHours: 80,
    status: 'Em revisão',
    isDemo: true,
  },
]

export const ADMIN_ENROLLMENTS: AdminEnrollmentRow[] = [
  {
    id: 'mat-001',
    studentName: 'Eng. Lucas Miranda',
    studentEmail: 'aluno@demo.com',
    courseTitle: 'Método do Zero ao MEF',
    enrolledAt: '15/01/2025',
    progress: 42,
    status: 'Ativa',
    isDemo: true,
  },
  {
    id: 'mat-002',
    studentName: 'Beatriz Siqueira',
    studentEmail: 'beatriz.siqueira@eng.com.br',
    courseTitle: 'SOLIDWORKS Simulation',
    enrolledAt: '03/12/2024',
    progress: 85,
    status: 'Ativa',
    isDemo: true,
  },
  {
    id: 'mat-003',
    studentName: 'Carlos Eduardo Ramos',
    studentEmail: 'carlos.ramos@metalurgica.ind.br',
    courseTitle: 'Formação Contínua',
    enrolledAt: '10/11/2024',
    progress: 100,
    status: 'Concluída',
    isDemo: true,
  },
  {
    id: 'mat-004',
    studentName: 'Felipe Dornelles',
    studentEmail: 'felipe.dornelles@petroeng.com',
    courseTitle: 'SOLIDWORKS Simulation',
    enrolledAt: '05/01/2025',
    progress: 0,
    status: 'Cancelada',
    isDemo: true,
  },
]

export const ADMIN_MONTHLY_STUDENTS = [
  { month: 'Out', novos: 38 },
  { month: 'Nov', novos: 52 },
  { month: 'Dez', novos: 41 },
  { month: 'Jan', novos: 86 },
  { month: 'Fev', novos: 65 },
  { month: 'Mar', novos: 74 },
]

export const ADMIN_COURSE_DISTRIBUTION = [
  { name: 'Formação Contínua', value: 312, color: '#01B59A' },
  { name: 'Método do Zero ao MEF', value: 184, color: '#38BDF8' },
  { name: 'SOLIDWORKS Sim.', value: 142, color: '#C69B4B' },
  { name: 'Estruturas Metálicas', value: 64, color: '#8B5CF6' },
]

export const ADMIN_ACTIVITY_FEED: AdminActivityItem[] = [
  {
    id: 'act-1',
    timestamp: 'Há 18 min',
    actorName: 'Eng. Lucas Miranda',
    action: 'concluiu o tópico "Formulação Fraca e Resíduos"',
    target: 'Formação Contínua',
    type: 'conclusao',
    isDemo: true,
  },
  {
    id: 'act-2',
    timestamp: 'Há 1 hora',
    actorName: 'Beatriz Siqueira',
    action: 'emitiu certificado de conclusão com nota 9.8',
    target: 'SOLIDWORKS Simulation',
    type: 'certificado',
    isDemo: true,
  },
  {
    id: 'act-3',
    timestamp: 'Há 3 horas',
    actorName: 'Juliana Pires de Camargo',
    action: 'solicitou matrícula via aprovação de entitlement',
    target: 'Método do Zero ao MEF',
    type: 'matricula',
    isDemo: true,
  },
  {
    id: 'act-4',
    timestamp: 'Ontem às 18:20',
    actorName: 'Sistema de Licenciamento',
    action: 'executou varredura periódica de assinaturas vencidas',
    target: 'Entitlements Globais',
    type: 'sistema',
    isDemo: true,
  },
]
