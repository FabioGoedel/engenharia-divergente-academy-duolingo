/**
 * Engenharia Divergente Academy — GamificationService
 * Fase 5: Conectado ao Supabase real.
 * Gerencia níveis técnicos, catálogo de conquistas, conquistas desbloqueadas,
 * metas diárias de tempo ativo, log de estudo diário e cálculo determinístico de nível.
 */

import { supabase } from '@/lib/supabase/client'

export interface GamificationLevel {
  id: string
  levelNumber: number
  title: string
  minXp: number
  badgeCode: string | null
  perks: string | null
}

export interface AchievementItem {
  id: string
  code: string
  title: string
  description: string
  category: 'engagement' | 'technical_mastery' | 'autonomy' | 'streak'
  xpReward: number
  rarity: 'Comum' | 'Especial' | 'Épica' | 'Lendária'
  iconName: string
  conditionType: string
  conditionThreshold: number
  isActive: boolean
  // Dados do aluno se desbloqueado
  earned?: boolean
  unlockedAt?: string
}

export interface StudentDailyGoal {
  targetMinutes: number
  activeTodaySeconds: number
  goalReached: boolean
  todayXp: number
  streakDays: number
}

export interface ActiveTimeSessionUpdate {
  userId: string
  additionalSeconds: number
  xpEarnedDelta?: number
  missionCompletedDelta?: number
  exerciseAnsweredDelta?: number
}

export const GamificationService = {
  /**
   * Lista todos os níveis configurados pelos administradores
   */
  async listLevels(): Promise<GamificationLevel[]> {
    const { data, error } = await (supabase as any)
      .from('gamification_levels')
      .select('*')
      .order('level_number', { ascending: true })

    if (error) {
      console.warn('Erro ao carregar níveis de gamificação:', error)
      return []
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      levelNumber: row.level_number,
      title: row.title,
      minXp: row.min_xp,
      badgeCode: row.badge_code,
      perks: row.perks,
    }))
  },

  /**
   * Identifica o nível atual de um aluno a partir de seu XP total
   */
  calculateLevelFromXp(
    totalXp: number,
    levels: GamificationLevel[],
  ): {
    currentLevel: GamificationLevel
    nextLevel?: GamificationLevel
    progressPercent: number
    xpToNext: number
  } {
    if (!levels.length) {
      const fallback: GamificationLevel = {
        id: 'lvl-1',
        levelNumber: 1,
        title: 'Iniciante Divergente',
        minXp: 0,
        badgeCode: null,
        perks: null,
      }
      return { currentLevel: fallback, progressPercent: 0, xpToNext: 250 }
    }

    const sorted = [...levels].sort((a, b) => a.levelNumber - b.levelNumber)
    let current = sorted[0]
    let next: GamificationLevel | undefined

    for (let i = 0; i < sorted.length; i++) {
      if (totalXp >= sorted[i].minXp) {
        current = sorted[i]
        next = sorted[i + 1]
      } else {
        break
      }
    }

    if (!next) {
      return {
        currentLevel: current,
        nextLevel: undefined,
        progressPercent: 100,
        xpToNext: 0,
      }
    }

    const range = next.minXp - current.minXp
    const currentInLevel = Math.max(0, totalXp - current.minXp)
    const progressPercent =
      range > 0 ? Math.min(100, Math.round((currentInLevel / range) * 100)) : 100
    const xpToNext = Math.max(0, next.minXp - totalXp)

    return {
      currentLevel: current,
      nextLevel: next,
      progressPercent,
      xpToNext,
    }
  },

  /**
   * Lista catálogo de conquistas cruzando com as conquistas reais desbloqueadas pelo aluno
   */
  async listAchievementsForStudent(userId: string): Promise<AchievementItem[]> {
    const [achievementsRes, unlockedRes] = await Promise.all([
      (supabase as any)
        .from('gamification_achievements')
        .select('*')
        .eq('is_active', true)
        .order('xp_reward', { ascending: true }),
      (supabase as any)
        .from('student_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', userId),
    ])

    const unlockedMap = new Map<string, string>()
    if (unlockedRes.data) {
      for (const u of unlockedRes.data as any[]) {
        unlockedMap.set(u.achievement_id, u.unlocked_at)
      }
    }

    return ((achievementsRes.data as any[]) || []).map((row) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      category: row.category,
      xpReward: row.xp_reward,
      rarity: row.rarity,
      iconName: row.icon_name,
      conditionType: row.condition_type,
      conditionThreshold: row.condition_threshold,
      isActive: row.is_active,
      earned: unlockedMap.has(row.id),
      unlockedAt: unlockedMap.get(row.id),
    }))
  },

  /**
   * Obtém a meta diária e o progresso de estudo ativo de hoje do aluno
   */
  async getStudentDailyGoal(userId: string): Promise<StudentDailyGoal> {
    const today = new Date().toISOString().split('T')[0]

    const [goalRes, logRes, profileRes] = await Promise.all([
      (supabase as any)
        .from('student_daily_goals')
        .select('target_minutes')
        .eq('user_id', userId)
        .maybeSingle(),
      (supabase as any)
        .from('student_daily_study_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('study_date', today)
        .maybeSingle(),
      (supabase as any).from('profiles').select('streak_days').eq('id', userId).maybeSingle(),
    ])

    const targetMinutes = goalRes.data?.target_minutes || 15
    const activeTodaySeconds = logRes.data?.active_seconds || 0
    const todayXp = logRes.data?.xp_earned_today || 0
    const streakDays = profileRes.data?.streak_days || 0
    const goalReached = activeTodaySeconds >= targetMinutes * 60

    return {
      targetMinutes,
      activeTodaySeconds,
      goalReached,
      todayXp,
      streakDays,
    }
  },

  /**
   * Atualiza a meta diária do aluno (5, 10, 15 ou personalizado) sem penalidade
   */
  async updateDailyGoal(userId: string, targetMinutes: number): Promise<void> {
    const { error } = await (supabase as any).from('student_daily_goals').upsert(
      {
        user_id: userId,
        target_minutes: Math.max(5, targetMinutes),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

    if (error) {
      console.warn('Erro ao atualizar meta diária:', error)
      throw error
    }
  },

  /**
   * Registra tempo ativo de estudo diário (incremento atômico seguro)
   */
  async recordActiveStudyTime(params: ActiveTimeSessionUpdate): Promise<{
    activeSeconds: number
    goalReached: boolean
    justAchievedGoal: boolean
  }> {
    const today = new Date().toISOString().split('T')[0]

    // 1. Busca meta
    const { data: goalRow } = await (supabase as any)
      .from('student_daily_goals')
      .select('target_minutes')
      .eq('user_id', params.userId)
      .maybeSingle()
    const targetSeconds = (goalRow?.target_minutes || 15) * 60

    // 2. Busca log atual de hoje
    const { data: currentLog } = await (supabase as any)
      .from('student_daily_study_logs')
      .select('*')
      .eq('user_id', params.userId)
      .eq('study_date', today)
      .maybeSingle()

    const prevSeconds = currentLog?.active_seconds || 0
    const newSeconds = prevSeconds + params.additionalSeconds
    const wasGoalReached = currentLog?.goal_reached || false
    const isNowGoalReached = newSeconds >= targetSeconds
    const justAchievedGoal = !wasGoalReached && isNowGoalReached

    const payload = {
      user_id: params.userId,
      study_date: today,
      active_seconds: newSeconds,
      goal_reached: isNowGoalReached,
      xp_earned_today: (currentLog?.xp_earned_today || 0) + (params.xpEarnedDelta || 0),
      missions_completed_count:
        (currentLog?.missions_completed_count || 0) + (params.missionCompletedDelta || 0),
      exercises_answered_count:
        (currentLog?.exercises_answered_count || 0) + (params.exerciseAnsweredDelta || 0),
      updated_at: new Date().toISOString(),
    }

    await (supabase as any)
      .from('student_daily_study_logs')
      .upsert(payload, { onConflict: 'user_id,study_date' })

    // Se completou a meta agora, dispara evento na telemetria
    if (justAchievedGoal) {
      await (supabase as any).from('student_telemetry_events').insert({
        user_id: params.userId,
        event_type: 'goal_reached',
        payload: { targetMinutes: targetSeconds / 60, totalSeconds: newSeconds },
      })
    }

    return {
      activeSeconds: newSeconds,
      goalReached: isNowGoalReached,
      justAchievedGoal,
    }
  },

  /**
   * Avalia e desbloqueia conquistas elegíveis automaticamente para o aluno
   */
  async checkAndAwardEligibleAchievements(userId: string): Promise<AchievementItem[]> {
    const allAchievements = await this.listAchievementsForStudent(userId)
    const notEarned = allAchievements.filter((a) => !a.earned)
    if (!notEarned.length) return []

    // Coleta dados reais consolidados do aluno
    const [profileRes, progressRes, compRes, reviewsRes] = await Promise.all([
      (supabase as any).from('profiles').select('total_xp, streak_days').eq('id', userId).single(),
      (supabase as any).from('student_activity_progress').select('*').eq('user_id', userId),
      (supabase as any).from('student_competency_progress').select('*').eq('user_id', userId),
      (supabase as any)
        .from('review_schedule')
        .select('*')
        .eq('user_id', userId)
        .eq('is_pending', false),
    ])

    const totalXp = profileRes.data?.total_xp || 0
    const streakDays = profileRes.data?.streak_days || 0
    const completedMissions = ((progressRes.data as any[]) || []).filter(
      (p) => p.is_completed,
    ).length
    const reviewsCompleted = (reviewsRes.data as any[])?.length || 0

    let maxCompetencyMastery = 0
    let autonomousTotal = 0
    for (const c of (compRes.data as any[]) || []) {
      const score = Number(c.mastery_score_percent) || 0
      if (score > maxCompetencyMastery) maxCompetencyMastery = score
      autonomousTotal += c.autonomous_correct_count || 0
    }

    const newlyAwarded: AchievementItem[] = []

    for (const ach of notEarned) {
      let isEligible = false

      switch (ach.conditionType) {
        case 'first_mission':
          if (completedMissions >= ach.conditionThreshold) isEligible = true
          break
        case 'streak_days':
          if (streakDays >= ach.conditionThreshold) isEligible = true
          break
        case 'xp_threshold':
          if (totalXp >= ach.conditionThreshold) isEligible = true
          break
        case 'autonomous_streak':
          if (autonomousTotal >= ach.conditionThreshold) isEligible = true
          break
        case 'reviews_completed':
          if (reviewsCompleted >= ach.conditionThreshold) isEligible = true
          break
        case 'competency_mastered':
          if (maxCompetencyMastery >= ach.conditionThreshold) isEligible = true
          break
      }

      if (isEligible) {
        // Concede a conquista no banco
        const { error: insErr } = await (supabase as any).from('student_achievements').insert({
          user_id: userId,
          achievement_id: ach.id,
          xp_awarded: ach.xpReward,
        })

        if (!insErr) {
          // Grava XP no ledger transacional
          await (supabase as any).from('xp_ledger').insert({
            user_id: userId,
            reason: `Conquista desbloqueada: ${ach.title}`,
            xp_amount: ach.xpReward,
            policy_code: 'achievement_unlock',
            metadata: { achievement_id: ach.id, code: ach.code },
          })

          // Atualiza total_xp no perfil
          await (supabase as any)
            .from('profiles')
            .update({ total_xp: totalXp + ach.xpReward, updated_at: new Date().toISOString() })
            .eq('id', userId)

          // Telemetria mínima
          await (supabase as any).from('student_telemetry_events').insert({
            user_id: userId,
            event_type: 'achievement_unlocked',
            entity_id: ach.id,
            payload: { code: ach.code, xpReward: ach.xpReward },
          })

          newlyAwarded.push({ ...ach, earned: true })
        }
      }
    }

    return newlyAwarded
  },

  // FUNÇÕES ADMINISTRATIVAS (RBAC protegido por RLS)
  async adminSaveLevel(level: GamificationLevel): Promise<void> {
    const { error } = await (supabase as any).from('gamification_levels').upsert({
      id: level.id,
      level_number: level.levelNumber,
      title: level.title,
      min_xp: level.minXp,
      badge_code: level.badgeCode,
      perks: level.perks,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
  },

  async adminSaveAchievement(achievement: AchievementItem): Promise<void> {
    const { error } = await (supabase as any).from('gamification_achievements').upsert({
      id: achievement.id,
      code: achievement.code,
      title: achievement.title,
      description: achievement.description,
      category: achievement.category,
      xp_reward: achievement.xpReward,
      rarity: achievement.rarity,
      icon_name: achievement.iconName,
      condition_type: achievement.conditionType,
      condition_threshold: achievement.conditionThreshold,
      is_active: achievement.isActive,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
  },
}
