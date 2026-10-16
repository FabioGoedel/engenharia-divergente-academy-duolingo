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

import { supabase } from '@/lib/supabase/client'

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

  /**
   * Obtém progresso real do aluno para nós de uma trilha
   */
  async getStudentTrailProgress(
    userId: string,
    trackId: string,
  ): Promise<
    Record<
      string,
      {
        status: 'completed' | 'in_progress' | 'available' | 'locked'
        score?: number
        attempts?: number
      }
    >
  > {
    try {
      const { data, error } = await supabase
        .from('student_activity_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('track_id', trackId)

      if (error || !data) {
        return {}
      }

      const map: Record<
        string,
        {
          status: 'completed' | 'in_progress' | 'available' | 'locked'
          score?: number
          attempts?: number
        }
      > = {}
      for (const row of data) {
        const key = row.node_id || row.mission_id
        if (key) {
          map[key] = {
            status: row.is_completed ? 'completed' : 'in_progress',
            score: Number(row.best_score_percent) || 0,
            attempts: row.total_attempts_count || 1,
          }
        }
      }
      return map
    } catch {
      return {}
    }
  },
}
