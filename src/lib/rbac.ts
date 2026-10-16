/**
 * Engenharia Divergente Academy — Tipos de Autenticação e RBAC
 *
 * Papéis definidos no prompt mestre:
 * - student
 * - content_editor
 * - admin
 * - super_admin
 */

export type Role = 'student' | 'content_editor' | 'admin' | 'super_admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  headline?: string
  creaNumber?: string
  streakDays: number
  totalXp: number
  isDemo?: boolean
  emailConfirmed?: boolean
}

export type Permission =
  | 'view_catalog'
  | 'access_enrolled_content'
  | 'view_certificates'
  | 'edit_content'
  | 'publish_courses'
  | 'manage_students'
  | 'manage_enrollments'
  | 'manage_entitlements'
  | 'view_financial_reports'
  | 'system_configuration'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  student: ['view_catalog', 'access_enrolled_content', 'view_certificates'],
  content_editor: ['view_catalog', 'access_enrolled_content', 'view_certificates', 'edit_content'],
  admin: [
    'view_catalog',
    'access_enrolled_content',
    'view_certificates',
    'edit_content',
    'publish_courses',
    'manage_students',
    'manage_enrollments',
    'manage_entitlements',
    'view_financial_reports',
  ],
  super_admin: [
    'view_catalog',
    'access_enrolled_content',
    'view_certificates',
    'edit_content',
    'publish_courses',
    'manage_students',
    'manage_enrollments',
    'manage_entitlements',
    'view_financial_reports',
    'system_configuration',
  ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function isAdminRole(role: Role): boolean {
  return role === 'admin' || role === 'super_admin'
}

export function isEditorialRole(role: Role): boolean {
  return role === 'content_editor' || role === 'admin' || role === 'super_admin'
}
