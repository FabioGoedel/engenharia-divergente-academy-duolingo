/**
 * Fase 1 — mock Supabase. Trocar por chamadas reais quando o Supabase for conectado.
 * Ponto único de substituição: queries no Supabase para tabela `products` e `entitlements`.
 */

import {
  STUDENT_COURSES,
  TRACK_DETAILS,
  StudentCourse,
  TrackDetail,
  ENTITLEMENTS,
  EntitlementItem,
} from '@/data/demoData'

export const CoursesService = {
  async getStudentCourses(): Promise<StudentCourse[]> {
    return Promise.resolve([...STUDENT_COURSES])
  },

  async getTrackBySlug(slug: string): Promise<TrackDetail | null> {
    const track = TRACK_DETAILS[slug] || null
    return Promise.resolve(track ? { ...track } : null)
  },

  async getAllTracks(): Promise<TrackDetail[]> {
    return Promise.resolve(Object.values(TRACK_DETAILS))
  },

  async getEntitlements(): Promise<EntitlementItem[]> {
    return Promise.resolve([...ENTITLEMENTS])
  },

  async checkEntitlement(productCode: string): Promise<boolean> {
    const found = ENTITLEMENTS.find((e) => e.productCode === productCode)
    return Promise.resolve(found?.isActive ?? false)
  },
}
