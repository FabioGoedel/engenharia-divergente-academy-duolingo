import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { Wordmark } from '@/components/Wordmark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)

  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Campo obrigatório',
        description: 'Informe seu e-mail cadastrado.',
      })
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSentSuccess(true)
      toast({
        title: 'Link de recuperação simulado',
        description:
          'Modo demonstração: o envio foi registrado em memória. Em ambiente real, o Supabase Auth enviaria um token temporário.',
      })
    }, 600)
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background">
      <div className="mb-8 text-center">
        <Wordmark size="lg" to="/" />
      </div>

      <Card className="w-full max-w-md border-border bg-card shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Recuperar senha
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Informe seu e-mail para receber as instruções de redefinição de credenciais.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Banner Demo */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-500 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-snug space-y-1">
              <p className="font-semibold text-[11px] uppercase tracking-wide">
                Simulação de Recuperação
              </p>
              <p className="text-[11px] text-muted-foreground">
                Serviço de disparo SMTP via Supabase marcado como PENDENTE na Fase 1.
              </p>
            </div>
          </div>

          {sentSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/30">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Instruções enviadas!</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Enviamos o passo a passo demonstrativo para <strong>{email}</strong>.
                </p>
              </div>
              <Button
                asChild
                className="w-full bg-[#01B59A] hover:bg-[#00A88F] text-black font-semibold text-xs"
              >
                <Link to="/login">Voltar ao Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                  Seu e-mail cadastrado
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background border-border text-foreground text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#01B59A] hover:bg-[#00A88F] text-black font-bold text-sm h-10 shadow-sm"
              >
                {isSubmitting ? (
                  'Processando solicitação...'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Enviar link de recuperação</span>
                  </span>
                )}
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Voltar para tela de login</span>
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
