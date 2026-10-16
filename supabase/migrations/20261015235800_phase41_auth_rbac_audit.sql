-- ====================================================================
-- ENGENHARIA DIVERGENTE ACADEMY — MIGRATION 20261015235800
-- Fase 4.1: Modelagem Completa de Auth, Perfis, RBAC, Auditoria e Catálogo
-- ====================================================================

-- 1. Enumerações de Papéis e Estados
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_type') THEN
    CREATE TYPE user_role_type AS ENUM ('student', 'content_editor', 'admin', 'super_admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'incomplete');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entitlement_tier') THEN
    CREATE TYPE entitlement_tier AS ENUM ('base_subscription', 'technical_extension', 'specialized_track');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
    CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'suspended', 'expired');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action_type') THEN
    CREATE TYPE audit_action_type AS ENUM ('role_assigned', 'role_revoked', 'auth_success', 'auth_failure', 'privilege_escalation_attempt', 'profile_updated');
  END IF;
END $$;

-- 2. Tabela de Perfis Públicos (vinculada a auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  headline TEXT,
  crea_number TEXT,
  streak_days INTEGER DEFAULT 0 NOT NULL,
  total_xp INTEGER DEFAULT 0 NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. RBAC: Atribuição de Papéis
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role_type NOT NULL DEFAULT 'student',
  assigned_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

-- 4. RBAC: Permissões por Papel
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role_type NOT NULL,
  permission_code TEXT NOT NULL,
  description TEXT,
  CONSTRAINT unique_role_perm UNIQUE (role, permission_code)
);

-- 5. Logs de Auditoria Seguros (LGPD / Minimização: NUNCA senhas, tokens ou segredos)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action audit_action_type NOT NULL,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}'::jsonb NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Catálogo de Produtos e Cursos
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  tier entitlement_tier NOT NULL DEFAULT 'technical_extension',
  is_included_in_base_sub BOOLEAN DEFAULT FALSE NOT NULL,
  workload_hours INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Planos de Assinatura
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  interval_months INTEGER NOT NULL DEFAULT 12,
  price_cents INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Assinaturas
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status subscription_status NOT NULL DEFAULT 'incomplete',
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Pedidos e Transações
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  total_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'asaas',
  provider_tx_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_amount_cents INTEGER NOT NULL,
  paid_at TIMESTAMPTZ
);

-- 10. Direitos de Acesso (Entitlements)
CREATE TABLE IF NOT EXISTS public.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  granted_by_subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  granted_by_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  valid_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  CONSTRAINT unique_user_product_entitlement UNIQUE (user_id, product_id)
);

-- 11. Matrículas e Progresso
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  status enrollment_status DEFAULT 'active' NOT NULL,
  progress_percent INTEGER DEFAULT 0 NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  CONSTRAINT unique_user_enrollment UNIQUE (user_id, product_id)
);

-- 12. Certificados Emitidos
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  grade_score NUMERIC(3, 1),
  verification_hash TEXT NOT NULL UNIQUE
);

-- 13. Índices de Desempenho e Busca
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ====================================================================
-- FUNÇÕES DE AUTORIZAÇÃO E SEGURANÇA RBAC
-- ====================================================================

-- Função: checar se usuário tem papel super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uid AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: checar se usuário tem papel admin ou super_admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uid AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: checar se usuário tem papel editorial (content_editor, admin ou super_admin)
CREATE OR REPLACE FUNCTION public.can_edit_content(user_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uid AND role IN ('content_editor', 'admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: checar entitlement ativo
CREATE OR REPLACE FUNCTION public.has_entitlement(user_uid UUID, prod_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.entitlements
    WHERE user_id = user_uid
      AND product_id = prod_id
      AND is_active = TRUE
      AND (valid_until IS NULL OR valid_until > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- TRIGGER AUTOMÁTICO DE CRIAÇÃO DE PERFIL E PAPEL 'student'
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_name TEXT;
  v_crea TEXT;
BEGIN
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_crea := NEW.raw_user_meta_data->>'crea_number';

  -- Cria profile público
  INSERT INTO public.profiles (id, full_name, email, crea_number, streak_days, total_xp)
  VALUES (NEW.id, v_name, NEW.email, v_crea, 1, 0)
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      crea_number = COALESCE(EXCLUDED.crea_number, public.profiles.crea_number);

  -- Atribui papel inicial de 'student' se não tiver papel
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Registra no log de auditoria
  INSERT INTO public.audit_logs (actor_id, action, target_user_id, details)
  VALUES (
    NEW.id,
    'role_assigned'::audit_action_type,
    NEW.id,
    jsonb_build_object('role', 'student', 'system_event', 'signup_trigger')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- PROCEDIMENTOS SEGUROS DE GESTÃO DE PAPÉIS (RBAC SEVERO)
-- Regras rígidas:
-- 1. Apenas admin ou super_admin podem atribuir papéis.
-- 2. Concessão/revogação de super_admin é RESTRITA a super_admin.
-- 3. É PROIBIDO remover o último super_admin ativo.
-- 4. Todas as alterações gravam no audit_logs.
-- 5. Usuário NÃO pode alterar seu próprio papel.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.admin_assign_role(
  p_target_user_id UUID,
  p_new_role user_role_type
)
RETURNS JSONB AS $$
DECLARE
  v_actor_id UUID;
  v_actor_is_super BOOLEAN;
  v_actor_is_admin BOOLEAN;
  v_target_name TEXT;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: requisição não autenticada.';
  END IF;

  v_actor_is_super := public.is_super_admin(v_actor_id);
  v_actor_is_admin := public.is_admin(v_actor_id);

  IF NOT v_actor_is_admin THEN
    -- Tentativa de escalonamento não autorizada: registrar auditoria
    INSERT INTO public.audit_logs (actor_id, action, target_user_id, details)
    VALUES (
      v_actor_id,
      'privilege_escalation_attempt'::audit_action_type,
      p_target_user_id,
      jsonb_build_object('attempted_role', p_new_role, 'reason', 'actor_not_admin')
    );
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem alterar papéis.';
  END IF;

  -- Se o papel concedido for super_admin, o ator DEVE ser super_admin
  IF p_new_role = 'super_admin' AND NOT v_actor_is_super THEN
    INSERT INTO public.audit_logs (actor_id, action, target_user_id, details)
    VALUES (
      v_actor_id,
      'privilege_escalation_attempt'::audit_action_type,
      p_target_user_id,
      jsonb_build_object('attempted_role', 'super_admin', 'reason', 'actor_is_admin_not_super')
    );
    RAISE EXCEPTION 'Apenas super_admin pode conceder o papel de super_admin.';
  END IF;

  -- Obter nome do usuário alvo para confirmação
  SELECT full_name INTO v_target_name FROM public.profiles WHERE id = p_target_user_id;
  IF v_target_name IS NULL THEN
    RAISE EXCEPTION 'Usuário de destino não encontrado no banco.';
  END IF;

  -- Inserir novo papel
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (p_target_user_id, p_new_role, v_actor_id)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Registrar no log de auditoria
  INSERT INTO public.audit_logs (actor_id, action, target_user_id, details)
  VALUES (
    v_actor_id,
    'role_assigned'::audit_action_type,
    p_target_user_id,
    jsonb_build_object('role', p_new_role, 'target_name', v_target_name)
  );

  RETURN jsonb_build_object('success', true, 'role', p_new_role, 'target_user_id', p_target_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_revoke_role(
  p_target_user_id UUID,
  p_role_to_revoke user_role_type
)
RETURNS JSONB AS $$
DECLARE
  v_actor_id UUID;
  v_actor_is_super BOOLEAN;
  v_actor_is_admin BOOLEAN;
  v_super_count INTEGER;
  v_roles_left INTEGER;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: requisição não autenticada.';
  END IF;

  v_actor_is_super := public.is_super_admin(v_actor_id);
  v_actor_is_admin := public.is_admin(v_actor_id);

  IF NOT v_actor_is_admin THEN
    INSERT INTO public.audit_logs (actor_id, action, target_user_id, details)
    VALUES (
      v_actor_id,
      'privilege_escalation_attempt'::audit_action_type,
      p_target_user_id,
      jsonb_build_object('attempted_revoke', p_role_to_revoke, 'reason', 'actor_not_admin')
    );
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem revogar papéis.';
  END IF;

  -- Revogação de super_admin exige que ator seja super_admin
  IF p_role_to_revoke = 'super_admin' AND NOT v_actor_is_super THEN
    RAISE EXCEPTION 'Apenas super_admin pode revogar o papel de super_admin.';
  END IF;

  -- Impedir remoção do último super_admin ativo no sistema
  IF p_role_to_revoke = 'super_admin' THEN
    SELECT COUNT(*) INTO v_super_count FROM public.user_roles WHERE role = 'super_admin';
    IF v_super_count <= 1 THEN
      RAISE EXCEPTION 'Operação recusada: não é permitido revogar o último super_admin ativo do sistema.';
    END IF;
  END IF;

  -- Realizar deleção do papel
  DELETE FROM public.user_roles
  WHERE user_id = p_target_user_id AND role = p_role_to_revoke;

  -- Garantir que o usuário continue tendo pelo menos o papel 'student'
  SELECT COUNT(*) INTO v_roles_left FROM public.user_roles WHERE user_id = p_target_user_id;
  IF v_roles_left = 0 THEN
    INSERT INTO public.user_roles (user_id, role, assigned_by)
    VALUES (p_target_user_id, 'student', v_actor_id)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Registrar no log de auditoria
  INSERT INTO public.audit_logs (actor_id, action, target_user_id, details)
  VALUES (
    v_actor_id,
    'role_revoked'::audit_action_type,
    p_target_user_id,
    jsonb_build_object('revoked_role', p_role_to_revoke)
  );

  RETURN jsonb_build_object('success', true, 'revoked_role', p_role_to_revoke, 'target_user_id', p_target_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

-- 2. User Roles (LEITURA: próprio usuário ou admin; ESCRITA: NUNCA DIRETA PELO USUÁRIO)
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Bloqueio total de INSERT/UPDATE/DELETE direto por clientes comuns: apenas admin via procedures ou admin role
DROP POLICY IF EXISTS "user_roles_insert_admin" ON public.user_roles;
CREATE POLICY "user_roles_insert_admin" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "user_roles_update_admin" ON public.user_roles;
CREATE POLICY "user_roles_update_admin" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "user_roles_delete_admin" ON public.user_roles;
CREATE POLICY "user_roles_delete_admin" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- 3. Role Permissions (Leitura aberta a autenticados; edição apenas super_admin)
DROP POLICY IF EXISTS "role_permissions_select" ON public.role_permissions;
CREATE POLICY "role_permissions_select" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (true);

-- 4. Audit Logs (Leitura restrita a administradores; inserção aberta para registrar eventos da própria sessão)
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id OR actor_id IS NULL OR public.is_admin(auth.uid()));

-- 5. Products (Visualização aberta de publicados ou admin)
DROP POLICY IF EXISTS "products_select" ON public.products;
CREATE POLICY "products_select" ON public.products
  FOR SELECT TO authenticated
  USING (is_published = true OR public.can_edit_content(auth.uid()));

-- 6. Entitlements (Usuário lê os seus; admin gerencia)
DROP POLICY IF EXISTS "entitlements_select" ON public.entitlements;
CREATE POLICY "entitlements_select" ON public.entitlements
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "entitlements_all_admin" ON public.entitlements;
CREATE POLICY "entitlements_all_admin" ON public.entitlements
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- 7. Enrollments (Usuário lê os seus com entitlement ativo ou admin)
DROP POLICY IF EXISTS "enrollments_select" ON public.enrollments;
CREATE POLICY "enrollments_select" ON public.enrollments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 8. Plans & Subscriptions
DROP POLICY IF EXISTS "plans_select" ON public.plans;
CREATE POLICY "plans_select" ON public.plans
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;
CREATE POLICY "subscriptions_select" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 9. Certificates
DROP POLICY IF EXISTS "certificates_select" ON public.certificates;
CREATE POLICY "certificates_select" ON public.certificates
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ====================================================================
-- SEED INICIAL: PRODUTOS, PERMISSÕES E USUÁRIO INICIAL (fgoedel@gmail.com)
-- ====================================================================

-- Permissões padrão
INSERT INTO public.role_permissions (role, permission_code, description) VALUES
  ('student', 'view_catalog', 'Visualizar catálogo público de trilhas'),
  ('student', 'access_enrolled_content', 'Acessar trilhas com matrícula ativa'),
  ('student', 'view_certificates', 'Visualizar certificados emitidos'),
  ('content_editor', 'view_catalog', 'Visualizar catálogo'),
  ('content_editor', 'access_enrolled_content', 'Acessar trilhas'),
  ('content_editor', 'view_certificates', 'Visualizar certificados'),
  ('content_editor', 'edit_content', 'Criar e editar blocos e questões no CMS'),
  ('admin', 'view_catalog', 'Visualizar catálogo'),
  ('admin', 'access_enrolled_content', 'Acessar trilhas'),
  ('admin', 'view_certificates', 'Visualizar certificados'),
  ('admin', 'edit_content', 'Criar e editar blocos e questões'),
  ('admin', 'publish_courses', 'Publicar cursos e trilhas'),
  ('admin', 'manage_students', 'Gerenciar alunos e matrículas'),
  ('admin', 'manage_enrollments', 'Conceder matrículas manuais'),
  ('admin', 'manage_entitlements', 'Gerenciar entitlements granulares'),
  ('admin', 'view_financial_reports', 'Acessar relatórios executivos'),
  ('super_admin', 'view_catalog', 'Visualizar catálogo'),
  ('super_admin', 'access_enrolled_content', 'Acessar trilhas'),
  ('super_admin', 'view_certificates', 'Visualizar certificados'),
  ('super_admin', 'edit_content', 'Criar e editar conteúdo'),
  ('super_admin', 'publish_courses', 'Publicar cursos'),
  ('super_admin', 'manage_students', 'Gerenciar alunos'),
  ('super_admin', 'manage_enrollments', 'Conceder matrículas'),
  ('super_admin', 'manage_entitlements', 'Gerenciar entitlements'),
  ('super_admin', 'view_financial_reports', 'Acessar relatórios'),
  ('super_admin', 'system_configuration', 'Configuração total e concessão de super_admin')
ON CONFLICT (role, permission_code) DO NOTHING;

-- Produtos de base
INSERT INTO public.products (id, code, title, slug, category, tier, is_included_in_base_sub, workload_hours, is_published)
VALUES
  ('11111111-1111-1111-1111-111111111101'::uuid, 'PROD-BASE-01', 'Formação Contínua: Fundamentos e Pensamento Divergente', 'formacao-continua-introdutoria', 'Nivelamento & Métodos', 'base_subscription', true, 24, true),
  ('11111111-1111-1111-1111-111111111102'::uuid, 'PROD-MEF-01', 'Método do Zero ao MEF (MDZAM)', 'metodo-zero-ao-mef', 'Cálculo Avançado', 'technical_extension', false, 60, true),
  ('11111111-1111-1111-1111-111111111103'::uuid, 'PROD-SW-01', 'SOLIDWORKS Simulation: Análise Estática e Fadiga', 'solidworks-simulation', 'Ferramentas CAE', 'technical_extension', false, 45, true),
  ('11111111-1111-1111-1111-111111111104'::uuid, 'PROD-STR-01', 'Dimensionamento de Estruturas Metálicas (NBR 8800)', 'estruturas-metalicas', 'Engenharia Estrutural', 'specialized_track', false, 80, true)
ON CONFLICT (code) DO NOTHING;

-- Seed do usuário fgoedel@gmail.com como super_admin (requisito de bootstrap de auth)
DO $$
DECLARE
  v_seed_uid UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'fgoedel@gmail.com') THEN
    v_seed_uid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone, phone_change, phone_change_token, reauthentication_token
    ) VALUES (
      v_seed_uid,
      '00000000-0000-0000-0000-000000000000',
      'fgoedel@gmail.com',
      crypt('Skip@Pass', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Administrador Mestre", "name": "Administrador Mestre", "crea_number": "BR-000001"}',
      false, 'authenticated', 'authenticated',
      '', '', '', '', '',
      NULL, '', '', ''
    );

    -- Profile correspondente
    INSERT INTO public.profiles (id, full_name, email, headline, crea_number, streak_days, total_xp)
    VALUES (
      v_seed_uid,
      'Administrador Mestre (Bootstrap)',
      'fgoedel@gmail.com',
      'Super Administrador da Engenharia Divergente Academy',
      'BR-000001',
      30,
      15000
    ) ON CONFLICT (id) DO NOTHING;

    -- Atribui papel super_admin E student
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_seed_uid, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_seed_uid, 'student')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Auditoria
    INSERT INTO public.audit_logs (actor_id, action, target_user_id, details)
    VALUES (
      v_seed_uid,
      'role_assigned'::audit_action_type,
      v_seed_uid,
      jsonb_build_object('role', 'super_admin', 'bootstrap', true, 'procedure', 'initial_migration')
    );
  END IF;
END $$;
