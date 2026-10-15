import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Wordmark } from '@/components/Wordmark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [creaNumber, setCreaNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  // Medidor de Força de Senha
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: 'Em branco', score: 0, color: 'bg-muted' }
    let score = 0
    if (pwd.length >= 6) score += 1
    if (pwd.length >= 8) score += 1
    if (/[A-Z]/.test(pwd)) score += 1
    if (/[0-9]/.test(pwd)) score += 1
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1

    if (score <= 2) return { label: 'Fraca', score: 33, color: 'bg-[#C86F63]' }
    if (score <= 3) return { label: 'Média', score: 66, color: 'bg-[#C69B4B]' }
    return { label: 'Forte', score: 100, color: 'bg-[#1D957A]' }
  }

  const strength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email || !password) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha nome, e-mail e senha.',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Senhas divergentes',
        description: 'A confirmação de senha não confere com a senha informada.',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await register({
        name,
        email,
        password,
        creaNumber: creaNumber || undefined,
      })

      toast({
        title: 'Conta demo criada com sucesso',
        description: `Bem-vindo(a), ${name}! Sua sessão de aluno foi iniciada no modo demonstração.`,
      })
      navigate('/app', { replace: true })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro no cadastro demo',
        description: 'Ocorreu uma falha ao criar o perfil demonstrativo.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background">
      <div className="mb-8 text-center">
        <Wordmark size="lg" to="/" />
      </div>

      <Card className="w-full max-w-md border-border bg-card shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Criar sua conta de aluno
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Matricule-se para acessar as trilhas e exercícios da Engenharia Divergente.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Aviso Demo */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-500 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-snug space-y-1">
              <p className="font-semibold text-[11px] uppercase tracking-wide">
                Ambiente de Demonstração (Fase 1)
              </p>
              <p className="text-[11px] text-muted-foreground">
                Novas contas são salvas em memória local e recebem papel de <code>student</code>.
                Nenhum dado é enviado a servidores de produção.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-foreground">
                Nome completo
              </Label>
              <Input
                id="name"
                placeholder="Ex.: Lucas Miranda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-background border-border text-foreground text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                E-mail
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="crea" className="text-xs font-semibold text-foreground">
                  Registro Profissional / CREA
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">opcional</span>
              </div>
              <Input
                id="crea"
                placeholder="Ex.: SP-2021104829"
                value={creaNumber}
                onChange={(e) => setCreaNumber(e.target.value)}
                className="bg-background border-border text-foreground text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                Senha de acesso
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
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Indicador de Força */}
              {password && (
                <div className="pt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">Força da senha:</span>
                    <span className="font-semibold text-foreground">{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
                Confirmar senha
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-background border-border text-foreground text-sm"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#01B59A] hover:bg-[#00A88F] text-black font-bold text-sm h-10 mt-2 shadow-sm"
            >
              {isSubmitting ? (
                'Criando conta demo...'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>Criar conta de aluno</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Já tem uma conta cadastrada?{' '}
              <Link to="/login" className="text-primary hover:underline font-semibold">
                Entrar
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
