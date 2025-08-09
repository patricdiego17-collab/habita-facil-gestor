
-- 1) Garantir coluna role na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text;

-- Definir default 'citizen' (antes do backfill para evitar nulls em novos inserts)
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'citizen';

-- 2) Atualizar função handle_new_user para preencher role a partir do metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'role', ''), 'citizen')
  );
  RETURN NEW;
END;
$function$;

-- 3) Criar trigger para popular profiles em novos usuários (somente se ainda não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END;
$$;

-- 4) Backfill: inserir profiles que faltam, usando o role do metadata quando houver
INSERT INTO public.profiles (user_id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data ->> 'full_name', u.email),
  COALESCE(NULLIF(u.raw_user_meta_data ->> 'role', ''), 'citizen')
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

-- 5) Backfill: corrigir role de profiles já existentes quando inválido/nulo, pegando do metadata
UPDATE public.profiles p
SET role = COALESCE(NULLIF(u.raw_user_meta_data ->> 'role', ''), 'citizen')
FROM auth.users u
WHERE u.id = p.user_id
  AND (p.role IS NULL OR p.role NOT IN ('admin','social_worker','citizen'));

-- 6) Adicionar constraint de valores válidos (somente se não existir) e tornar NOT NULL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_role_valid'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_valid
      CHECK (role IN ('admin','social_worker','citizen'));
  END IF;
END;
$$;

ALTER TABLE public.profiles
  ALTER COLUMN role SET NOT NULL;
