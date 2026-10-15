/**
 * Fase 1 — mock Supabase. Trocar por chamadas reais quando o Supabase for conectado.
 * Ponto único de substituição: queries no Supabase para tabelas de progresso e gamificação.
 */

import {
  WEEKLY_STUDY_HOURS,
  HISTORICAL_PROGRESS,
  COMPETENCIES,
  RECENT_SESSIONS,
  ACHIEVEMENTS,
  DEADLINES,
  WeeklyStudyDay,
  HistoricalWeek,
  CompetencyScore,
  StudySession,
  AchievementItem,
  DeadlineItem,
} from '@/data/demoData'

export const ProgressService = {
  async getWeeklyHours(): Promise<WeeklyStudyDay[]> {
    return Promise.resolve([...WEEKLY_STUDY_HOURS])
  },

  async getHistoricalProgress(): Promise<HistoricalWeek[]> {
    return Promise.resolve([...HISTORICAL_PROGRESS])
  },

  async getCompetencies(): Promise<CompetencyScore[]> {
    return Promise.resolve([...COMPETENCIES])
  },

  async getRecentSessions(): Promise<StudySession[]> {
    return Promise.resolve([...RECENT_SESSIONS])
  },

  async getAchievements(): Promise<AchievementItem[]> {
    return Promise.resolve([...ACHIEVEMENTS])
  },

  async getDeadlines(): Promise<DeadlineItem[]> {
    return Promise.resolve([...DEADLINES])
  },
}
