import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface SubmissionPayload {
  attemptId: string
  exerciseId: string
  studentAnswer: {
    selectedOptionIds?: string[]
    numericValue?: string | number
    choiceId?: string
    notes?: string
    stepOrder?: string[]
  }
  hintsUsedCount?: number
  perceivedDifficulty?: 1 | 2 | 3 | 4 | 5
  guessed?: boolean
  activeSeconds?: number
  formulaWasHidden?: boolean
}

function parseBrazilianNumericInput(val: unknown): number | null {
  if (val === null || val === undefined) return null
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : null
  }
  const raw = String(val).trim()
  if (!raw) return null

  // Substitui separadores padrão pt-BR
  let cleaned = raw.replace(/\s+/g, '')
  if (cleaned.includes(',') && cleaned.includes('.')) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.')
  }

  const num = Number(cleaned)
  return Number.isFinite(num) ? num : null
}

/**
 * Validação estrutural de JWT (Header.Payload.Signature)
 */
function validateJwtStructure(jwt: string): { valid: boolean; error?: string; payload?: any } {
  const parts = jwt.split('.')
  if (parts.length !== 3) {
    return { valid: false, error: 'Token JWT malformado (deve conter 3 segmentos).' }
  }

  try {
    const rawPayload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(rawPayload)
    const now = Math.floor(Date.now() / 1000)

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token JWT expirado.' }
    }

    return { valid: true, payload }
  } catch (err: any) {
    return { valid: false, error: 'Decodificação do payload JWT falhou.' }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Autorização ausente. Cabeçalho Bearer token é obrigatório.' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token de autenticação vazio.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // 1. Validação estrita de formato e expiração antes de repassar
    const jwtCheck = validateJwtStructure(token)
    if (!jwtCheck.valid) {
      return new Response(
        JSON.stringify({ error: jwtCheck.error || 'Token JWT inválido ou expirado.' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    // 2. Cliente com contexto do usuário autenticado no Supabase Auth oficial
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Assinatura ou autenticação do token rejeitada pelo Supabase Auth.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    // 3. Cliente admin com SERVICE_ROLE para acessar gabarito privado de forma segura
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    let body: SubmissionPayload
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Payload JSON inválido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const {
      attemptId,
      exerciseId,
      studentAnswer,
      hintsUsedCount = 0,
      perceivedDifficulty,
      guessed = false,
      activeSeconds = 0,
      formulaWasHidden = false,
    } = body

    if (!attemptId || !exerciseId || !studentAnswer) {
      return new Response(
        JSON.stringify({
          error: 'Parâmetros inválidos: attemptId, exerciseId e studentAnswer são obrigatórios.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    // 4. Busca a tentativa e verifica a propriedade contra user.id REAL do JWT verificado
    const { data: attempt, error: attemptErr } = await adminClient
      .from('activity_attempts')
      .select('*')
      .eq('id', attemptId)
      .single()

    if (attemptErr || !attempt) {
      return new Response(JSON.stringify({ error: 'Tentativa não encontrada.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // NUNCA confiar em user_id do cliente: compara exclusivamente com user.id autenticado
    if (attempt.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado: a tentativa pertence a outro aluno.' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    // 5. Busca a questão no banco de questões ou em snapshots de versão
    let questionRow: any = null

    // Procura por external_id ou id direto
    const { data: qByExt } = await adminClient
      .from('question_bank')
      .select('*')
      .or(`external_id.eq.${exerciseId},id.eq.${exerciseId}`)
      .limit(1)
      .maybeSingle()

    if (qByExt) {
      questionRow = qByExt
    } else {
      // Mapeamento canônico da missão de vigas (ex-bb-01 -> RESMAT-FLEX-01-CONC, etc.)
      const canonicalMap: Record<string, string> = {
        'ex-bb-01': 'RESMAT-FLEX-01-CONC',
        'ex-bb-02': 'RESMAT-FLEX-02-NUM',
        'ex-bb-03': 'RESMAT-FLEX-03-DEF',
        'ex-bb-04': 'RESMAT-FLEX-04-VIS',
        'ex-bb-05': 'RESMAT-FLEX-05-DEC',
      }
      const mappedExtId = canonicalMap[exerciseId]
      if (mappedExtId) {
        const { data: qMapped } = await adminClient
          .from('question_bank')
          .select('*')
          .eq('external_id', mappedExtId)
          .single()
        questionRow = qMapped
      }
    }

    if (!questionRow) {
      return new Response(
        JSON.stringify({ error: `Exercício "${exerciseId}" não localizado no catálogo.` }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    // 6. Respeita versão imutável vinculada: se question_versions tiver snapshot da versão exata usada
    let privateKey = (questionRow.private_key_json as any) || {}
    let questionVersion = questionRow.version || 1

    if (attempt.activity_version && attempt.activity_version !== questionRow.version) {
      const { data: qv } = await adminClient
        .from('question_versions')
        .select('*')
        .eq('question_id', questionRow.id)
        .eq('version_number', attempt.activity_version)
        .maybeSingle()

      if (qv && qv.snapshot && qv.snapshot.private_key_json) {
        privateKey = qv.snapshot.private_key_json
        questionVersion = qv.version_number
      }
    }

    let isCorrect = false
    let scorePercent = 0
    let feedbackRationale: string | undefined = undefined
    let numericDetails: any = undefined

    // 7. Regras canônicas de correção server-side por tipo
    const qType = questionRow.question_type

    if (qType === 'single_choice' || qType === 'multiple_choice' || qType === 'true_false') {
      const selectedId = studentAnswer.selectedOptionIds?.[0] || studentAnswer.choiceId
      const expectedId = privateKey.correctOptionIds?.[0]
      isCorrect = Boolean(selectedId && selectedId === expectedId)
      scorePercent = isCorrect ? 100 : 0

      if (selectedId && privateKey.distractorRationales) {
        feedbackRationale = privateKey.distractorRationales[selectedId]
      }
    } else if (qType === 'numeric_response') {
      const parsedValue = parseBrazilianNumericInput(studentAnswer.numericValue)
      const expected = privateKey.numericExpectedValue ?? 0
      const tolAbs = privateKey.numericToleranceAbs ?? questionRow.numeric_tolerance_abs ?? 0.5
      const tolRel = privateKey.numericToleranceRel ?? questionRow.numeric_tolerance_rel ?? 2.0

      if (parsedValue !== null) {
        const diff = Math.abs(parsedValue - expected)
        const relDiff = expected !== 0 ? (diff / Math.abs(expected)) * 100 : 0
        isCorrect = diff <= tolAbs || relDiff <= tolRel
        scorePercent = isCorrect ? 100 : 0
        numericDetails = {
          expected,
          tolerance: tolAbs,
          unit: questionRow.numeric_unit || privateKey.numericUnit,
          userParsedValue: parsedValue,
        }
      } else {
        isCorrect = false
        scorePercent = 0
        numericDetails = {
          expected,
          tolerance: tolAbs,
          unit: questionRow.numeric_unit || privateKey.numericUnit,
        }
      }
    } else if (qType === 'ordered_steps') {
      const userOrder = studentAnswer.stepOrder || []
      const expectedOrder = privateKey.correctStepOrder || []
      isCorrect =
        userOrder.length === expectedOrder.length &&
        userOrder.every((id: string, idx: number) => id === expectedOrder[idx])
      scorePercent = isCorrect ? 100 : 0
    }

    // 8. Cálculo determinístico de XP
    const baseXp = questionRow.xp_reward || 20
    const hintPenalty = hintsUsedCount * 5
    const xpToAward = isCorrect ? Math.max(5, baseXp - hintPenalty) : 0
    const xpReason = `exercise_completion_${exerciseId}`

    const gradeResult = {
      isCorrect,
      scorePercent,
      xpEarned: isCorrect ? xpToAward : 0,
      explanationMarkdown: questionRow.explanation_markdown || privateKey.explanationMarkdown || '',
      feedbackRationale,
      numericDetails,
      correctOptionIds: privateKey.correctOptionIds,
      evaluatedAtVersion: questionVersion,
    }

    // 9. Verifica se conclui a missão
    const { data: previousAnswers } = await adminClient
      .from('attempt_answers')
      .select('exercise_id, is_correct')
      .eq('attempt_id', attemptId)

    const completedExSet = new Set<string>()
    ;(previousAnswers || []).forEach((a) => {
      if (a.is_correct) completedExSet.add(a.exercise_id)
    })
    if (isCorrect) completedExSet.add(exerciseId)

    const isMissionCompleted = completedExSet.size >= 5

    // 10. Persistência atômica via RPC PostgreSQL
    const assistanceDegree =
      hintsUsedCount > 0 ? `hints_${hintsUsedCount}` : formulaWasHidden ? 'autonomous' : 'standard'

    const { data: evalResult, error: evalErr } = await adminClient.rpc(
      'record_exercise_evaluation',
      {
        p_attempt_id: attemptId,
        p_exercise_id: exerciseId,
        p_exercise_version: questionVersion,
        p_student_answer: studentAnswer,
        p_is_correct: isCorrect,
        p_score_percent: scorePercent,
        p_hints_used_count: hintsUsedCount,
        p_perceived_difficulty: perceivedDifficulty ?? null,
        p_guessed: guessed,
        p_active_seconds: activeSeconds,
        p_formula_was_hidden: formulaWasHidden,
        p_assistance_degree: assistanceDegree,
        p_competency_code: questionRow.competency_code || 'COMP-GENERIC',
        p_grade_result: gradeResult,
        p_xp_to_award: isCorrect ? xpToAward : 0,
        p_xp_reason: xpReason,
        p_is_mission_completed: isMissionCompleted,
      },
    )

    if (evalErr) {
      console.error('Erro na RPC record_exercise_evaluation:', evalErr)
      return new Response(
        JSON.stringify({ error: `Falha ao persistir avaliação atômica: ${evalErr.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    return new Response(
      JSON.stringify({
        gradeResult,
        evaluation: evalResult,
        xpAwardedInThisAction: evalResult?.xp_awarded_in_action ?? 0,
        isMissionCompleted,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  } catch (err: any) {
    console.error('Exceção em evaluate-submission:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Erro interno no servidor de correção.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }
})
