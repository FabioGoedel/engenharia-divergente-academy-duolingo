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
import { ImportExportService, IMPORT_LIMITS } from '@/services/importExportService'
import { DEMO_CANONICAL_PACKAGE } from '@/data/demoCanonicalPackage'
import { BlockService } from '@/services/blockService'
import { QuestionBankService } from '@/services/questionBankService'

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

  // --- 6. TESTES DA ETAPA 1: SISTEMA DE IMPORTAÇÃO & INTEGRIDADE ---

  // 6.1 Importação de bloco válido individual
  await test('Importação: Bloco válido individual é aceito e estruturado como rascunho', async () => {
    const singleBlockPayload = {
      id: `blk-test-single-${Date.now()}`,
      block_type: 'single_choice',
      title: 'Teste de Flexão Pura',
      category: 'assessment',
      subject_area: 'Resistência dos Materiais',
      associated_competencies: ['COMP-RES-01'],
      initial_difficulty: 2,
      estimated_minutes: 5,
      config: {
        prompt: 'Qual a tensão no eixo neutro?',
        options: [
          { id: 'opt-1', label: 'A', text: 'Zero', rationale: 'Eixo neutro tem tensão zero.' },
        ],
        correctOptionId: 'opt-1',
        explanation: 'Por definição a linha neutra não sofre deformação axial.',
      },
      version: 1,
    }

    const testFile = new File([JSON.stringify(singleBlockPayload)], 'bloco_unitario.json', {
      type: 'application/json',
    })

    const report = await ImportExportService.analyzeAndValidateFile(testFile, 'admin')
    if (report.validItemsCount !== 1 || report.invalidItemsCount !== 0) {
      throw new Error(
        `Esperado 1 item válido, obtido ${report.validItemsCount} válidos e ${report.invalidItemsCount} inválidos`,
      )
    }

    const execResult = await ImportExportService.executeImport(
      report.items,
      'bloco_unitario.json',
      'admin',
      'Admin Test',
    )
    if (execResult.importedBlocksCount !== 1) {
      throw new Error(`Esperado 1 bloco importado, obtido ${execResult.importedBlocksCount}`)
    }

    // Verifica que entrou como draft
    const importedBlock = await BlockService.getById(singleBlockPayload.id)
    if (!importedBlock || importedBlock.editorialStatus !== 'draft') {
      throw new Error('O bloco importado deve entrar estritamente com status draft!')
    }
  })

  // 6.2 Importação de lote com pelo menos 100 blocos (requisito explícito)
  await test('Importação em Lote: Lote com 100 blocos sintéticos analisado e validado com sucesso', async () => {
    const batch100Blocks = Array.from({ length: 100 }, (_, i) => ({
      id: `blk-batch-100-${i + 1}-${Date.now()}`,
      block_type: i % 2 === 0 ? 'single_choice' : 'numeric_response',
      title: `Exercício em Lote de Engenharia #${i + 1}`,
      category: 'assessment',
      subject_area: 'Mecânica dos Sólidos',
      associated_competencies: [`COMP-LOT-${(i % 5) + 1}`],
      initial_difficulty: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
      estimated_minutes: 5,
      config:
        i % 2 === 0
          ? {
              prompt: `Pergunta do lote item ${i + 1}`,
              options: [{ id: 'opt-1', label: 'A', text: 'Opção Correta', rationale: 'Explicado' }],
              correctOptionId: 'opt-1',
              explanation: 'Justificativa técnica',
            }
          : {
              prompt: `Calcule a força ${i + 1}`,
              expectedValue: 100 + i,
              unit: 'kN',
              toleranceAbs: 1.0,
              explanation: 'Valor direto',
            },
      version: 1,
    }))

    const testFile = new File(
      [
        JSON.stringify({
          schema_version: '1.0.0',
          package_id: 'pkg-100',
          name: 'Lote 100',
          exported_at: new Date().toISOString(),
          media_assets: [],
          questions: [],
          blocks: batch100Blocks,
        }),
      ],
      'lote_100_blocos.json',
      {
        type: 'application/json',
      },
    )

    const report = await ImportExportService.analyzeAndValidateFile(testFile, 'admin')
    if (report.totalItemsDetected !== 100 || report.validItemsCount !== 100) {
      throw new Error(
        `Esperado 100 itens válidos detectados no lote, obtido total: ${report.totalItemsDetected}, válidos: ${report.validItemsCount}`,
      )
    }
  })

  // 6.3 Rejeição de JSON inválido e corrompido
  await test('Segurança: Rejeição estrita de JSON malformado ou corrompido', async () => {
    const corruptedFile = new File(
      ['{ "broken_json": [ unclosed array '],
      'arquivo_corrompido.json',
      {
        type: 'application/json',
      },
    )

    const report = await ImportExportService.analyzeAndValidateFile(corruptedFile, 'admin')
    if (report.globalErrors.length === 0) {
      throw new Error('Deveria ter emitido erro global de JSON inválido')
    }
  })

  // 6.4 Rejeição de tipos incompatíveis / não registrados
  await test('Validação: Rejeição de tipos de blocos inexistentes ou incompatíveis', async () => {
    const invalidTypePayload = {
      id: `blk-incompat-${Date.now()}`,
      block_type: 'tipo_falso_inexistente_xyz',
      title: 'Bloco com tipo inválido',
      category: 'assessment',
      config: {},
    }

    const testFile = new File([JSON.stringify(invalidTypePayload)], 'tipo_invalido.json', {
      type: 'application/json',
    })

    const report = await ImportExportService.analyzeAndValidateFile(testFile, 'admin')
    if (report.incompatibleTypeCount === 0 || report.invalidItemsCount === 0) {
      throw new Error('Deveria ter sinalizado tipo incompatível e item inválido')
    }
  })

  // 6.5 Identificação de duplicatas e Reimportação Idempotente
  await test('Idempotência & Versionamento: Reimportação atualiza sem duplicar registros', async () => {
    const testId = `blk-idem-test-${Date.now()}`
    const blockPayload = {
      id: testId,
      block_type: 'single_choice',
      title: 'Versão 1 Original',
      category: 'assessment',
      config: {
        prompt: 'V1',
        options: [{ id: 'opt-1', label: 'A', text: 'V1', rationale: 'OK' }],
        correctOptionId: 'opt-1',
        explanation: 'Exp',
      },
      version: 1,
    }

    const fileV1 = new File([JSON.stringify(blockPayload)], 'v1.json', { type: 'application/json' })
    const report1 = await ImportExportService.analyzeAndValidateFile(fileV1, 'admin')
    await ImportExportService.executeImport(report1.items, 'v1.json', 'admin', 'Tester')

    // Segunda importação com o mesmo ID
    const blockPayloadV2 = {
      ...blockPayload,
      title: 'Versão 2 Atualizada',
    }
    const fileV2 = new File([JSON.stringify(blockPayloadV2)], 'v2.json', {
      type: 'application/json',
    })
    const report2 = await ImportExportService.analyzeAndValidateFile(fileV2, 'admin')

    if (report2.duplicateCount !== 1) {
      throw new Error('Deveria ter detectado duplicata de ID existente')
    }

    await ImportExportService.executeImport(report2.items, 'v2.json', 'admin', 'Tester')
    const updated = await BlockService.getById(testId)
    if (!updated || updated.title !== 'Versão 2 Atualizada') {
      throw new Error('O registro existente deveria ter sido atualizado com os novos dados')
    }
  })

  // 6.6 Proteção de Gabarito (Private Key nunca vazada no student payload)
  await test('Segurança: Proteção de gabarito — QuestionBankService nunca expõe privateKey ao aluno', async () => {
    // Usa questão existente no demoCmsData
    const questions = await QuestionBankService.listQuestions()
    if (questions.length === 0) {
      throw new Error('Nenhuma questão encontrada para validar proteção de gabarito')
    }
    const targetQ = questions[0]
    const studentPayload = await QuestionBankService.getStudentPayload(targetQ.id)

    if (!studentPayload) {
      throw new Error('Payload do aluno não encontrado para a questão consultada')
    }

    const rawPayload = studentPayload as unknown as Record<string, unknown>
    if (rawPayload.privateKey !== undefined) {
      throw new Error('FALHA DE SEGURANÇA: privateKey foi exposta no payload do aluno!')
    }
    if (rawPayload.explanationMarkdown !== undefined) {
      throw new Error('FALHA DE SEGURANÇA: explanationMarkdown foi exposta antes da submissão!')
    }
  })

  // 6.7 RBAC: Content Editor e Student bloqueados de importar em massa
  await test('RBAC: content_editor e student são bloqueados de realizar importação em massa', async () => {
    const validFile = new File([JSON.stringify(DEMO_CANONICAL_PACKAGE)], 'pkg.json', {
      type: 'application/json',
    })

    let editorBlocked = false
    try {
      await ImportExportService.analyzeAndValidateFile(validFile, 'content_editor')
    } catch {
      editorBlocked = true
    }

    if (!editorBlocked) {
      throw new Error('content_editor NÃO deve ter autorização para importar em massa!')
    }

    let studentBlocked = false
    try {
      await ImportExportService.analyzeAndValidateFile(validFile, 'student')
    } catch {
      studentBlocked = true
    }

    if (!studentBlocked) {
      throw new Error('student NÃO deve ter autorização para importar em massa!')
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
