import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { Wordmark } from '@/components/Wordmark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { DEMO_USERS } from '@/data/demoData'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSelectDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    toast({
      title: 'Credenciais preenchidas',
      description: `Conta ${demoEmail.includes('admin') ? 'Administrador' : 'Aluno'} selecionada. Clique em "Entrar".`,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Campo obrigatório',
        description: 'Por favor, informe seu e-mail de acesso.',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const loggedUser = await login({ email, password, rememberMe })
      toast({
        title: 'Acesso autenticado (Modo Demo)',
        description: `Bem-vindo(a), ${loggedUser.name}! Sessão ativa como ${loggedUser.role}.`,
      })

      // Redireciona para o destino ou área apropriada
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname
      if (from && from !== '/login') {
        navigate(from, { replace: true })
      } else if (loggedUser.role === 'admin' || loggedUser.role === 'super_admin') {
        navigate('/admin/painel', { replace: true })
      } else {
        navigate('/app', { replace: true })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao autenticar',
        description: 'Não foi possível iniciar a sessão demo. Tente novamente.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background">
      {/* Wordmark no Topo */}
      <div className="mb-8 text-center">
        <Wordmark size="lg" to="/" />
      </div>

      <Card className="w-full max-w-md border-border bg-card shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Entrar na sua conta
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Acesse o ambiente de aprendizado e simulações com rigor técnico.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Formulário Principal */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                E-mail institucional ou profissional
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="bg-background border-border text-foreground text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  Senha
                </Label>
                <Link
                  to="/recuperar-senha"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="bg-background border-border text-foreground text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
              />
              <label
                htmlFor="remember"
                className="text-xs text-muted-foreground font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Lembrar deste dispositivo
              </label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#01B59A] hover:bg-[#00A88F] text-black font-bold text-sm h-10 shadow-sm"
            >
              {isSubmitting ? (
                'Autenticando...'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>Entrar</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Divisor */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
              <span className="bg-card px-2 text-muted-foreground">
                ou selecione conta de demonstração
              </span>
            </div>
          </div>

          {/* Banner de Aviso do Modo Demo */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-500 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            <div className="leading-snug space-y-1">
              <p className="font-semibold text-[11px] uppercase tracking-wide">
                Modo Demonstração Ativo (Fase 1)
              </p>
              <p className="text-[11px] text-muted-foreground">
                Nenhum dado real é salvo ou compartilhado. Clique em uma das credenciais abaixo para
                preencher o formulário:
              </p>
            </div>
          </div>

          {/* Contas Demo Clicáveis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectDemoAccount('aluno@demo.com', 'demo123')}
              className="p-3 text-left rounded-lg border border-border bg-background hover:border-[#01B59A] hover:bg-muted/60 transition-all text-xs group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-foreground group-hover:text-[#01B59A]">
                  Aluno Demo
                </span>
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30 font-mono">
                  student
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono truncate">aluno@demo.com</p>
              <p className="text-[10px] text-muted-foreground mt-1">senha: demo123</p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectDemoAccount('admin@demo.com', 'demo123')}
              className="p-3 text-left rounded-lg border border-border bg-background hover:border-[#C69B4B] hover:bg-muted/60 transition-all text-xs group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-foreground group-hover:text-[#C69B4B]">
                  Admin Demo
                </span>
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#C69B4B]/20 text-[#C69B4B] border border-[#C69B4B]/30 font-mono">
                  admin
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono truncate">admin@demo.com</p>
              <p className="text-[10px] text-muted-foreground mt-1">senha: demo123</p>
            </button>
          </div>

          {/* Link para Cadastro */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Não tem uma conta demonstrativa?{' '}
              <Link to="/cadastro" className="text-primary hover:underline font-semibold">
                Cadastre-se aqui
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
