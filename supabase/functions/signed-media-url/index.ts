import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface SignedUrlRequest {
  assetId: string
  action?: 'view' | 'download'
  expiresInSeconds?: number
}

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
  } catch (_err) {
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
    const jwtCheck = validateJwtStructure(token)
    if (!jwtCheck.valid) {
      return new Response(
        JSON.stringify({ error: jwtCheck.error || 'Token JWT inválido ou expirado.' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    // 1. Contexto do usuário autenticado
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Sessão do usuário não autenticada no Supabase.' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    // 2. Cliente administrativo com SERVICE_ROLE
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    let body: SignedUrlRequest
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Payload JSON inválido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const { assetId, action = 'view', expiresInSeconds = 3600 } = body
    if (!assetId) {
      return new Response(JSON.stringify({ error: 'assetId é obrigatório.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Limite de validade da URL assinada (mínimo 60s, máximo 86400s)
    const validExpiresIn = Math.min(Math.max(60, expiresInSeconds), 86400)

    // 3. Busca o ativo de mídia
    const { data: asset, error: assetErr } = await adminClient
      .from('media_assets')
      .select('*')
      .eq('id', assetId)
      .single()

    if (assetErr || !asset) {
      return new Response(JSON.stringify({ error: 'Ativo de mídia não localizado.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // 4. Se a mídia é externa (YouTube, Vimeo, url externa), retorna com proteção proporcional
    if (
      asset.provider === 'youtube' ||
      asset.provider === 'vimeo' ||
      asset.provider === 'external_url'
    ) {
      // Verifica autorização de matrícula para a mídia externa se exigir entitlement
      const requiresEntitlement = Boolean(asset.access_rules?.requires_entitlement)
      if (requiresEntitlement) {
        const { data: hasAccess } = await adminClient.rpc('check_user_media_access', {
          user_uid: user.id,
          asset_uid: assetId,
        })

        if (!hasAccess) {
          return new Response(
            JSON.stringify({
              error:
                'Acesso negado: você não possui matrícula ativa para este conteúdo especializado.',
              requiresPurchase: true,
              relatedProductId: asset.related_product_id,
            }),
            { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
          )
        }
      }

      return new Response(
        JSON.stringify({
          assetId: asset.id,
          provider: asset.provider,
          url: asset.public_url,
          signed: false,
          isExternal: true,
          expiresIn: null,
          title: asset.title,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    // 5. Para mídias armazenadas no Supabase Storage:
    // Verifica rigorosamente autorização do aluno via RPC no banco
    const { data: hasAccess, error: accessErr } = await adminClient.rpc('check_user_media_access', {
      user_uid: user.id,
      asset_uid: assetId,
    })

    if (accessErr) {
      console.error('Erro na RPC check_user_media_access:', accessErr)
      return new Response(JSON.stringify({ error: 'Erro ao verificar permissões de acesso.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    if (!hasAccess) {
      return new Response(
        JSON.stringify({
          error:
            'Acesso negado: matrícula ou assinatura necessária para acessar este material protegido.',
          requiresPurchase: true,
          relatedProductId: asset.related_product_id,
        }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const bucketName = asset.storage_bucket || 'protected_materials'
    const storagePath = asset.storage_path || asset.external_id

    if (!storagePath) {
      return new Response(
        JSON.stringify({ error: 'Caminho do arquivo não configurado no Storage.' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    // 6. Gera URL assinada temporária usando o Storage Admin
    const downloadOptions =
      action === 'download' && asset.original_filename
        ? { download: asset.original_filename }
        : undefined

    const { data: signedData, error: signedErr } = await adminClient.storage
      .from(bucketName)
      .createSignedUrl(storagePath, validExpiresIn, downloadOptions)

    if (signedErr || !signedData?.signedUrl) {
      console.error('Falha ao gerar URL assinada:', signedErr)
      return new Response(
        JSON.stringify({ error: `Falha ao gerar URL temporária: ${signedErr?.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    // 7. Registra log de auditoria/telemetria no PostgreSQL
    await adminClient.from('material_access_logs').insert({
      user_id: user.id,
      asset_id: assetId,
      product_id: asset.related_product_id,
      action_type: action === 'download' ? 'download' : 'signed_url_generated',
      metadata: {
        bucket: bucketName,
        path: storagePath,
        ip: req.headers.get('x-forwarded-for') || 'edge',
        user_agent: req.headers.get('user-agent'),
      },
    })

    return new Response(
      JSON.stringify({
        assetId: asset.id,
        signedUrl: signedData.signedUrl,
        expiresIn: validExpiresIn,
        bucket: bucketName,
        title: asset.title,
        mimeType: asset.mime_type,
        action,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  } catch (err: any) {
    console.error('Exceção em signed-media-url:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Erro interno ao processar URL assinada.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  }
})
