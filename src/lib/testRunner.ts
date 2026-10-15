/**
 * Engenharia Divergente Academy — Suíte de Testes Automatizados (Etapa 1)
 *
 * Valida:
 * 1. Safe Math Parser: aritmética, precedência, parênteses, potência, sqrt, notação científica, vírgula pt-BR.
 * 2. Conversões explícitas de unidades de engenharia (kN↔N, m↔mm, MPa↔N/mm², GPa↔MPa, cm⁴↔mm⁴).
 * 3. Parser numérico pt-BR e rejeição de NaN/infinito/inválidos.
 * 4. Correção pedagógica com tolerância absoluta/relativa (Exercício 2 e Exercício 3).
 * 5. Idempotência de XP no ActivityService (UNIQUE source_attempt_id + reason).
 */

import { evaluateSafeMath, convertUnit, formatEngineeringNumber } from '@/lib/safeMathParser'
import { parseBrazilianNumericInput } from '@/schemas/canonicalSchemas'
import { ActivityService } from '@/services/activityService'

export interface TestResult {
  name: string
  passed: boolean
  error?: string
}

export async function runAcademyEngineeringTests(): Promise<{
  allPassed: boolean
  passedCount: number
  failedCount: number
  results: TestResult[]
}> {
  const results: TestResult[] = []

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      const res = fn()
      if (res && typeof (res as Promise<void>).then === 'function') {
        return (res as Promise<void>)
          .then(() => results.push({ name, passed: true }))
          .catch((err) =>
            results.push({
              name,
              passed: false,
              error: err instanceof Error ? err.message : String(err),
            }),
          )
      }
      results.push({ name, passed: true })
      return Promise.resolve()
    } catch (err) {
      results.push({
        name,
        passed: false,
        error: err instanceof Error ? err.message : String(err),
      })
      return Promise.resolve()
    }
  }

  // --- 1. TESTES DO PARSER MATEMÁTICO SEGURO ---
  await test('SafeMath: Operações básicas (+, -, *, /)', () => {
    const val = evaluateSafeMath('10 + 5 * 2 - 8 / 4')
    if (val !== 18) throw new Error(`Esperado 18, obtido ${val}`)
  })

  await test('SafeMath: Parênteses e precedência correta', () => {
    const val = evaluateSafeMath('(10 + 5) * (2 - 8) / 4')
    if (val !== -22.5) throw new Error(`Esperado -22.5, obtido ${val}`)
  })

  await test('SafeMath: Potenciação (^) associativa à direita', () => {
    const val = evaluateSafeMath('2 ^ 3 ^ 2')
    // 3^2 = 9; 2^9 = 512
    if (val !== 512) throw new Error(`Esperado 512, obtido ${val}`)
  })

  await test('SafeMath: Radiciação sqrt()', () => {
    const val = evaluateSafeMath('sqrt(144) + sqrt(25)')
    if (val !== 17) throw new Error(`Esperado 17, obtido ${val}`)
  })

  await test('SafeMath: Notação científica (1.23e-4 e 5e3)', () => {
    const val1 = evaluateSafeMath('5e3 + 200')
    if (val1 !== 5200) throw new Error(`Esperado 5200, obtido ${val1}`)

    const val2 = evaluateSafeMath('1.2e-3 * 1000')
    if (Math.abs(val2 - 1.2) > 1e-6) throw new Error(`Esperado 1.2, obtido ${val2}`)
  })

  await test('SafeMath: Suporte ao padrão pt-BR de vírgula decimal (ex: 24,5 + 0,5)', () => {
    const val = evaluateSafeMath('24,5 + 0,5 * 10')
    // 24.5 + 5 = 29.5
    if (val !== 29.5) throw new Error(`Esperado 29.5, obtido ${val}`)
  })

  await test('SafeMath: Rejeição segura de divisão por zero', () => {
    let failed = false
    try {
      evaluateSafeMath('10 / (5 - 5)')
    } catch {
      failed = true
    }
    if (!failed) throw new Error('Deveria ter lançado erro de divisão por zero.')
  })

  await test('SafeMath: Rejeição de código ou eval dinâmico', () => {
    let rejected = false
    try {
      evaluateSafeMath('console.log(1) + alert(2)')
    } catch {
      rejected = true
    }
    if (!rejected) throw new Error('Deveria rejeitar identificadores não matemáticos.')
  })

  // --- 2. TESTES DE CONVERSÕES DE UNIDADES ---
  await test('Conversão: kN para N (1 kN = 1000 N)', () => {
    const c = convertUnit(75, 'kN', 'N')
    if (c.result !== 75000) throw new Error(`Esperado 75000 N, obtido ${c.result}`)
  })

  await test('Conversão: N para kN (75000 N = 75 kN)', () => {
    const c = convertUnit(75000, 'N', 'kN')
    if (c.result !== 75) throw new Error(`Esperado 75 kN, obtido ${c.result}`)
  })

  await test('Conversão: m para mm (6 m = 6000 mm)', () => {
    const c = convertUnit(6, 'm', 'mm')
    if (c.result !== 6000) throw new Error(`Esperado 6000 mm, obtido ${c.result}`)
  })

  await test('Conversão: MPa para N/mm² (1 MPa = 1 N/mm²)', () => {
    const c = convertUnit(150, 'MPa', 'N/mm2')
    if (c.result !== 150) throw new Error(`Esperado 150 N/mm2, obtido ${c.result}`)
  })

  await test('Conversão: GPa para MPa (200 GPa = 200.000 MPa)', () => {
    const c = convertUnit(200, 'GPa', 'MPa')
    if (c.result !== 200000) throw new Error(`Esperado 200000 MPa, obtido ${c.result}`)
  })

  await test('Conversão: cm⁴ para mm⁴ (5400 cm⁴ = 54.000.000 mm⁴)', () => {
    const c = convertUnit(5400, 'cm4', 'mm4')
    if (c.result !== 54000000) throw new Error(`Esperado 54000000 mm⁴, obtido ${c.result}`)
  })

  // --- 3. TESTES DE PARSER PT-BR DE ENTRADA ---
  await test('parseBrazilianNumericInput: Aceita ponto, vírgula e espaços', () => {
    if (parseBrazilianNumericInput(' 152,79 ') !== 152.79) throw new Error('Falhou com vírgula')
    if (parseBrazilianNumericInput(' 152.79 ') !== 152.79) throw new Error('Falhou com ponto')
    if (parseBrazilianNumericInput(152.79) !== 152.79) throw new Error('Falhou com number')
  })

  await test('parseBrazilianNumericInput: Rejeita NaN, strings malucas e vazio', () => {
    if (parseBrazilianNumericInput('abc') !== null) throw new Error('Não rejeitou texto')
    if (parseBrazilianNumericInput('') !== null) throw new Error('Não rejeitou vazio')
    if (parseBrazilianNumericInput(NaN) !== null) throw new Error('Não rejeitou NaN')
  })

  // --- 4. TESTE DE CORREÇÃO COM TOLERÂNCIA DA MISSÃO ---
  await test('ActivityService: Correção Exercício 2 (Módulo W, esperado 25.0 MPa)', async () => {
    const testAttemptId = `test-att-${Date.now()}`
    const result = await ActivityService.submitExerciseAnswer(
      {
        attemptId: testAttemptId,
        exerciseId: 'ex-bb-02',
        studentAnswer: { numericValue: '25,2' }, // Dentro da tolerância de ±0.5
        hintsUsedCount: 0,
      },
      'test-user',
    )

    if (!result.gradeResult.isCorrect) {
      throw new Error('25,2 deveria ser aceito dentro da tolerância de ±0.5 MPa.')
    }
  })

  await test('ActivityService: Correção Exercício 3 (Flecha, esperado 18.75 mm)', async () => {
    const testAttemptId = `test-att-${Date.now()}`
    const result = await ActivityService.submitExerciseAnswer(
      {
        attemptId: testAttemptId,
        exerciseId: 'ex-bb-03',
        studentAnswer: { numericValue: '18,8' }, // Dentro da tolerância de ±0.4
        hintsUsedCount: 0,
      },
      'test-user',
    )

    if (!result.gradeResult.isCorrect) {
      throw new Error('18,8 mm deveria ser aceito dentro da tolerância de ±0.4 mm.')
    }
  })

  // --- 5. TESTE DE IDEMPOTÊNCIA DE XP ---
  await test('ActivityService: Idempotência de XP — Re-submit do mesmo attempt não duplica XP', async () => {
    const testAttemptId = `idem-att-${Date.now()}`
    const firstSubmission = await ActivityService.submitExerciseAnswer(
      {
        attemptId: testAttemptId,
        exerciseId: 'ex-bb-01',
        studentAnswer: { selectedOptionIds: ['opt-1-a'] },
        hintsUsedCount: 0,
      },
      'test-user-idem',
    )

    if (firstSubmission.xpAwardedInThisAction <= 0) {
      throw new Error('A primeira submissão correta deveria ter concedido XP.')
    }

    // Segunda submissão idêntica da mesma tentativa
    const secondSubmission = await ActivityService.submitExerciseAnswer(
      {
        attemptId: testAttemptId,
        exerciseId: 'ex-bb-01',
        studentAnswer: { selectedOptionIds: ['opt-1-a'] },
        hintsUsedCount: 0,
      },
      'test-user-idem',
    )

    if (secondSubmission.xpAwardedInThisAction !== 0) {
      throw new Error(
        `Idempotência violada! XP foi concedido novamente: ${secondSubmission.xpAwardedInThisAction}`,
      )
    }
  })

  const passedCount = results.filter((r) => r.passed).length
  const failedCount = results.filter((r) => !r.passed).length

  return {
    allPassed: failedCount === 0,
    passedCount,
    failedCount,
    results,
  }
}
