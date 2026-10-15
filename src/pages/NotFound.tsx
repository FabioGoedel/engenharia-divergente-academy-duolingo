import React from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/Wordmark'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6">
        <Wordmark size="lg" to="/" />
      </div>

      <div className="p-4 rounded-2xl bg-card border border-border max-w-md w-full space-y-4 shadow-sm">
        <div className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-foreground font-mono">
            404 • Não Encontrado
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A rota ou elemento que você tentou acessar não existe no ambiente da Engenharia
            Divergente Academy.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
          <Button
            asChild
            size="sm"
            className="w-full sm:w-auto bg-[#01B59A] text-black font-semibold text-xs"
          >
            <Link to="/app">
              <Home className="h-3.5 w-3.5 mr-1.5" />
              <span>Painel do Aluno</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full sm:w-auto text-xs border-border"
          >
            <Link to="/">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              <span>Página Inicial</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
