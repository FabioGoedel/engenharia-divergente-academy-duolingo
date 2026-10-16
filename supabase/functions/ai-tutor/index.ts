import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface AiTutorRequestBody {
  exerciseId?: string
  competencyCode?: string
  studentQuestion: string
  mode?: 'study_mode' | 'hint_mode' | 'assessment_mode' | 'post_answer_review'
  assistanceStage?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') // Checa se existe sem forçar mock

    // 1. Validação de autenticação obrigatória
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({
          error: 'Autorização ausente. Cabeçalho Bearer token é obrigatório.',
          available: false,
        }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

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
          error: 'Token JWT inválido ou sessão expirada.',
          available: false,
        }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    // 2. Consulta configuração do Tutor no banco (adminClient com service role)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const { data: tutorConfig } = await adminClient
      .from('ai_tutor_config')
      .select('*')
      .eq('id', 'default_tutor_config')
      .maybeSingle()

    const isEnabled = tutorConfig?.is_enabled ?? false

    // 3. Regra Mandatória: se desabilitado ou sem chave externa, NÃO simular. Exibir estado real de indisponibilidade!
    if (!isEnabled || !openaiApiKey) {
      const reason = !openaiApiKey
        ? 'Provedor de LLM externo não possui chave de API configurada no ambiente seguro do servidor (OPENAI_API_KEY ausente).'
        : 'O Tutor de IA está temporariamente desativado pelo corpo editorial da Engenharia Divergente.'

      return new Response(
        JSON.stringify({
          available: false,
          isBlockedByCredentials: !openaiApiKey,
          reason,
          provider: tutorConfig?.provider || 'openai',
          model: tutorConfig?.model_name || 'gpt-4o-mini',
          disclaimer:
            'A Engenharia Divergente Academy não improvisa respostas automatizadas nem expõe dados sensíveis quando os provedores de inteligência artificial estão indisponíveis.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    let body: AiTutorRequestBody
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Payload JSON inválido.', available: false }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const {
      exerciseId,
      competencyCode,
      studentQuestion,
      mode = 'study_mode',
      assistanceStage,
    } = body

    if (!studentQuestion || !studentQuestion.trim()) {
      return new Response(
        JSON.stringify({ error: 'A pergunta do aluno não pode ser vazia.', available: true }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    // 4. Checa limite de uso por aluno por dia
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { count: usageToday } = await adminClient
      .from('ai_tutor_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString())

    const maxDaily = tutorConfig?.max_questions_per_student_per_day || 25
    if ((usageToday || 0) >= maxDaily) {
      return new Response(
        JSON.stringify({
          available: false,
          quotaExceeded: true,
          reason: `Você atingiu o limite pedagógico diário de ${maxDaily} interações com o Tutor de IA. Pratique a resolução independente ou retorne amanhã.`,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    // 5. Coleta contexto estritamente autorizado (NUNCA incluir private_key_json ou segredos)
    let exerciseContext: any = null
    if (exerciseId) {
      const { data: qRow } = await adminClient
        .from('question_bank')
        .select(
          'id, external_id, title, question_type, subject_area, competency_code, prompt_markdown, options, hint, explanation_markdown, numeric_unit',
        )
        .or(`external_id.eq.${exerciseId},id.eq.${exerciseId}`)
        .maybeSingle()

      if (qRow) {
        // Redige explicitamente qualquer menção à resposta correta nos options se for modo avaliativo
        const safeOptions = (qRow.options as any[] | null)?.map((opt: any) => ({
          id: opt.id,
          text: opt.text,
        }))

        exerciseContext = {
          title: qRow.title,
          subject: qRow.subject_area,
          competency: qRow.competency_code,
          prompt: qRow.prompt_markdown,
          options: safeOptions,
          hint: qRow.hint,
          unit: qRow.numeric_unit,
          // Em modo de avaliação durante a questão, a explicação detalhada não é compartilhada
          explanation: mode === 'post_answer_review' ? qRow.explanation_markdown : undefined,
        }
      }
    }

    // 6. Chamada real à API OpenAI com validação server-side
    const systemPrompt = `
${tutorConfig?.pedagogical_instructions || 'Você é o Tutor de IA da Engenharia Divergente Academy.'}

MODO PEDAGÓGICO ATUAL: ${mode}
ESTÁGIO DE ASSISTÊNCIA DO ALUNO: ${assistanceStage || 'stage_3_retrieval_with_hints'}
COMPETÊNCIA ALVO: ${competencyCode || exerciseContext?.competency || 'Engenharia Estrutural / Mecânica dos Sólidos'}

DIRETRIZES FUNDAMENTAIS DE SEGURANÇA E DIDÁTICA:
1. Jamais forneça o gabarito direto ou o resultado numérico final. O aluno deve chegar à resposta por dedução e cálculo.
2. Explique os princípios físicos e equações fundamentais (ex.: Teoria de Vigas de Euler-Bernoulli, Tensões Normais σ = M*y/I, momento de inércia, módulos de elasticidade).
3. Seja sóbrio, objetivo e técnico. Evite elogios condescendentes ou clichês vazios.
4. Lembre que sua função é apoio explicativo, não aprovação técnica de projetos reais de engenharia.
5. Se o aluno pedir para "dar a resposta", recuse educadamente e proponha o primeiro passo investigativo.
`.trim()

    const userMessageContent = `
Contexto do Exercício Autorizado:
${exerciseContext ? JSON.stringify(exerciseContext, null, 2) : 'Dúvida conceitual geral de engenharia'}

Pergunta do Aluno:
"${studentQuestion}"
`.trim()

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: tutorConfig?.model_name || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessageContent },
        ],
        temperature: 0.3,
        max_tokens: 600,
      }),
    })

    if (!aiRes.ok) {
      const errText = await aiRes.text()
      console.error('Falha na API OpenAI:', errText)
      return new Response(
        JSON.stringify({
          available: false,
          reason: 'Falha na comunicação com o provedor de inteligência artificial externo.',
          details: errText,
        }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const aiData = await aiRes.json()
    const responseText =
      aiData.choices?.[0]?.message?.content ||
      'Não foi possível obter uma resposta do modelo no momento.'
    const tokensPrompt = aiData.usage?.prompt_tokens || 0
    const tokensCompletion = aiData.usage?.completion_tokens || 0

    // 7. Salva a conversa para auditoria, custo e histórico pedagógico
    await adminClient.from('ai_tutor_conversations').insert({
      user_id: user.id,
      exercise_id: exerciseId || null,
      competency_code: competencyCode || exerciseContext?.competency || null,
      mode,
      prompt_message: studentQuestion,
      response_message: responseText,
      authorized_context_used: {
        hasExerciseContext: Boolean(exerciseContext),
        assistanceStage,
      },
      is_private_key_redacted: true,
      tokens_prompt: tokensPrompt,
      tokens_completion: tokensCompletion,
    })

    // Atualiza contadores globais de consumo
    await adminClient
      .from('ai_tutor_config')
      .update({
        total_tokens_consumed:
          (tutorConfig?.total_tokens_consumed || 0) + (tokensPrompt + tokensCompletion),
        total_requests_count: (tutorConfig?.total_requests_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'default_tutor_config')

    return new Response(
      JSON.stringify({
        available: true,
        response: responseText,
        mode,
        disclaimer:
          'O Tutor de IA é um recurso explicativo complementar e não substitui a validação de cálculos por engenheiro responsável.',
        tokensUsed: tokensPrompt + tokensCompletion,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  } catch (err: any) {
    console.error('Exceção no ai-tutor:', err)
    return new Response(
      JSON.stringify({
        available: false,
        error: err.message || 'Erro inesperado na execução do Tutor de IA.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }
})
