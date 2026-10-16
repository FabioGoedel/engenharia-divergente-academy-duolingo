/**
 * Backward compatibility re-export
 * Guia de Supabase recomenda src/hooks/use-auth.tsx
 * Mantemos src/contexts/AuthContext.tsx re-exportando para não quebrar imports existentes.
 */
export { AuthProvider, useAuth } from '@/hooks/use-auth'
