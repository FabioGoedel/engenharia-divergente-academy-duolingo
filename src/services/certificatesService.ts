/**
 * Fase 1 — mock Supabase. Trocar por chamadas reais quando o Supabase for conectado.
 * Ponto único de substituição: tabela `certificates` no Supabase com verificação criptográfica.
 */

import { CERTIFICATES, CertificateItem } from '@/data/demoData'

export const CertificatesService = {
  async getCertificates(): Promise<CertificateItem[]> {
    return Promise.resolve([...CERTIFICATES])
  },

  async getCertificateById(id: string): Promise<CertificateItem | null> {
    const cert = CERTIFICATES.find((c) => c.id === id) || null
    return Promise.resolve(cert ? { ...cert } : null)
  },
}
