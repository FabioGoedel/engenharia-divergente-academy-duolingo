/**
 * Engenharia Divergente Academy — Safe Math Parser
 *
 * Parser aritmético seguro sem eval, Function() ou execução dinâmica de JavaScript.
 * Suporta:
 * - Operações básicas: +, -, *, /
 * - Potenciação: ^ (com associatividade à direita)
 * - Radiciação / Funções: sqrt(x)
 * - Parênteses: ( e )
 * - Notação científica: 1.23e-4, 5E3
 * - Formato numérico brasileiro com vírgula ou ponto decimal
 * - Conversões explícitas para unidades de engenharia
 */

export interface Token {
  type: 'NUMBER' | 'OP' | 'LPAREN' | 'RPAREN' | 'FUNC'
  value: string | number
}

export type EngineeringUnit = 'kN' | 'N' | 'm' | 'mm' | 'MPa' | 'N/mm2' | 'GPa' | 'cm4' | 'mm4'

export interface UnitConversionRule {
  from: EngineeringUnit
  to: EngineeringUnit
  factor: number
  description: string
  formulaLatex: string
}

export const ENGINEERING_CONVERSIONS: UnitConversionRule[] = [
  {
    from: 'kN',
    to: 'N',
    factor: 1000,
    description: '1 kN = 1.000 N',
    formulaLatex: '1\\text{ kN} = 10^3\\text{ N}',
  },
  {
    from: 'N',
    to: 'kN',
    factor: 0.001,
    description: '1 N = 0,001 kN',
    formulaLatex: '1\\text{ N} = 10^{-3}\\text{ kN}',
  },
  {
    from: 'm',
    to: 'mm',
    factor: 1000,
    description: '1 m = 1.000 mm',
    formulaLatex: '1\\text{ m} = 10^3\\text{ mm}',
  },
  {
    from: 'mm',
    to: 'm',
    factor: 0.001,
    description: '1 mm = 0,001 m',
    formulaLatex: '1\\text{ mm} = 10^{-3}\\text{ m}',
  },
  {
    from: 'MPa',
    to: 'N/mm2',
    factor: 1,
    description: '1 MPa = 1 N/mm² (identidade)',
    formulaLatex: '1\\text{ MPa} = 1\\text{ N/mm}^2',
  },
  {
    from: 'N/mm2',
    to: 'MPa',
    factor: 1,
    description: '1 N/mm² = 1 MPa (identidade)',
    formulaLatex: '1\\text{ N/mm}^2 = 1\\text{ MPa}',
  },
  {
    from: 'GPa',
    to: 'MPa',
    factor: 1000,
    description: '1 GPa = 1.000 MPa',
    formulaLatex: '1\\text{ GPa} = 10^3\\text{ MPa}',
  },
  {
    from: 'MPa',
    to: 'GPa',
    factor: 0.001,
    description: '1 MPa = 0,001 GPa',
    formulaLatex: '1\\text{ MPa} = 10^{-3}\\text{ GPa}',
  },
  {
    from: 'cm4',
    to: 'mm4',
    factor: 10000,
    description: '1 cm⁴ = 10.000 mm⁴ (10⁴)',
    formulaLatex: '1\\text{ cm}^4 = 10^4\\text{ mm}^4',
  },
  {
    from: 'mm4',
    to: 'cm4',
    factor: 0.0001,
    description: '1 mm⁴ = 0,0001 cm⁴ (10⁻⁴)',
    formulaLatex: '1\\text{ mm}^4 = 10^{-4}\\text{ cm}^4',
  },
]

/**
 * Normaliza string de entrada: substitui vírgula entre dígitos por ponto,
 * preservando a interpretação do padrão brasileiro.
 */
export function normalizeExpression(expr: string): string {
  if (!expr) return ''
  // Normaliza vírgula decimal entre dígitos: 24,5 -> 24.5
  return expr
    .replace(/(\d+),(\d+)/g, '$1.$2')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
}

/**
 * Tokenizador seguro para expressões matemáticas
 */
export function tokenize(expr: string): Token[] {
  const normalized = normalizeExpression(expr)
  const tokens: Token[] = []
  let i = 0

  while (i < normalized.length) {
    const ch = normalized[i]

    if (/\s/.test(ch)) {
      i++
      continue
    }

    // Identificação de funções (sqrt)
    if (/[a-zA-Z]/.test(ch)) {
      let funcName = ''
      while (i < normalized.length && /[a-zA-Z]/.test(normalized[i])) {
        funcName += normalized[i]
        i++
      }
      funcName = funcName.toLowerCase()
      if (funcName === 'sqrt' || funcName === 'raiz') {
        tokens.push({ type: 'FUNC', value: 'sqrt' })
        continue
      }
      throw new Error(`Função desconhecida: "${funcName}". Use apenas operações padrão ou sqrt.`)
    }

    // Números (incluindo inteiros, decimais e notação científica ex: 1.23e-4, 5e3)
    if (/\d|\./.test(ch)) {
      let numStr = ''
      let hasDot = false
      let hasExp = false

      while (i < normalized.length) {
        const c = normalized[i]
        if (/\d/.test(c)) {
          numStr += c
          i++
        } else if (c === '.' && !hasDot && !hasExp) {
          hasDot = true
          numStr += c
          i++
        } else if ((c === 'e' || c === 'E') && !hasExp) {
          hasExp = true
          numStr += c
          i++
          // Pode ter sinal no expoente: e-4 ou e+3
          if (i < normalized.length && (normalized[i] === '+' || normalized[i] === '-')) {
            numStr += normalized[i]
            i++
          }
        } else {
          break
        }
      }

      const val = Number(numStr)
      if (Number.isNaN(val) || !Number.isFinite(val)) {
        throw new Error(`Número inválido na expressão: "${numStr}"`)
      }
      tokens.push({ type: 'NUMBER', value: val })
      continue
    }

    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' })
      i++
      continue
    }

    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' })
      i++
      continue
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^') {
      tokens.push({ type: 'OP', value: ch })
      i++
      continue
    }

    throw new Error(`Caractere inválido ou não suportado: "${ch}"`)
  }

  return tokens
}

/**
 * Recursive Descent Parser matemático seguro
 *
 * Gramática:
 * Expression -> Term ( ('+' | '-') Term )*
 * Term       -> Power ( ('*' | '/') Power )*
 * Power      -> Factor ( '^' Power )?   [associativo à direita]
 * Factor     -> ('+' | '-')? Primary
 * Primary    -> NUMBER | LPAREN Expression RPAREN | FUNC LPAREN Expression RPAREN
 */
class Parser {
  private tokens: Token[]
  private pos = 0

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos]
  }

  private consume(): Token {
    return this.tokens[this.pos++]
  }

  parse(): number {
    if (this.tokens.length === 0) {
      throw new Error('Expressão vazia.')
    }
    const result = this.expression()
    if (this.pos < this.tokens.length) {
      const leftover = this.tokens[this.pos]
      throw new Error(`Sintaxe inesperada próximo a "${leftover.value}"`)
    }
    if (Number.isNaN(result) || !Number.isFinite(result)) {
      throw new Error('Resultado numérico indefinido ou infinito.')
    }
    return result
  }

  private expression(): number {
    let result = this.term()

    while (
      this.peek()?.type === 'OP' &&
      (this.peek()?.value === '+' || this.peek()?.value === '-')
    ) {
      const op = this.consume().value
      const right = this.term()
      if (op === '+') {
        result += right
      } else {
        result -= right
      }
    }

    return result
  }

  private term(): number {
    let result = this.power()

    while (
      this.peek()?.type === 'OP' &&
      (this.peek()?.value === '*' || this.peek()?.value === '/')
    ) {
      const op = this.consume().value
      const right = this.power()
      if (op === '*') {
        result *= right
      } else {
        if (right === 0) {
          throw new Error('Divisão por zero não permitida.')
        }
        result /= right
      }
    }

    return result
  }

  private power(): number {
    const base = this.factor()

    if (this.peek()?.type === 'OP' && this.peek()?.value === '^') {
      this.consume()
      const exponent = this.power() // Associativo à direita
      return Math.pow(base, exponent)
    }

    return base
  }

  private factor(): number {
    const token = this.peek()

    // Operador unário (+ ou -)
    if (token?.type === 'OP' && (token.value === '+' || token.value === '-')) {
      this.consume()
      const factorVal = this.factor()
      return token.value === '-' ? -factorVal : factorVal
    }

    return this.primary()
  }

  private primary(): number {
    const token = this.peek()

    if (!token) {
      throw new Error('Fim inesperado da expressão.')
    }

    if (token.type === 'NUMBER') {
      this.consume()
      return typeof token.value === 'number' ? token.value : Number(token.value)
    }

    if (token.type === 'FUNC') {
      this.consume()
      const next = this.peek()
      if (next?.type !== 'LPAREN') {
        throw new Error('Esperado "(" após a função.')
      }
      this.consume() // consome '('
      const arg = this.expression()
      const closing = this.peek()
      if (closing?.type !== 'RPAREN') {
        throw new Error('Esperado ")" para fechar a função.')
      }
      this.consume() // consome ')'

      if (token.value === 'sqrt') {
        if (arg < 0) {
          throw new Error('Raiz quadrada de número negativo não é suportada no domínio real.')
        }
        return Math.sqrt(arg)
      }
    }

    if (token.type === 'LPAREN') {
      this.consume()
      const exprVal = this.expression()
      const closing = this.peek()
      if (closing?.type !== 'RPAREN') {
        throw new Error('Parênteses não balanceados: esperado ")".')
      }
      this.consume()
      return exprVal
    }

    throw new Error(`Token inesperado: "${token.value}"`)
  }
}

/**
 * Avalia de forma puramente aritmética e segura a expressão matemática.
 * Retorna o número calculado ou lança erro explicativo amigável.
 */
export function evaluateSafeMath(expr: string): number {
  const tokens = tokenize(expr)
  const parser = new Parser(tokens)
  return parser.parse()
}

/**
 * Converte explicitamente um valor numérico entre unidades de engenharia.
 */
export function convertUnit(
  val: number,
  from: EngineeringUnit,
  to: EngineeringUnit,
): { result: number; rule: UnitConversionRule } {
  if (from === to) {
    return {
      result: val,
      rule: {
        from,
        to,
        factor: 1,
        description: `1 ${from} = 1 ${to}`,
        formulaLatex: `1\\text{ ${from}} = 1\\text{ ${to}}`,
      },
    }
  }

  const rule = ENGINEERING_CONVERSIONS.find((r) => r.from === from && r.to === to)
  if (!rule) {
    throw new Error(`Conversão de "${from}" para "${to}" não é permitida ou não está cadastrada.`)
  }

  const result = val * rule.factor
  return { result, rule }
}

/**
 * Formata um número para o padrão pt-BR de visualização (ex: "1.234,56" ou "1,234e-4")
 */
export function formatEngineeringNumber(
  val: number,
  options?: { maxDecimals?: number; scientificThreshold?: boolean },
): string {
  if (val === null || val === undefined || Number.isNaN(val) || !Number.isFinite(val)) {
    return '0'
  }

  const abs = Math.abs(val)
  // Notação científica para números muito pequenos (< 0.0001) ou muito grandes (>= 1e7)
  if (options?.scientificThreshold && abs !== 0 && (abs < 0.0001 || abs >= 1e7)) {
    const sci = val.toExponential(4)
    return sci.replace('.', ',')
  }

  const maxDecimals = options?.maxDecimals ?? 4
  const rounded = Number(val.toFixed(maxDecimals))
  const parts = rounded.toString().split('.')
  const intPart = parts[0]
  const decPart = parts[1]

  if (!decPart) return intPart
  return `${intPart},${decPart}`
}
