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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autorização ausente. Cabeçalho Authorization obrigatório.' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    // Cliente com contexto do usuário autenticado para validação de identidade
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado no Supabase.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Cliente admin com SERVICE_ROLE para acessar gabarito privado de forma segura
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const body: SubmissionPayload = await req.json()
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

    // 1. Busca a tentativa e verifica a propriedade
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

    if (attempt.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado: a tentativa pertence a outro aluno.' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    // 2. Busca a questão no banco de questões para ler chave privada de correção
    // Tenta primeiro por external_id correspondente ou id direto
    let questionRow: any = null
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

    const privateKey = (questionRow.private_key_json as any) || {}
    let isCorrect = false
    let scorePercent = 0
    let feedbackRationale: string | undefined = undefined
    let numericDetails: any = undefined

    // 3. Regras canônicas de correção server-side por tipo
    const qType = questionRow.question_type

    if (qType === 'single_choice' || qType === 'multiple_choice') {
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
    }

    // 4. Cálculo determinístico de XP
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
    }

    // 5. Verifica se esta submissão conclui a missão
    // Busca todas as respostas da tentativa
    const { data: previousAnswers } = await adminClient
      .from('attempt_answers')
      .select('exercise_id, is_correct')
      .eq('attempt_id', attemptId)

    const completedExSet = new Set<string>()
    ;(previousAnswers || []).forEach((a) => {
      if (a.is_correct) completedExSet.add(a.exercise_id)
    })
    if (isCorrect) completedExSet.add(exerciseId)

    // Na missão MDZAM são 5 exercícios canônicos
    const isMissionCompleted = completedExSet.size >= 5

    // 6. Chamada à função atômica PostgreSQL SECURITY DEFINER
    const assistanceDegree =
      hintsUsedCount > 0 ? `hints_${hintsUsedCount}` : formulaWasHidden ? 'autonomous' : 'standard'

    const { data: evalResult, error: evalErr } = await adminClient.rpc(
      'record_exercise_evaluation',
      {
        p_attempt_id: attemptId,
        p_exercise_id: exerciseId,
        p_exercise_version: questionRow.version || 1,
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
