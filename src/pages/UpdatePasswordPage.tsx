import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, CheckCircle2, Database } from 'lucide-react'
import { Wordmark } from '@/components/Wordmark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { AuthService } from '@/services/authService'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [updatedSuccess, setUpdatedSuccess] = useState(false)

  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Senha inválida',
        description: 'A nova senha deve ter no mínimo 6 caracteres.',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Senhas divergentes',
        description: 'A confirmação não corresponde à nova senha informada.',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await AuthService.updateUserPassword(password)
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao atualizar',
          description: result.error,
        })
        return
      }

      setUpdatedSuccess(true)
      toast({
        title: 'Senha alterada com sucesso!',
        description: 'Você já pode acessar com suas novas credenciais.',
      })
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Falha na atualização',
        description: err instanceof Error ? err.message : 'Erro ao processar a nova senha.',
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
              Redefinir Senha
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
            Crie uma nova senha segura para a sua conta.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {updatedSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/30">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Senha atualizada!</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Sua credencial foi alterada com sucesso no Supabase Auth.
                </p>
              </div>
              <Button
                asChild
                className="w-full bg-[#01B59A] hover:bg-[#00A88F] text-black font-semibold text-xs"
              >
                <Link to="/login">Acessar com a nova senha</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  Nova senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo de 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background border-border text-foreground text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Ocultar' : 'Exibir'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
                  Confirmar nova senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  'Salvando no Supabase...'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Salvar nova senha</span>
                  </span>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
