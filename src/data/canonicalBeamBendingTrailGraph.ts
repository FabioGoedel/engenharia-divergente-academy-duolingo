import { TrailGraph } from '@/types/trailGraph'
import { BEAM_BENDING_MISSION } from '@/data/beamBendingMissionData'

/**
 * TRILHA DE DEMONSTRAÇÃO OBRIGATÓRIA (Regra 12):
 * "MDZAM — Resistência dos Materiais: Flexão de Vigas"
 *
 * Contém todos os 9 nós pedagógicos conectados:
 * 1. Nó inicial (start)
 * 2. Revisão conceitual teórica (learning_content)
 * 3. Missão interativa prática canônica (mission_set - reutilizando beamBendingMissionData)
 * 4. Avaliação de desempenho / Questão de julgamento (single_question)
 * 5. Portão condicional de progressão com 2 caminhos (progression_gate)
 *    - Caminho A (avanço/domínio): Conteúdo multimaterial avançado (multimaterial_content)
 *    - Caminho B (revisão/dificuldade): Nó de revisão adaptativa (review_checkpoint) com saída segura
 * 6. Marco de conquista técnica com badge (milestone_achievement)
 * 7. Nó de conclusão final (track_end)
 */
export const BEAM_BENDING_CANONICAL_GRAPH: TrailGraph = {
  id: 'graph-resmat-flexao-01',
  trackId: 'track-resmat-flexao',
  trackSlug: 'resistencia-dos-materiais-flexao-de-vigas',
  title: 'MDZAM — Resistência dos Materiais: Flexão de Vigas',
  headline: 'Teoria de Euler-Bernoulli, Tensões Normais, Flechas e Dimensionamento de Seções',
  description:
    'Trilha interativa completa e determinística modelando o fluxo de aprendizagem de flexão pura e simples com ramificações adaptativas.',
  version: 1,
  status: 'published',
  publishedAt: '2025-01-15T10:00:00.000Z',
  publishedBy: 'Prof. Carlos Eduardo (Super Admin)',
  createdAt: '2025-01-10T14:30:00.000Z',
  updatedAt: '2025-01-15T10:00:00.000Z',
  isDemo: true,
  units: [
    {
      id: 'unit-fundamentos',
      title: 'Unidade 1: Fundamentos da Flexão & Hipótese de Navier',
      description: 'Conceitos cinemáticos, distribuição de deformações e momento de inércia.',
      order: 1,
    },
    {
      id: 'unit-aplicacao',
      title: 'Unidade 2: Aplicação Numérica & Julgamento Estrutural',
      description: 'Dimensionamento elástico de perfis I e verificação simultânea de ELU e ELS.',
      order: 2,
    },
  ],
  nodes: [
    // 1. Início da Trilha
    {
      id: 'node-start',
      unitId: 'unit-fundamentos',
      position: { x: 80, y: 220 },
      data: {
        title: 'Boas-Vindas à Flexão de Vigas',
        description:
          'Inicialização da jornada de Mecânica dos Sólidos e introdução aos objetivos de aprendizagem.',
        nodeType: 'start',
        estimatedMinutes: 5,
        xpReward: 15,
        competencies: ['COMP-RESMAT-OVERVIEW'],
        rules: {
          requireAllPrerequisites: false,
          prerequisiteNodeIds: [],
          isRequired: true,
          requireZeroHints: false,
          maxLoopCycles: 3,
        },
        onErrorBehavior: 'retry_allowed',
        supplementaryResources: [],
        rendererStatus: 'available',
      },
    },

    // 2. Revisão Conceitual Teórica
    {
      id: 'node-teoria',
      unitId: 'unit-fundamentos',
      position: { x: 340, y: 220 },
      data: {
        title: 'Teoria de Euler-Bernoulli & Linha Neutra',
        description:
          'Formulações analíticas de tensão normal, momento de inércia e hipótese cinemática de seções planas.',
        nodeType: 'learning_content',
        estimatedMinutes: 15,
        xpReward: 40,
        competencies: ['COMP-RESMAT-NAVIER', 'COMP-RESMAT-INERCIA'],
        blockType: 'rich_text',
        blockId: 'blk-mef-001',
        rules: {
          requireAllPrerequisites: true,
          prerequisiteNodeIds: ['node-start'],
          isRequired: true,
          requireZeroHints: false,
          maxLoopCycles: 3,
        },
        onErrorBehavior: 'retry_allowed',
        supplementaryResources: [
          {
            title: 'Memorial de Dedução da Linha Neutra',
            url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            type: 'pdf',
          },
        ],
        rendererStatus: 'available',
      },
    },

    // 3. Missão Interativa Prática (reutiliza beamBendingMissionData)
    {
      id: 'node-missao-pratica',
      unitId: 'unit-fundamentos',
      position: { x: 620, y: 220 },
      data: {
        title: 'Missão Prática: Flexão Pura e Simples',
        description:
          '5 exercícios progressivos com calculadora técnica e verificação de tensões em perfis estruturais.',
        nodeType: 'mission_set',
        missionId: BEAM_BENDING_MISSION.id,
        estimatedMinutes: 30,
        xpReward: 160,
        competencies: ['COMP-RESMAT-CALC', 'COMP-RESMAT-SECTION-MOD', 'COMP-RESMAT-DEFLECTION'],
        rules: {
          requireAllPrerequisites: true,
          prerequisiteNodeIds: ['node-teoria'],
          minAccuracyPercentage: 70,
          isRequired: true,
          requireZeroHints: false,
          maxLoopCycles: 3,
        },
        onErrorBehavior: 'divert_to_review',
        supplementaryResources: [],
        rendererStatus: 'available',
      },
    },

    // 4. Avaliação de Desempenho e Julgamento Técnico
    {
      id: 'node-avaliacao',
      unitId: 'unit-aplicacao',
      position: { x: 900, y: 220 },
      data: {
        title: 'Desafio Avaliativo: Verificação ELU e ELS',
        description:
          'Questão individual de julgamento técnico comparando perfis W 200, W 250 e W 310.',
        nodeType: 'single_question',
        questionId: 'ex-bb-05',
        estimatedMinutes: 12,
        xpReward: 50,
        competencies: ['COMP-RESMAT-ENG-DECISION'],
        rules: {
          requireAllPrerequisites: true,
          prerequisiteNodeIds: ['node-missao-pratica'],
          minAccuracyPercentage: 80,
          isRequired: true,
          requireZeroHints: false,
          maxLoopCycles: 3,
          adaptiveBranching: {
            onMasteryNodeId: 'node-avanco-multimaterial',
            onRemediationNodeId: 'node-revisao-reforco',
          },
        },
        onErrorBehavior: 'divert_to_review',
        supplementaryResources: [],
        rendererStatus: 'available',
      },
    },

    // 5. Portão Condicional de Progressão
    {
      id: 'node-gate-condicional',
      unitId: 'unit-aplicacao',
      position: { x: 1180, y: 220 },
      data: {
        title: 'Portão Adaptativo: Avaliação de Domínio',
        description:
          'Ramifica o aluno: domínio pleno (≥80%) segue para avanço; domínio parcial/dificuldade segue para reforço.',
        nodeType: 'progression_gate',
        estimatedMinutes: 5,
        xpReward: 20,
        competencies: ['COMP-RESMAT-EVALUATION'],
        rules: {
          requireAllPrerequisites: true,
          prerequisiteNodeIds: ['node-avaliacao'],
          isRequired: true,
          requireZeroHints: false,
          maxLoopCycles: 3,
        },
        onErrorBehavior: 'retry_allowed',
        supplementaryResources: [],
        rendererStatus: 'available',
      },
    },

    // 6. Caminho A: Conteúdo Multimaterial Avançado (Avanço por Domínio)
    {
      id: 'node-avanco-multimaterial',
      unitId: 'unit-aplicacao',
      position: { x: 1460, y: 100 },
      data: {
        title: 'Avanço Técnico: Dimensionamento Plástico & Flambagem Local',
        description:
          'Conteúdo multimaterial composto com vídeo explicativo, checklist de auditoria e formulações avançadas.',
        nodeType: 'multimaterial_content',
        blockType: 'checklist',
        estimatedMinutes: 20,
        xpReward: 70,
        competencies: ['COMP-RESMAT-PLASTIC-MOD', 'COMP-RESMAT-AUDIT'],
        rules: {
          requireAllPrerequisites: true,
          prerequisiteNodeIds: ['node-gate-condicional'],
          isRequired: false,
          requireZeroHints: false,
          maxLoopCycles: 3,
        },
        onErrorBehavior: 'retry_allowed',
        supplementaryResources: [
          {
            title: 'Tabela de Propriedades de Perfis Laminados Açominas',
            url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            type: 'pdf',
          },
        ],
        achievementMessage:
          'Excelente domínio! Você desbloqueou o módulo avançado de dimensionamento.',
        rendererStatus: 'available',
      },
    },

    // 7. Caminho B: Nó de Revisão Adaptativa (Dificuldade / Reforço de Fundamentos)
    {
      id: 'node-revisao-reforco',
      unitId: 'unit-aplicacao',
      position: { x: 1460, y: 340 },
      data: {
        title: 'Revisão Adaptativa: Diagramas e Tensões Críticas',
        description:
          'Reforço guiado com exemplos resolvidos passo a passo para consolidação de conceitos essenciais.',
        nodeType: 'review_checkpoint',
        estimatedMinutes: 15,
        xpReward: 35,
        competencies: ['COMP-RESMAT-REMEDIATION'],
        rules: {
          requireAllPrerequisites: true,
          prerequisiteNodeIds: ['node-gate-condicional'],
          isRequired: false,
          requireZeroHints: false,
          maxLoopCycles: 3, // Limite explícito para evitar loop infinito
        },
        onErrorBehavior: 'show_explanation',
        supplementaryResources: [
          {
            title: 'Guia de Resolução Rápida de Tensões em Vigas',
            url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            type: 'pdf',
          },
        ],
        achievementMessage: 'Revisão concluída com sucesso! Seus fundamentos foram reforçados.',
        rendererStatus: 'available',
      },
    },

    // 8. Marco de Conquista
    {
      id: 'node-conquista',
      unitId: 'unit-aplicacao',
      position: { x: 1740, y: 220 },
      data: {
        title: 'Marco de Conquista: Especialista em Flexão de Vigas',
        description:
          'Reconhecimento de competência técnica com concessão do selo e bônus de reputação em engenharia.',
        nodeType: 'milestone_achievement',
        estimatedMinutes: 5,
        xpReward: 100,
        competencies: ['COMP-RESMAT-MASTERY'],
        rules: {
          requireAllPrerequisites: false, // Pode vir do avanço OU da revisão
          prerequisiteNodeIds: [],
          isRequired: true,
          requireZeroHints: false,
          maxLoopCycles: 3,
        },
        onErrorBehavior: 'retry_allowed',
        supplementaryResources: [],
        achievementMessage:
          'Parabéns Engenheiro(a)! Você dominou os critérios de cálculo de flexão conforme NBR 8800.',
        achievementBadgeUrl: 'https://img.usecurling.com/i?q=trophy&color=01B59A',
        rendererStatus: 'available',
      },
    },

    // 9. Nó Final de Conclusão da Trilha
    {
      id: 'node-conclusao',
      unitId: 'unit-aplicacao',
      position: { x: 2000, y: 220 },
      data: {
        title: 'Conclusão da Trilha & Certificação',
        description:
          'Consolidação das horas complementares e registro no histórico curricular profissional.',
        nodeType: 'track_end',
        estimatedMinutes: 5,
        xpReward: 120,
        competencies: ['COMP-RESMAT-CERTIFIED'],
        rules: {
          requireAllPrerequisites: true,
          prerequisiteNodeIds: ['node-conquista'],
          isRequired: true,
          requireZeroHints: false,
          maxLoopCycles: 3,
        },
        onErrorBehavior: 'retry_allowed',
        supplementaryResources: [],
        achievementMessage: 'Certificado de Conclusão emitido com sucesso!',
        rendererStatus: 'available',
      },
    },
  ],
  edges: [
    // Início -> Teoria
    {
      id: 'edge-start-teoria',
      source: 'node-start',
      target: 'node-teoria',
      conditionType: 'always',
      label: 'Iniciar Jornada',
      isOptionalBranch: false,
    },
    // Teoria -> Missão Prática
    {
      id: 'edge-teoria-missao',
      source: 'node-teoria',
      target: 'node-missao-pratica',
      conditionType: 'always',
      label: 'Prática Laboratorial',
      isOptionalBranch: false,
    },
    // Missão Prática -> Avaliação
    {
      id: 'edge-missao-avaliacao',
      source: 'node-missao-pratica',
      target: 'node-avaliacao',
      conditionType: 'on_success',
      label: 'Aprovação na Missão (≥70%)',
      isOptionalBranch: false,
    },
    // Avaliação -> Portão Condicional
    {
      id: 'edge-avaliacao-gate',
      source: 'node-avaliacao',
      target: 'node-gate-condicional',
      conditionType: 'always',
      label: 'Avaliar Rota',
      isOptionalBranch: false,
    },
    // Portão -> Avanço (Score >= 80%)
    {
      id: 'edge-gate-avanco',
      source: 'node-gate-condicional',
      target: 'node-avanco-multimaterial',
      conditionType: 'on_success',
      label: 'Domínio Pleno (Score ≥ 80%)',
      isOptionalBranch: false,
    },
    // Portão -> Revisão (Score < 80%)
    {
      id: 'edge-gate-revisao',
      source: 'node-gate-condicional',
      target: 'node-revisao-reforco',
      conditionType: 'on_failure',
      label: 'Reforço de Fundamentos (Score < 80%)',
      isOptionalBranch: false,
    },
    // Avanço -> Conquista
    {
      id: 'edge-avanco-conquista',
      source: 'node-avanco-multimaterial',
      target: 'node-conquista',
      conditionType: 'always',
      label: 'Finalizar Avanço',
      isOptionalBranch: false,
    },
    // Revisão -> Conquista (Saída segura do loop de revisão)
    {
      id: 'edge-revisao-conquista',
      source: 'node-revisao-reforco',
      target: 'node-conquista',
      conditionType: 'always',
      label: 'Superar Desafio',
      isOptionalBranch: false,
    },
    // Conquista -> Conclusão
    {
      id: 'edge-conquista-conclusao',
      source: 'node-conquista',
      target: 'node-conclusao',
      conditionType: 'always',
      label: 'Emitir Certificado',
      isOptionalBranch: false,
    },
  ],
}
