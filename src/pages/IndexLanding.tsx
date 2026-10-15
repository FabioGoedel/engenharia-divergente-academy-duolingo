import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ShieldCheck,
  Compass,
  Cpu,
  Layers,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react'
import { Wordmark } from '@/components/Wordmark'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { STUDENT_COURSES } from '@/data/demoData'

export default function IndexLanding() {
  const navigate = useNavigate()
  const { isAuthenticated, user, isAdmin } = useAuth()

  return (
    <div className="min-h-screen bg-[#0C1317] text-[#E6EAED] selection:bg-[#01B59A] selection:text-black">
      {/* Header Institucional */}
      <header className="border-b border-[#294149]/70 bg-[#0C1317]/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Wordmark size="lg" to="/" />

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                asChild
                className="bg-[#01B59A] hover:bg-[#00A88F] text-black font-semibold shadow-sm text-sm"
              >
                <Link to={isAdmin ? '/admin/painel' : '/app'}>
                  Acessar Plataforma ({user?.name.split(' ')[0]})
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-[#A8BBC0] hover:text-white hover:bg-[#152228] text-sm"
                >
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button
                  asChild
                  className="bg-[#01B59A] hover:bg-[#00A88F] text-black font-semibold text-sm"
                >
                  <Link to="/cadastro">Criar Conta</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-[#294149]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#152228] border border-[#294149] text-xs text-[#01B59A] mb-8 font-mono">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Fase 0 + Fase 1 • Ambiente Acadêmico LMS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Formação de Engenharia com Rigor Teórico e Pensamento{' '}
            <span className="text-[#01B59A] underline decoration-[#01B59A]/40 decoration-wavy underline-offset-8">
              Divergente
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[#A8BBC0] max-w-3xl mx-auto leading-relaxed">
            Plataforma multimaterial para engenheiros mecânicos e estruturais. Trilhas estruturadas
            de MEF, simulação computacional CAE e dimensionamento normativo, com gamificação sóbria
            e controle fino de direitos de acesso.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-[#01B59A] hover:bg-[#00A88F] text-black font-bold text-base px-8 h-12 shadow-md"
            >
              <Link to="/login">
                Entrar no Ambiente Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-[#294149] bg-[#152228] text-white hover:bg-[#1B2830] text-base px-8 h-12"
            >
              <Link to="/app/trilhas">
                <Compass className="mr-2 h-5 w-5 text-[#01B59A]" />
                Conhecer Trilhas & Ementas
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-[#A8BBC0] font-mono">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#1D957A]" />
              Sem confetes ou neon
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#01B59A]" />
              RBAC & Entitlements
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#C69B4B]" />
              Acesso Granular
            </span>
          </div>
        </div>
      </section>

      {/* Grade de Trilhas em Destaque */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#01B59A] font-mono">
              Grade Curricular Especializada
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
              Trilhas Oficiais da Academia
            </h2>
            <p className="text-sm text-[#A8BBC0] mt-1 max-w-xl">
              Regra de negócio: a assinatura base anual não libera todos os cursos técnicos. O
              acesso é validado via direitos individuais (entitlements).
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="border-[#294149] bg-[#152228] text-white hover:bg-[#1B2830] text-xs"
          >
            <Link to="/app/trilhas">Ver catálogo completo</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STUDENT_COURSES.map((course) => (
            <Card
              key={course.id}
              className="bg-[#152228] border-[#294149] hover:border-[#01B59A]/60 transition-all flex flex-col justify-between"
            >
              <CardContent className="p-5 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#A8BBC0] mb-3">
                    <span className="px-2 py-0.5 rounded bg-[#0C1317] border border-[#294149]">
                      {course.category}
                    </span>
                    <span className="text-[#01B59A] font-semibold">{course.workloadHours}h</span>
                  </div>

                  <h3 className="font-bold text-base text-white line-clamp-2 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-[#A8BBC0] line-clamp-3 leading-relaxed mb-4">
                    {course.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#294149]">
                  {course.hasEntitlement ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#1D957A] font-medium flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Disponível
                      </span>
                      <Link
                        to={`/app/trilhas/${course.slug}`}
                        className="text-[#01B59A] hover:underline font-semibold text-xs"
                      >
                        Abrir Trilha →
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#C69B4B] font-medium flex items-center gap-1 text-[11px]">
                        <Lock className="h-3.5 w-3.5" />
                        Requer Extensão
                      </span>
                      <Link
                        to={`/app/trilhas/${course.slug}`}
                        className="text-[#A8BBC0] hover:text-white font-semibold text-xs"
                      >
                        Ver Detalhes
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pilares do Pensamento Divergente */}
      <section className="py-16 bg-[#152228]/50 border-t border-[#294149]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-[#0C1317] border border-[#294149]">
              <div className="h-10 w-10 rounded-lg bg-[#01B59A]/10 text-[#01B59A] flex items-center justify-center mb-4">
                <Cpu className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Foco em CAE Investigativo</h4>
              <p className="text-xs text-[#A8BBC0] leading-relaxed">
                Superação do vício de operar softwares como caixa-preta. Verificação analítica e
                critérios de convergência antes de emitir qualquer parecer.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0C1317] border border-[#294149]">
              <div className="h-10 w-10 rounded-lg bg-[#01B59A]/10 text-[#01B59A] flex items-center justify-center mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">RBAC & Segurança Granular</h4>
              <p className="text-xs text-[#A8BBC0] leading-relaxed">
                Arquitetura preparada com guardas de rota, papéis explícitos (student, editor,
                admin, super_admin) e migrations prontas para o Supabase.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0C1317] border border-[#294149]">
              <div className="h-10 w-10 rounded-lg bg-[#01B59A]/10 text-[#01B59A] flex items-center justify-center mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Gamificação Sóbria</h4>
              <p className="text-xs text-[#A8BBC0] leading-relaxed">
                Sequência diária de estudo (streak) e XP baseados em rigor técnico e conclusão de
                exercícios, sem poluição visual ou estética infantilizada.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
