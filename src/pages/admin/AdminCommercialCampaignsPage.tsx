import React, { useState, useEffect } from 'react'
import {
  Megaphone,
  Plus,
  Eye,
  MousePointerClick,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  CommercialRelationshipService,
  CommercialCampaign,
} from '@/services/commercialRelationshipService'

export default function AdminCommercialCampaignsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<CommercialCampaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<CommercialCampaign | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    async function loadCampaigns() {
      setLoading(true)
      try {
        const data = await CommercialRelationshipService.adminListCampaigns()
        setCampaigns(data)
      } catch (err) {
        console.warn('Erro ao carregar campanhas:', err)
      } finally {
        setLoading(false)
      }
    }
    loadCampaigns()
  }, [])

  const handleToggleStatus = async (camp: CommercialCampaign) => {
    const newStatus = camp.status === 'active' ? 'paused' : 'active'
    try {
      await CommercialRelationshipService.adminSaveCampaign({
        ...camp,
        status: newStatus,
      })
      toast({
        title: 'Status da Campanha Atualizado',
        description: `Campanha "${camp.title}" agora está ${newStatus.toUpperCase()}.`,
      })
      const data = await CommercialRelationshipService.adminListCampaigns()
      setCampaigns(data)
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar campanha',
        description: err?.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-[#294149] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#01B59A] uppercase tracking-wider">
            <Megaphone className="h-4 w-4" />
            <span>Fase 5 • Pacote B • Relacionamento Comercial & Campanhas Discretas</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Gestão de Campanhas e Ofertas Especializadas
          </h1>
          <p className="text-xs md:text-sm text-[#A8BBC0]">
            Configuração de ofertas contextuais com exclusão estrita de cursos que o aluno já
            possui. Sem concessão de matrícula automática por clique.
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedCampaign({
              id: `camp-${Date.now()}`,
              title: 'Nova Oferta Especializada',
              slug: 'nova-oferta',
              targetProductCode: 'PROD-NOVO',
              headline: 'Título chamativo da oferta técnica',
              bodyText: 'Descrição detalhada do conteúdo do curso de pós-graduação ou programa.',
              bannerPlacement: 'dashboard_contextual',
              ctaLabel: 'Conhecer Curso',
              ctaUrl: '/app/assinatura',
              status: 'draft',
              priority: 2,
              startDate: new Date().toISOString(),
              maxImpressionsPerStudent: 3,
              excludeIfAlreadyEntitled: true,
            })
            setIsEditing(true)
          }}
          className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-bold font-mono text-xs h-9"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nova Campanha Comercial
        </Button>
      </div>

      {/* Regras Comerciais em Destaque */}
      <div className="p-4 rounded-xl bg-[#0C1317] border border-[#01B59A]/30 text-xs text-[#E6EAED] space-y-1">
        <span className="font-bold text-[#01B59A] flex items-center gap-1.5 font-mono">
          <ShieldAlert className="h-4 w-4" />
          Diretrizes Mandatórias de Integridade Comercial:
        </span>
        <p>
          • <strong>Sem Checkout Nesta Fase:</strong> Cliques direcionam para contratos existentes
          sem acionar gateway fake.
        </p>
        <p>
          • <strong>Exclusão Automática:</strong> Alunos que já possuem a titularidade (entitlement)
          não visualizam a campanha.
        </p>
        <p>
          • <strong>Assinatura-Base Protegida:</strong> A assinatura padrão não dá acesso a cursos
          técnicos especializados (regra preservada).
        </p>
      </div>

      {/* Lista de Campanhas */}
      <div className="space-y-4">
        {campaigns.map((camp) => (
          <Card key={camp.id} className="bg-[#152228] border-[#294149]">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-white text-base">{camp.title}</CardTitle>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono ${
                        camp.status === 'active'
                          ? 'border-[#01B59A]/40 text-[#01B59A]'
                          : 'border-[#294149] text-[#A8BBC0]'
                      }`}
                    >
                      {camp.status.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-[#A8BBC0] mt-0.5">
                    Produto Alvo:{' '}
                    <span className="font-mono text-white">{camp.targetProductCode}</span> •
                    Posição: {camp.bannerPlacement}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-4 text-xs font-mono text-[#A8BBC0] mr-2">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5 text-[#01B59A]" />
                      {camp.viewsCount || 0} views
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointerClick className="h-3.5 w-3.5 text-[#C69B4B]" />
                      {camp.clicksCount || 0} cliques
                    </span>
                  </div>

                  <Switch
                    checked={camp.status === 'active'}
                    onCheckedChange={() => handleToggleStatus(camp)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-xs">
              <div className="p-3 rounded-lg bg-[#0C1317] border border-[#294149] space-y-1">
                <p className="font-bold text-white text-xs">{camp.headline}</p>
                <p className="text-[#A8BBC0] text-[11px] leading-relaxed">{camp.bodyText}</p>
                <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-[#01B59A]">
                  <span>
                    CTA: "{camp.ctaLabel}" → {camp.ctaUrl}
                  </span>
                  <span>Limite: {camp.maxImpressionsPerStudent} exibições/aluno</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
