import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, CheckCircle2, Database } from 'lucide-react'
import { Wordmark } from '@/components/Wordmark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { AuthService } from '@/services/authService'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)

  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
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
    try {
      const result = await AuthService.sendPasswordResetEmail(email)
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Erro na solicitação',
          description: result.error,
        })
        return
      }

      setSentSuccess(true)
      toast({
        title: 'Instruções enviadas',
        description: `Se houver uma conta associada a ${email}, o link de recuperação foi enviado pelo Supabase.`,
      })
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Falha inesperada',
        description:
          err instanceof Error ? err.message : 'Não foi possível processar a redefinição.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background">
      <div className="mb-6 text-center">
        <Wordmark size="lg" to="/" />
      </div>

      <Card className="w-full max-w-md border-border bg-card shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              Recuperar senha
            </CardTitle>
            <Badge
              variant="outline"
              className="border-primary/40 text-primary text-[10px] font-mono flex items-center gap-1"
            >
              <Database className="h-3 w-3" />
              <span>Supabase</span>
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Informe seu e-mail para receber as instruções seguras de redefinição de senha.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {sentSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/30">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Instruções enviadas!</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Enviamos o link de recuperação para <strong>{email}</strong>. Verifique sua caixa
                  de entrada e spam.
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
                  'Enviando via Supabase...'
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
