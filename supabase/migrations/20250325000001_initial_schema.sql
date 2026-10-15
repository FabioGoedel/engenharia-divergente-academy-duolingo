-- ====================================================================
-- ENGENHARIA DIVERGENTE ACADEMY — MIGRATION 0001 (FASE 1)
-- Modelagem de Autenticação, RBAC, Produtos, Entitlements e RLS
--
-- STATUS: PENDENTE de aplicação (banco de dados real não conectado nesta fase).
-- Quando o Supabase for plugado, executar este script como primeira migração.
-- ====================================================================

-- 1. Enumerações de Papéis e Estados
CREATE TYPE user_role_type AS ENUM ('student', 'content_editor', 'admin', 'super_admin');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'incomplete');
CREATE TYPE entitlement_tier AS ENUM ('base_subscription', 'technical_extension', 'specialized_track');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'suspended', 'expired');

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

-- 5. Catálogo de Produtos e Cursos
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

-- 6. Planos de Assinatura
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  interval_months INTEGER NOT NULL DEFAULT 12,
  price_cents INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Assinaturas
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

-- 8. Pedidos e Transações
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

-- 9. Direitos de Acesso (Entitlements)
-- Regra de negócio fundamental: a assinatura anual NÃO libera todos os produtos.
-- O acesso exige registro explícito nesta tabela.
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

-- 10. Matrículas e Progresso
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

-- 11. Certificados Emitidos
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  grade_score NUMERIC(3, 1),
  verification_hash TEXT NOT NULL UNIQUE
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Funções auxiliares de checagem RBAC
CREATE OR REPLACE FUNCTION public.is_admin(user_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uid AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Políticas de Profiles
CREATE POLICY "Usuário lê próprio perfil ou administradores leem todos"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Usuário edita próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Políticas de Entitlements
CREATE POLICY "Usuário lê seus próprios direitos de acesso"
  ON public.entitlements FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Apenas admin modifica direitos de acesso"
  ON public.entitlements FOR ALL
  USING (public.is_admin(auth.uid()));

-- Políticas de Matrículas e Cursos
CREATE POLICY "Cursos publicados são visíveis por autenticados"
  ON public.products FOR SELECT
  USING (is_published = TRUE OR public.is_admin(auth.uid()));

CREATE POLICY "Acesso ao conteúdo de curso exige entitlement ativo"
  ON public.enrollments FOR SELECT
  USING (
    (auth.uid() = user_id AND public.has_entitlement(auth.uid(), product_id))
    OR public.is_admin(auth.uid())
  );

-- Comentário final
COMMENT ON TABLE public.entitlements IS
  'Tabela central de acesso granular. Assinatura base anual NÃO concede acesso automático a especializações avançadas.';
