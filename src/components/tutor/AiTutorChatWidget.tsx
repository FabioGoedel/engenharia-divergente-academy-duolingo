import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Bot,
  Send,
  AlertCircle,
  ShieldCheck,
  HelpCircle,
  Lightbulb,
  BookOpen,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AiTutorClientService,
  AiTutorStatus,
  AiTutorResponse,
  TutorPedagogicalMode,
} from '@/services/aiTutorClientService'

interface AiTutorChatWidgetProps {
  exerciseId?: string
  competencyCode?: string
  assistanceStage?: string
  currentMode?: TutorPedagogicalMode
  onClose?: () => void
}

export function AiTutorChatWidget({
  exerciseId,
  competencyCode,
  assistanceStage = 'stage_3_retrieval_with_hints',
  currentMode = 'study_mode',
  onClose,
}: AiTutorChatWidgetProps) {
  const [tutorStatus, setTutorStatus] = useState<AiTutorStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [messages, setMessages] = useState<
    Array<{ sender: 'user' | 'tutor'; text: string; disclaimer?: string }>
  >([])
  const [inputQuestion, setInputQuestion] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    async function checkStatus() {
      setLoadingStatus(true)
      try {
        const status = await AiTutorClientService.checkTutorAvailability()
        setTutorStatus(status)
      } catch (err) {
        setTutorStatus({
          available: false,
          reason: 'Não foi possível conectar ao serviço do Tutor de IA.',
        })
      } finally {
        setLoadingStatus(false)
      }
    }
    checkStatus()
  }, [])

  const handleSendMessage = async () => {
    if (!inputQuestion.trim() || isSending) return
    const q = inputQuestion.trim()
    setInputQuestion('')
    setMessages((prev) => [...prev, { sender: 'user', text: q }])
    setIsSending(true)

    try {
      const res: AiTutorResponse = await AiTutorClientService.askTutor({
        exerciseId,
        competencyCode,
        studentQuestion: q,
        mode: currentMode,
        assistanceStage,
      })

      if (res.available && res.response) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'tutor',
            text: res.response!,
            disclaimer: res.disclaimer,
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'tutor',
            text: res.reason || 'O Tutor de IA está temporariamente indisponível.',
          },
        ])
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: `Erro ao obter resposta do tutor: ${err?.message || 'Falha na requisição.'}`,
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="bg-[#152228] border border-[#01B59A]/40 shadow-xl overflow-hidden flex flex-col h-[520px]">
      {/* Topo do Widget */}
      <CardHeader className="p-3.5 bg-[#0C1317] border-b border-[#294149] flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[#01B59A]/20 border border-[#01B59A]/40 flex items-center justify-center text-[#01B59A]">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-xs font-bold text-white">Tutor de IA Pedagógico</CardTitle>
              <Badge
                variant="outline"
                className="border-[#01B59A]/40 text-[#01B59A] text-[9px] font-mono py-0 h-4"
              >
                {currentMode}
              </Badge>
            </div>
            <CardDescription className="text-[10px] text-[#A8BBC0]">
              Apoio investigativo conceitual • Sem revelação de gabarito
            </CardDescription>
          </div>
        </div>

        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-[#A8BBC0] hover:text-white"
          >
            ✕
          </Button>
        )}
      </CardHeader>

      {/* Conteúdo Central */}
      <CardContent className="p-3 flex-1 flex flex-col justify-between overflow-hidden text-xs">
        {/* Caso o tutor esteja desativado ou sem chaves no backend (Regra: exibir estado real de indisponibilidade!) */}
        {tutorStatus && !tutorStatus.available ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm">Tutor de IA Indisponível no Momento</h4>
              <p className="text-[#A8BBC0] text-xs leading-relaxed max-w-sm">
                {tutorStatus.reason ||
                  'O provedor de inteligência artificial externo não possui credencial configurada ou está desativado pelo corpo editorial.'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#0C1317] border border-[#294149] text-[11px] text-[#A8BBC0] max-w-sm text-left">
              <p className="font-mono text-[#01B59A] font-bold">Rigor da Engenharia Divergente:</p>
              <p className="mt-0.5">
                Não apresentamos respostas simuladas ou dados fictícios como se fossem gerados por
                inteligência artificial real.
              </p>
            </div>
          </div>
        ) : (
          // Fluxo de Chat Ativo
          <>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-2">
              <div className="p-3 rounded-xl bg-[#0C1317] border border-[#294149] text-[11px] text-[#A8BBC0] space-y-1">
                <span className="font-bold text-[#01B59A] flex items-center gap-1 font-mono">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Diretriz Pedagógica:
                </span>
                <p>
                  Posso orientar sobre as equações de Euler-Bernoulli, diagramas de momento e
                  formulações numéricas. Não forneço o valor numérico final do exercício.
                </p>
              </div>

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-[#01B59A] text-black font-medium'
                        : 'bg-[#0C1317] text-white border border-[#294149]'
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.disclaimer && (
                    <span className="text-[9px] text-[#A8BBC0] mt-1 italic px-1">
                      {m.disclaimer}
                    </span>
                  )}
                </div>
              ))}

              {isSending && (
                <div className="flex items-center gap-2 text-[#01B59A] font-mono text-[11px] p-2">
                  <span className="animate-spin">⚙</span> Consultando fundamentação técnica...
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="pt-2 border-t border-[#294149] flex gap-2">
              <Input
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ex: Como relacionar a linha neutra com a inércia da viga?"
                className="bg-[#0C1317] border-[#294149] text-white placeholder:text-[#A8BBC0]/50 text-xs h-9"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputQuestion.trim() || isSending}
                className="bg-[#01B59A] text-black hover:bg-[#01B59A]/90 h-9 px-3"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
