import React, { useState } from 'react'
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ENTITLEMENTS } from '@/data/demoData'
import { useToast } from '@/hooks/use-toast'

export default function SubscriptionPage() {
  const { toast } = useToast()

  const handleCheckoutClick = () => {
    toast({
      title: 'Módulo de Pagamentos / Checkout',
      description:
        'Status: PENDENTE (Fase 2). A integração com gateway Asaas/Stripe será implementada nas próximas fases.',
    })
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-border space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider">
          <CreditCard className="h-4 w-4" />
          <span>Direitos de Acesso & Licenciamento</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Assinatura & Entitlements
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Transparência total sobre quais trilhas e produtos estão inclusos no seu plano atual.
        </p>
      </div>

      {/* Regra de Negócio Explícita */}
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-500 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-foreground">
            Regra Fundamental do Modelo de Negócios da Academia
          </p>
          <p className="text-muted-foreground leading-relaxed">
            "A assinatura anual <strong>NÃO</strong> deve liberar por padrão todos os cursos
            técnicos especializados. O acesso aos produtos é concedido estritamente conforme o
            direito de acesso (<strong>entitlement</strong>) cadastrado para a sua conta."
          </p>
        </div>
      </div>

      {/* Cartão do Plano Vigente */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#1D957A]/15 text-[#1D957A] border-[#1D957A]/30 text-[10px] uppercase font-mono">
                  Assinatura Ativa
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Plano Anual</span>
              </div>
              <CardTitle className="text-xl font-bold text-foreground">
                Plano Membro Engenharia Divergente
              </CardTitle>
            </div>
            <div className="text-left sm:text-right font-mono">
              <span className="text-xs text-muted-foreground">Vencimento:</span>
              <p className="text-sm font-bold text-foreground">15 de Janeiro de 2026</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Seu plano inclui encontros ao vivo com coordenadores, acesso à biblioteca de fundamentos
            e resolução de dúvidas metodológicas. Especializações profundas de cálculo exigem
            extensão pontual.
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            <Button
              onClick={handleCheckoutClick}
              size="sm"
              className="bg-[#01B59A] hover:bg-[#00A88F] text-black font-semibold text-xs h-8"
            >
              Fazer Upgrade para Pacote Master
            </Button>
            <Button
              onClick={handleCheckoutClick}
              variant="outline"
              size="sm"
              className="border-border text-xs h-8"
            >
              Gerenciar Assinatura (Demonstração)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Entitlements (Direitos de Acesso Individuais) */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>Direitos de Acesso Cadastrados (Entitlements)</span>
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono border-border">
              RBAC / DB
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Cada linha abaixo reflete uma permissão conferida pelo sistema à sua conta
            demonstrativa.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="divide-y divide-border">
            {ENTITLEMENTS.map((ent) => (
              <div
                key={ent.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">{ent.productName}</span>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border">
                      {ent.productCode}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{ent.notes}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Concedido via: <strong>{ent.grantedVia}</strong> • Validade: {ent.validUntil}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {ent.isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1D957A]/15 text-[#1D957A] border border-[#1D957A]/30 text-xs font-semibold font-mono">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border text-xs font-semibold font-mono">
                      <XCircle className="h-3.5 w-3.5" />
                      Não Liberado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
