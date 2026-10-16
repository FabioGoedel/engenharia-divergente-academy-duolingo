import React, { useState, useEffect } from 'react'
import {
  User as UserIcon,
  ShieldCheck,
  Award,
  Clock,
  Sparkles,
  Save,
  CheckCircle2,
  Database,
  Lock,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { AuthService } from '@/services/authService'

export default function ProfilePage() {
  const { user, authMode, refreshUser } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState(user?.name || '')
  const [headline, setHeadline] = useState(user?.headline || '')
  const [crea, setCrea] = useState(user?.creaNumber || '')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setHeadline(user.headline || '')
      setCrea(user.creaNumber || '')
    }
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const result = await AuthService.updateProfile({
        name,
        headline,
        creaNumber: crea,
      })

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: result.error,
        })
        return
      }

      await refreshUser()
      toast({
        title:
          authMode === 'real' ? 'Perfil atualizado no Supabase!' : 'Perfil atualizado (Modo Demo)',
        description:
          authMode === 'real'
            ? 'Alterações salvas com sucesso no banco de dados e registradas na auditoria.'
            : 'Os dados foram atualizados no ambiente de demonstração local.',
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o perfil.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Cabeçalho */}
      <div className="pb-4 border-b border-border space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase tracking-wider">
          <UserIcon className="h-4 w-4" />
          <span>Configurações Pessoais & Registro Profissional</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Meu Perfil de Engenheiro
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Gerencie suas informações cadastrais, CREA e credenciais no LMS com persistência real.
        </p>
      </div>

      {/* Cartão de Resumo */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/20 text-primary border-2 border-primary/40 flex items-center justify-center font-bold text-xl shrink-0">
              {user?.name
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'ED'}
            </div>

            <div className="space-y-1 text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] uppercase font-mono">
                    {user?.role}
                  </Badge>
                  {authMode === 'real' ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] font-mono"
                    >
                      Supabase Conectado
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 text-amber-400 bg-amber-500/10 text-[10px] font-mono"
                    >
                      Modo Demo Isolado
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{user?.headline}</p>
              <p className="text-xs text-muted-foreground font-mono">
                E-mail: <strong>{user?.email}</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Edição */}
      <form onSubmit={handleSave}>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground">
              Dados Profissionais & Matrícula
            </CardTitle>
            <CardDescription className="text-xs">
              Mantenha seu CREA atualizado para correta emissão de certificados e validação de
              competências.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prof-name" className="text-xs font-semibold text-foreground">
                  Nome Completo
                </Label>
                <Input
                  id="prof-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background border-border text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prof-email" className="text-xs font-semibold text-foreground">
                  E-mail institucional (Leitura / Autenticado)
                </Label>
                <Input
                  id="prof-email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted border-border text-xs text-muted-foreground font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prof-headline" className="text-xs font-semibold text-foreground">
                  Especialidade / Headline
                </Label>
                <Input
                  id="prof-headline"
                  placeholder="Ex.: Engenheiro Mecânico • Foco em Análise Estrutural"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="bg-background border-border text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prof-crea" className="text-xs font-semibold text-foreground">
                  Registro Profissional (CREA / CFT)
                </Label>
                <Input
                  id="prof-crea"
                  placeholder="Ex.: SP-2021104829"
                  value={crea}
                  onChange={(e) => setCrea(e.target.value)}
                  className="bg-background border-border text-xs"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-background/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-primary" />
                Backend de Persistência:{' '}
                <strong className="text-foreground">
                  {authMode === 'real'
                    ? 'PostgreSQL (Supabase Live via RLS)'
                    : 'LocalStorage (Demo Isolado)'}
                </strong>
              </span>
              <span className="font-mono text-[#01B59A]">RBAC 4.1 Ativo</span>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#01B59A] hover:bg-[#00A88F] text-black font-semibold text-xs h-9 px-4"
              >
                {isSaving ? (
                  'Salvando alterações...'
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    <span>Salvar Alterações</span>
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
