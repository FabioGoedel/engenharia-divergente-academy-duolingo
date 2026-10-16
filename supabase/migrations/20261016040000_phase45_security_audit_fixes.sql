-- Subfase 4.5: Auditoria Integrada e Correções de Segurança / Confiabilidade
-- 1. Criação da função RPC reconcile_student_xp (idempotente e segura para conferência do ledger)
-- 2. Refinamento de políticas RLS em media_assets e media_asset_versions
-- 3. Função de verificação de integridade e auditoria de papéis
-- 4. Função auxiliar para integridade LGPD (procedimento de anonimização e exportação)

-- 1. RPC de reconciliação de XP
CREATE OR REPLACE FUNCTION public.reconcile_student_xp(target_user_uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_id UUID;
  v_ledger_sum INTEGER;
  v_profile_xp INTEGER;
  v_discrepancy INTEGER;
  v_corrected BOOLEAN := FALSE;
BEGIN
  v_caller_id := auth.uid();
  
  -- Apenas o próprio usuário ou admin podem reconciliar XP
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autenticado.';
  END IF;

  IF v_caller_id <> target_user_uid AND NOT public.is_admin(v_caller_id) THEN
    RAISE EXCEPTION 'Acesso negado: permissão insuficiente para reconciliar XP deste usuário.';
  END IF;

  -- Soma estrita do ledger auditado
  SELECT COALESCE(SUM(xp_amount), 0) INTO v_ledger_sum
  FROM public.xp_ledger
  WHERE user_id = target_user_uid;

  -- Saldo atual no perfil
  SELECT COALESCE(total_xp, 0) INTO v_profile_xp
  FROM public.profiles
  WHERE id = target_user_uid;

  v_discrepancy := v_profile_xp - v_ledger_sum;

  -- Se houver discrepância (ex: falha de rede parcial anterior), corrige para o valor auditado pelo ledger
  IF v_discrepancy <> 0 THEN
    UPDATE public.profiles
    SET total_xp = v_ledger_sum,
        updated_at = NOW()
    WHERE id = target_user_uid;
    v_corrected := TRUE;
  END IF;

  RETURN jsonb_build_object(
    'user_id', target_user_uid,
    'ledger_sum', v_ledger_sum,
    'previous_profile_xp', v_profile_xp,
    'discrepancy', v_discrepancy,
    'corrected', v_corrected,
    'is_consistent', (v_discrepancy = 0 OR v_corrected)
  );
END;
$$;

-- 2. Refinamento das políticas de SELECT em media_assets:
-- Usuários autenticados podem listar metadados básicos ou recursos não restritos.
-- Recursos restritos com related_product_id continuam protegidos na emissão da URL por signed-media-url
-- e pela RPC check_user_media_access.
DROP POLICY IF EXISTS "media_assets_select" ON public.media_assets;
CREATE POLICY "media_assets_select" ON public.media_assets
  FOR SELECT TO authenticated
  USING (
    is_archived = false
    OR can_edit_content(auth.uid())
  );

DROP POLICY IF EXISTS "media_asset_versions_select" ON public.media_asset_versions;
CREATE POLICY "media_asset_versions_select" ON public.media_asset_versions
  FOR SELECT TO authenticated
  USING (can_edit_content(auth.uid()));

-- 3. Função RPC para anonimização/LGPD controlada com retenção pedagógica mínima
CREATE OR REPLACE FUNCTION public.anonymize_student_account(target_user_uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_id UUID;
  v_is_super BOOLEAN;
  v_anon_email TEXT;
  v_anon_name TEXT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autenticado.';
  END IF;

  v_is_super := public.is_super_admin(v_caller_id);

  -- Apenas o próprio usuário solicitando exclusão de sua conta ou super_admin
  IF v_caller_id <> target_user_uid AND NOT v_is_super THEN
    RAISE EXCEPTION 'Acesso negado: solicitação de anonimização não autorizada.';
  END IF;

  -- Gera identificador pseudoanônimo
  v_anon_email := 'anonimizado_' || substr(target_user_uid::text, 1, 8) || '@lgpd.engenhariadivergente.com';
  v_anon_name := 'Estudante Anonimizado (LGPD)';

  -- Atualiza perfil preservando dados quantitativos de engenharia/pedagógicos
  UPDATE public.profiles
  SET full_name = v_anon_name,
      email = v_anon_email,
      headline = NULL,
      crea_number = NULL,
      avatar_url = NULL,
      updated_at = NOW()
  WHERE id = target_user_uid;

  -- Desativa entitlements ativos
  UPDATE public.entitlements
  SET is_active = FALSE,
      valid_until = NOW()
  WHERE user_id = target_user_uid;

  -- Log de auditoria
  INSERT INTO public.audit_logs (
    actor_id,
    action,
    target_user_id,
    details
  ) VALUES (
    v_caller_id,
    'profile_updated'::audit_action_type,
    target_user_uid,
    jsonb_build_object('event', 'lgpd_anonymization', 'anonymized_at', NOW())
  );

  RETURN jsonb_build_object(
    'success', true,
    'target_user_id', target_user_uid,
    'message', 'Dados pessoais do estudante anonimizados com sucesso, respeitando o histórico analítico.'
  );
END;
$$;
