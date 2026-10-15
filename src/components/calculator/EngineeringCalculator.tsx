import React, { useState } from 'react'
import {
  Calculator as CalcIcon,
  X,
  Minimize2,
  Maximize2,
  ArrowRight,
  History,
  RotateCcw,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  evaluateSafeMath,
  convertUnit,
  formatEngineeringNumber,
  EngineeringUnit,
  ENGINEERING_CONVERSIONS,
} from '@/lib/safeMathParser'

export interface EngineeringCalculatorProps {
  onTransferResult?: (formattedValue: string, numericValue: number) => void
  targetUnit?: string
  defaultOpen?: boolean
  className?: string
}

interface CalcHistoryEntry {
  id: string
  expression: string
  result: number
  timestamp: string
}

export const EngineeringCalculator: React.FC<EngineeringCalculatorProps> = ({
  onTransferResult,
  targetUnit,
  defaultOpen = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isMinimized, setIsMinimized] = useState(false)
  const [expression, setExpression] = useState('')
  const [lastCalculatedResult, setLastCalculatedResult] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [history, setHistory] = useState<CalcHistoryEntry[]>([])
  const [activeTab, setActiveTab] = useState<'calc' | 'conversions' | 'history'>('calc')

  // Conversões
  const [convValue, setConvValue] = useState<string>('1')
  const [fromUnit, setFromUnit] = useState<EngineeringUnit>('kN')
  const [toUnit, setToUnit] = useState<EngineeringUnit>('N')
  const [convResult, setConvResult] = useState<{
    result: number
    description: string
  } | null>(null)
  const [convError, setConvError] = useState<string | null>(null)

  const handleAppend = (text: string) => {
    setExpression((prev) => prev + text)
    setErrorMessage(null)
  }

  const handleClear = () => {
    setExpression('')
    setErrorMessage(null)
    // ATENÇÃO: Conforme critério, erro ou limpar não apaga a última resposta calculada!
  }

  const handleBackspace = () => {
    setExpression((prev) => prev.slice(0, -1))
    setErrorMessage(null)
  }

  const handleEvaluate = () => {
    if (!expression.trim()) return
    try {
      const res = evaluateSafeMath(expression)
      setLastCalculatedResult(res)
      setErrorMessage(null)

      // Adiciona ao histórico da sessão
      setHistory((prev) => [
        {
          id: `h-${Date.now()}`,
          expression,
          result: res,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.slice(0, 19), // Mantém até 20 itens
      ])
    } catch (err: unknown) {
      // Regra técnica: ERRO de expressão NÃO apaga a resposta anterior
      setErrorMessage(err instanceof Error ? err.message : 'Expressão matemática inválida')
    }
  }

  const handleConvert = () => {
    setConvError(null)
    try {
      // Normaliza vírgula do pt-BR
      const num = Number(convValue.trim().replace(',', '.'))
      if (Number.isNaN(num) || !Number.isFinite(num)) {
        throw new Error('Insira um número válido para converter.')
      }
      const outcome = convertUnit(num, fromUnit, toUnit)
      setConvResult({
        result: outcome.result,
        description: outcome.rule.description,
      })
    } catch (err: unknown) {
      setConvError(err instanceof Error ? err.message : 'Falha na conversão')
    }
  }

  const handleTransfer = (numVal: number) => {
    if (onTransferResult) {
      const formatted = formatEngineeringNumber(numVal, { maxDecimals: 4 })
      onTransferResult(formatted, numVal)
    }
  }

  // Teclas da calculadora
  const KEYPAD_BUTTONS = [
    { label: 'C', action: handleClear, variant: 'destructive' },
    { label: '⌫', action: handleBackspace, variant: 'outline' },
    { label: '(', action: () => handleAppend('('), variant: 'outline' },
    { label: ')', action: () => handleAppend(')'), variant: 'outline' },

    { label: 'sqrt', action: () => handleAppend('sqrt('), variant: 'secondary' },
    { label: '^', action: () => handleAppend('^'), variant: 'secondary' },
    { label: 'e-', action: () => handleAppend('e-'), variant: 'secondary' },
    { label: '÷', action: () => handleAppend('/'), variant: 'secondary' },

    { label: '7', action: () => handleAppend('7'), variant: 'default' },
    { label: '8', action: () => handleAppend('8'), variant: 'default' },
    { label: '9', action: () => handleAppend('9'), variant: 'default' },
    { label: '×', action: () => handleAppend('*'), variant: 'secondary' },

    { label: '4', action: () => handleAppend('4'), variant: 'default' },
    { label: '5', action: () => handleAppend('5'), variant: 'default' },
    { label: '6', action: () => handleAppend('6'), variant: 'default' },
    { label: '-', action: () => handleAppend('-'), variant: 'secondary' },

    { label: '1', action: () => handleAppend('1'), variant: 'default' },
    { label: '2', action: () => handleAppend('2'), variant: 'default' },
    { label: '3', action: () => handleAppend('3'), variant: 'default' },
    { label: '+', action: () => handleAppend('+'), variant: 'secondary' },

    { label: '0', action: () => handleAppend('0'), variant: 'default' },
    { label: ',', action: () => handleAppend(','), variant: 'default' },
    { label: 'EXP', action: () => handleAppend('e'), variant: 'outline' },
    { label: '=', action: handleEvaluate, variant: 'primary' },
  ]

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-[#01B59A] bg-[#0C1317] px-4 py-2.5 text-xs font-mono font-bold text-white shadow-2xl transition-transform hover:scale-105 hover:bg-[#152228] focus:outline-none focus:ring-2 focus:ring-[#01B59A]"
        title="Abrir Calculadora Técnica Integrada"
      >
        <CalcIcon className="h-4 w-4 text-[#01B59A]" />
        <span>Calculadora Técnica</span>
        {lastCalculatedResult !== null && (
          <Badge className="bg-[#01B59A] text-black font-mono text-[10px] px-1.5 py-0">
            {formatEngineeringNumber(lastCalculatedResult, { maxDecimals: 2 })}
          </Badge>
        )}
      </button>
    )
  }

  return (
    <div
      className={`fixed z-40 rounded-2xl border border-[#294149] bg-[#0C1317]/95 backdrop-blur-md shadow-2xl text-white transition-all ${
        isMinimized
          ? 'bottom-5 right-5 w-72 p-3'
          : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-h-[92vh] flex flex-col p-4'
      } ${className}`}
    >
      {/* Topo / Header */}
      <div className="flex items-center justify-between border-b border-[#294149] pb-2 mb-3">
        <div className="flex items-center gap-2">
          <CalcIcon className="h-4 w-4 text-[#01B59A]" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            Calculadora Técnica
          </h3>
          <Badge
            variant="outline"
            className="text-[9px] border-[#01B59A]/40 text-[#01B59A] px-1 py-0"
          >
            pt-BR
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-6 w-6 text-[#A8BBC0] hover:text-white"
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? (
              <Maximize2 className="h-3.5 w-3.5" />
            ) : (
              <Minimize2 className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 text-[#A8BBC0] hover:text-[#C86F63]"
            title="Fechar"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isMinimized ? (
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#A8BBC0] truncate mr-2">{expression || '0'}</span>
          <span className="text-[#01B59A] font-bold">
            = {lastCalculatedResult !== null ? formatEngineeringNumber(lastCalculatedResult) : '—'}
          </span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 space-y-3">
          {/* Navegação por abas */}
          <div className="grid grid-cols-3 gap-1 bg-[#152228] p-0.5 rounded-lg text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab('calc')}
              className={`py-1 rounded text-center transition-colors ${
                activeTab === 'calc'
                  ? 'bg-[#01B59A] text-black font-bold'
                  : 'text-[#A8BBC0] hover:text-white'
              }`}
            >
              Cálculo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('conversions')}
              className={`py-1 rounded text-center transition-colors ${
                activeTab === 'conversions'
                  ? 'bg-[#01B59A] text-black font-bold'
                  : 'text-[#A8BBC0] hover:text-white'
              }`}
            >
              Unidades
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`py-1 rounded text-center transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'history'
                  ? 'bg-[#01B59A] text-black font-bold'
                  : 'text-[#A8BBC0] hover:text-white'
              }`}
            >
              <span>Histórico</span>
              {history.length > 0 && (
                <span className="text-[10px] px-1 bg-black/40 rounded-full font-bold">
                  {history.length}
                </span>
              )}
            </button>
          </div>

          {/* ABA 1: CALCULADORA ARITMÉTICA */}
          {activeTab === 'calc' && (
            <div className="space-y-3 flex-1 flex flex-col justify-between min-h-0">
              {/* Visor */}
              <div className="rounded-xl border border-[#294149] bg-black/70 p-3 font-mono space-y-1">
                <div className="flex justify-between items-center text-[11px] text-[#A8BBC0]">
                  <span>Expressão:</span>
                  <span className="text-[10px] text-[#01B59A]">Parser seguro (sem eval)</span>
                </div>
                <input
                  type="text"
                  value={expression}
                  onChange={(e) => {
                    setExpression(e.target.value)
                    setErrorMessage(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEvaluate()
                  }}
                  placeholder="Ex: (75 * 10^3) / 490,87"
                  className="w-full bg-transparent text-right text-base text-white font-mono focus:outline-none"
                />

                {errorMessage && (
                  <div className="flex items-center gap-1 text-[11px] text-[#C86F63] pt-1 border-t border-[#294149]">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span className="truncate">{errorMessage}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
                  <span className="text-[#A8BBC0]">Resultado:</span>
                  <span className="text-lg font-bold text-[#01B59A]">
                    {lastCalculatedResult !== null
                      ? formatEngineeringNumber(lastCalculatedResult, {
                          maxDecimals: 5,
                          scientificThreshold: true,
                        })
                      : '0'}
                  </span>
                </div>
              </div>

              {/* Botão de Transferência Contextual */}
              {onTransferResult && lastCalculatedResult !== null && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleTransfer(lastCalculatedResult)}
                  className="w-full bg-[#01B59A]/15 border border-[#01B59A] text-[#01B59A] hover:bg-[#01B59A] hover:text-black font-mono font-bold text-xs py-1.5 flex items-center justify-center gap-2"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  <span>
                    Transferir {formatEngineeringNumber(lastCalculatedResult)}
                    {targetUnit ? ` [${targetUnit}]` : ''} ao campo
                  </span>
                </Button>
              )}

              {/* Teclado */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {KEYPAD_BUTTONS.map((btn, idx) => {
                  let cls =
                    'h-9 rounded-lg font-mono text-xs font-semibold transition-all active:scale-95 '
                  if (btn.variant === 'primary') {
                    cls += 'bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-bold'
                  } else if (btn.variant === 'destructive') {
                    cls +=
                      'bg-[#C86F63]/20 text-[#C86F63] hover:bg-[#C86F63]/30 border border-[#C86F63]/40'
                  } else if (btn.variant === 'secondary') {
                    cls += 'bg-[#152228] text-[#01B59A] hover:bg-[#1E3038] border border-[#294149]'
                  } else if (btn.variant === 'outline') {
                    cls += 'bg-[#0C1317] text-[#A8BBC0] hover:text-white border border-[#294149]'
                  } else {
                    cls += 'bg-[#152228] text-white hover:bg-[#1E3038] border border-transparent'
                  }

                  return (
                    <button key={idx} type="button" onClick={btn.action} className={cls}>
                      {btn.label}
                    </button>
                  )
                })}
              </div>

              {/* Dica da regra pedagógica */}
              <p className="text-[10px] text-[#A8BBC0] text-center pt-1">
                A calculadora fornece apenas auxílio numérico — deduções conceituais cabem ao
                engenheiro.
              </p>
            </div>
          )}

          {/* ABA 2: CONVERSÃO EXPLÍCITA DE UNIDADES */}
          {activeTab === 'conversions' && (
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div className="rounded-lg border border-[#294149] bg-[#152228] p-3 space-y-2">
                <span className="text-xs font-mono font-bold text-white block">
                  Conversão Explícita de Engenharia
                </span>
                <p className="text-[11px] text-[#A8BBC0]">
                  Conversões rigorosas sem aproximações ocultas para compatibilizar MPa, kN e
                  grandezas geométricas.
                </p>

                <div className="space-y-2 pt-1">
                  <div>
                    <label className="text-[10px] font-mono text-[#A8BBC0] block mb-1">
                      Valor a converter (pt-BR):
                    </label>
                    <input
                      type="text"
                      value={convValue}
                      onChange={(e) => setConvValue(e.target.value)}
                      placeholder="Ex: 75 ou 1500"
                      className="w-full bg-[#0C1317] border border-[#294149] rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-[#01B59A]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-[#A8BBC0] block mb-1">De:</label>
                      <select
                        value={fromUnit}
                        onChange={(e) => setFromUnit(e.target.value as EngineeringUnit)}
                        className="w-full bg-[#0C1317] border border-[#294149] rounded px-2 py-1 text-xs font-mono text-white focus:outline-none"
                      >
                        <option value="kN">kN (quilonewtons)</option>
                        <option value="N">N (newtons)</option>
                        <option value="m">m (metros)</option>
                        <option value="mm">mm (milímetros)</option>
                        <option value="MPa">MPa (megapascais)</option>
                        <option value="N/mm2">N/mm²</option>
                        <option value="GPa">GPa (gigapascais)</option>
                        <option value="cm4">cm⁴ (inércia)</option>
                        <option value="mm4">mm⁴ (inércia)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-[#A8BBC0] block mb-1">
                        Para:
                      </label>
                      <select
                        value={toUnit}
                        onChange={(e) => setToUnit(e.target.value as EngineeringUnit)}
                        className="w-full bg-[#0C1317] border border-[#294149] rounded px-2 py-1 text-xs font-mono text-white focus:outline-none"
                      >
                        <option value="N">N (newtons)</option>
                        <option value="kN">kN (quilonewtons)</option>
                        <option value="mm">mm (milímetros)</option>
                        <option value="m">m (metros)</option>
                        <option value="MPa">MPa (megapascais)</option>
                        <option value="N/mm2">N/mm²</option>
                        <option value="GPa">GPa (gigapascais)</option>
                        <option value="mm4">mm⁴ (inércia)</option>
                        <option value="cm4">cm⁴ (inércia)</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleConvert}
                    className="w-full bg-[#01B59A] text-black hover:bg-[#01B59A]/90 font-mono font-bold text-xs h-8"
                  >
                    Calcular Conversão
                  </Button>
                </div>
              </div>

              {convError && (
                <div className="p-2 rounded border border-[#C86F63] bg-[#C86F63]/10 text-xs text-[#C86F63]">
                  {convError}
                </div>
              )}

              {convResult && (
                <div className="rounded-lg border border-[#01B59A]/40 bg-[#0C1317] p-3 space-y-2 font-mono">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A8BBC0]">Resultado:</span>
                    <span className="text-base font-bold text-[#01B59A]">
                      {formatEngineeringNumber(convResult.result, { scientificThreshold: true })}{' '}
                      {toUnit}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A8BBC0] border-t border-[#294149] pt-1">
                    Fator: {convResult.description}
                  </p>

                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setExpression((prev) => prev + convResult.result.toString())
                        setActiveTab('calc')
                      }}
                      className="flex-1 text-[11px] h-7 border-[#294149]"
                    >
                      Copiar p/ Calculadora
                    </Button>
                    {onTransferResult && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleTransfer(convResult.result)}
                        className="flex-1 bg-[#01B59A] text-black text-[11px] h-7 font-bold"
                      >
                        Transferir à Questão
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Guia rápido de conversões comuns */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono uppercase text-[#A8BBC0] block">
                  Relações Canônicas Rápidas:
                </span>
                <div className="space-y-1 text-[11px] font-mono text-[#A8BBC0]">
                  <div className="p-1.5 rounded bg-[#152228] flex justify-between">
                    <span>1 MPa</span>
                    <span className="text-white">= 1 N/mm²</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#152228] flex justify-between">
                    <span>1 GPa</span>
                    <span className="text-white">= 1.000 MPa = 10⁹ Pa</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#152228] flex justify-between">
                    <span>1 cm⁴</span>
                    <span className="text-white">= 10.000 mm⁴ (10⁴)</span>
                  </div>
                  <div className="p-1.5 rounded bg-[#152228] flex justify-between">
                    <span>1 kN</span>
                    <span className="text-white">= 1.000 N = 10³ N</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: HISTÓRICO LOCAL DA SESSÃO */}
          {activeTab === 'history' && (
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              <div className="flex justify-between items-center text-xs font-mono text-[#A8BBC0] pb-1 border-b border-[#294149]">
                <span>Últimos cálculos desta sessão</span>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    className="text-[#C86F63] hover:underline text-[10px]"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#A8BBC0] font-mono">
                  Nenhum cálculo realizado nesta sessão ainda.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="rounded-lg border border-[#294149] bg-[#152228] p-2 text-xs font-mono space-y-1 group hover:border-[#01B59A]/60"
                    >
                      <div className="flex justify-between text-[10px] text-[#A8BBC0]">
                        <span className="truncate max-w-[200px]">{h.expression}</span>
                        <span>{h.timestamp}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-[#01B59A]">
                          = {formatEngineeringNumber(h.result, { scientificThreshold: true })}
                        </span>
                        <div className="flex gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => {
                              setExpression(h.result.toString())
                              setActiveTab('calc')
                            }}
                            className="px-1.5 py-0.5 rounded bg-[#0C1317] text-[10px] text-white hover:text-[#01B59A]"
                            title="Usar na calculadora"
                          >
                            Usar
                          </button>
                          {onTransferResult && (
                            <button
                              type="button"
                              onClick={() => handleTransfer(h.result)}
                              className="px-1.5 py-0.5 rounded bg-[#01B59A] text-[10px] text-black font-bold"
                              title="Transferir para a resposta"
                            >
                              Transferir
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
