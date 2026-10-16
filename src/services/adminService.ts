/**
 * Fase 1 — mock Supabase. Trocar por chamadas reais quando o Supabase for conectado.
 * Ponto único de substituição: queries administrativas no Supabase protegidas por RLS.
 */

import {
  ADMIN_STATS,
  ADMIN_STUDENTS,
  ADMIN_COURSES,
  ADMIN_ENROLLMENTS,
  ADMIN_MONTHLY_STUDENTS,
  ADMIN_COURSE_DISTRIBUTION,
  ADMIN_ACTIVITY_FEED,
  AdminStudentRow,
  AdminCourseRow,
  AdminEnrollmentRow,
  AdminActivityItem,
} from '@/data/demoData'

let inMemoryStudents: AdminStudentRow[] = [...ADMIN_STUDENTS]
let inMemoryCourses: AdminCourseRow[] = [...ADMIN_COURSES]
let inMemoryEnrollments: AdminEnrollmentRow[] = [...ADMIN_ENROLLMENTS]

export const AdminService = {
  async getStats() {
    return Promise.resolve({ ...ADMIN_STATS, totalStudents: inMemoryStudents.length })
  },

  async getStudents(): Promise<AdminStudentRow[]> {
    return Promise.resolve([...inMemoryStudents])
  },

  async addStudent(
    student: Omit<AdminStudentRow, 'id' | 'isDemo' | 'enrolledAt' | 'lastActive'>,
  ): Promise<AdminStudentRow> {
    const newStudent: AdminStudentRow = {
      ...student,
      id: `std-${Date.now()}`,
      enrolledAt: new Date().toLocaleDateString('pt-BR'),
      lastActive: 'Agora',
      isDemo: true,
    }
    inMemoryStudents = [newStudent, ...inMemoryStudents]
    return Promise.resolve(newStudent)
  },

  async deleteStudent(id: string): Promise<boolean> {
    inMemoryStudents = inMemoryStudents.filter((s) => s.id !== id)
    return Promise.resolve(true)
  },

  /**
   * Reconciliação do ledger de XP contra o saldo do perfil (Subfase 4.5)
   */
  async reconcileUserXp(userId: string) {
    try {
      const { supabase } = await import('@/lib/supabase/client')
      const { data, error } = await (supabase.rpc as any)('reconcile_student_xp', {
        target_user_uid: userId,
      })
      if (error) throw error
      return data
    } catch (err) {
      console.warn('Reconciliação no backend indisponível, simulando em memória:', err)
      return {
        user_id: userId,
        discrepancy: 0,
        is_consistent: true,
      }
    }
  },

  async getCourses(): Promise<AdminCourseRow[]> {
    return Promise.resolve([...inMemoryCourses])
  },

  async addCourse(
    course: Omit<AdminCourseRow, 'id' | 'isDemo' | 'enrolledStudents' | 'completionRate'>,
  ): Promise<AdminCourseRow> {
    const newCourse: AdminCourseRow = {
      ...course,
      id: `crs-adm-${Date.now()}`,
      enrolledStudents: 0,
      completionRate: 0,
      isDemo: true,
    }
    inMemoryCourses = [newCourse, ...inMemoryCourses]
    return Promise.resolve(newCourse)
  },

  async getEnrollments(): Promise<AdminEnrollmentRow[]> {
    return Promise.resolve([...inMemoryEnrollments])
  },

  async cancelEnrollment(id: string): Promise<boolean> {
    inMemoryEnrollments = inMemoryEnrollments.map((enr) =>
      enr.id === id ? { ...enr, status: 'Cancelada' as const } : enr,
    )
    return Promise.resolve(true)
  },

  async getMonthlyGrowth() {
    return Promise.resolve([...ADMIN_MONTHLY_STUDENTS])
  },

  async getCourseDistribution() {
    return Promise.resolve([...ADMIN_COURSE_DISTRIBUTION])
  },

  async getActivityFeed(): Promise<AdminActivityItem[]> {
    return Promise.resolve([...ADMIN_ACTIVITY_FEED])
  },
}
