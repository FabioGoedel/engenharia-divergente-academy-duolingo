import React from 'react'
import { TrailNodeType } from '@/types/trailGraph'
import {
  PlayCircle,
  BookOpen,
  HelpCircle,
  Layers,
  Sparkles,
  GitBranch,
  RotateCcw,
  Trophy,
  Flag,
  LucideIcon,
} from 'lucide-react'

export interface NodeTypeDefinition {
  type: TrailNodeType
  title: string
  shortLabel: string
  description: string
  icon: LucideIcon
  colorHex: string
  bgHex: string
  borderHex: string
  defaultMinutes: number
  defaultXp: number
  hasInputs: boolean
  hasOutputs: boolean
  allowedOutputs: ('next' | 'success' | 'failure' | 'remediation')[]
}

export const TRAIL_NODE_REGISTRY: Record<TrailNodeType, NodeTypeDefinition> = {
  start: {
    type: 'start',
    title: '1. Início da Trilha',
    shortLabel: 'Início',
    description: 'Ponto de partida da jornada de aprendizagem. Inicializa o contexto do aluno.',
    icon: PlayCircle,
    colorHex: '#01B59A',
    bgHex: '#01B59A1A',
    borderHex: '#01B59A',
    defaultMinutes: 5,
    defaultXp: 10,
    hasInputs: false,
    hasOutputs: true,
    allowedOutputs: ['next'],
  },
  learning_content: {
    type: 'learning_content',
    title: '2. Conteúdo de Aprendizagem',
    shortLabel: 'Conteúdo',
    description: 'Explicação teórica via vídeo, texto com LaTeX, PDF ou fórmula de referência.',
    icon: BookOpen,
    colorHex: '#38BDF8',
    bgHex: '#38BDF81A',
    borderHex: '#38BDF8',
    defaultMinutes: 15,
    defaultXp: 30,
    hasInputs: true,
    hasOutputs: true,
    allowedOutputs: ['next'],
  },
  single_question: {
    type: 'single_question',
    title: '3. Questão Individual',
    shortLabel: 'Questão',
    description: 'Exercício de fixação conceitual, numérica ou ordenação extraído do banco.',
    icon: HelpCircle,
    colorHex: '#C69B4B',
    bgHex: '#C69B4B1A',
    borderHex: '#C69B4B',
    defaultMinutes: 10,
    defaultXp: 25,
    hasInputs: true,
    hasOutputs: true,
    allowedOutputs: ['next', 'success', 'failure'],
  },
  mission_set: {
    type: 'mission_set',
    title: '4. Missão Prática Interativa',
    shortLabel: 'Missão',
    description: 'Conjunto progressivo de desafios investigativos (ex: Flexão de Vigas).',
    icon: Layers,
    colorHex: '#A855F7',
    bgHex: '#A855F71A',
    borderHex: '#A855F7',
    defaultMinutes: 30,
    defaultXp: 120,
    hasInputs: true,
    hasOutputs: true,
    allowedOutputs: ['next', 'success', 'failure'],
  },
  multimaterial_content: {
    type: 'multimaterial_content',
    title: '5. Conteúdo Multimaterial',
    shortLabel: 'Multimaterial',
    description: 'Composição de mídias: vídeo explicativo + memorial técnico + checklist.',
    icon: Sparkles,
    colorHex: '#EC4899',
    bgHex: '#EC48991A',
    borderHex: '#EC4899',
    defaultMinutes: 20,
    defaultXp: 50,
    hasInputs: true,
    hasOutputs: true,
    allowedOutputs: ['next'],
  },
  progression_gate: {
    type: 'progression_gate',
    title: '6. Condição de Progressão',
    shortLabel: 'Portão',
    description:
      'Decisor pedagógico adaptativo: ramifica por acurácia, competências ou tentativas.',
    icon: GitBranch,
    colorHex: '#F59E0B',
    bgHex: '#F59E0B1A',
    borderHex: '#F59E0B',
    defaultMinutes: 5,
    defaultXp: 15,
    hasInputs: true,
    hasOutputs: true,
    allowedOutputs: ['success', 'failure', 'remediation'],
  },
  review_checkpoint: {
    type: 'review_checkpoint',
    title: '7. Nó de Revisão Adaptativa',
    shortLabel: 'Revisão',
    description: 'Reforço de fundamentos para alunos com domínio parcial ou lacunas conceituais.',
    icon: RotateCcw,
    colorHex: '#F97316',
    bgHex: '#F973161A',
    borderHex: '#F97316',
    defaultMinutes: 15,
    defaultXp: 40,
    hasInputs: true,
    hasOutputs: true,
    allowedOutputs: ['next'],
  },
  milestone_achievement: {
    type: 'milestone_achievement',
    title: '8. Marco de Conquista',
    shortLabel: 'Conquista',
    description: 'Celebração com insígnia técnica, XP bônus ou vídeo de conclusão de etapa.',
    icon: Trophy,
    colorHex: '#10B981',
    bgHex: '#10B9811A',
    borderHex: '#10B981',
    defaultMinutes: 5,
    defaultXp: 100,
    hasInputs: true,
    hasOutputs: true,
    allowedOutputs: ['next'],
  },
  track_end: {
    type: 'track_end',
    title: '9. Final de Unidade / Trilha',
    shortLabel: 'Conclusão',
    description: 'Ponto final da trilha com consolidação de horas e emissão de certificado.',
    icon: Flag,
    colorHex: '#01B59A',
    bgHex: '#01B59A26',
    borderHex: '#01B59A',
    defaultMinutes: 10,
    defaultXp: 150,
    hasInputs: true,
    hasOutputs: false,
    allowedOutputs: [],
  },
}

export function getNodeTypeDefinition(type: TrailNodeType): NodeTypeDefinition {
  return TRAIL_NODE_REGISTRY[type] || TRAIL_NODE_REGISTRY.learning_content
}

export function getAllNodeTypes(): NodeTypeDefinition[] {
  return Object.values(TRAIL_NODE_REGISTRY)
}
