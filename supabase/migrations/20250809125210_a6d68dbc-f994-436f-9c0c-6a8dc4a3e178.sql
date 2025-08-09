
-- 1) Sincronizar perfis com o metadata (corrige 'citizen' quando o metadata tem 'admin' ou 'social_worker')
UPDATE public.profiles p
SET role = u.raw_user_meta_data ->> 'role',
    updated_at = now()
FROM auth.users u
WHERE u.id = p.user_id
  AND (u.raw_user_meta_data ->> 'role') IN ('admin','social_worker','citizen')
  AND p.role IS DISTINCT FROM (u.raw_user_meta_data ->> 'role');

-- 2) Garantir unicidade de profile por usuário
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_user_id_unique'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
END;
$$;

-- 3) Função para um admin ajustar o role de qualquer usuário, com validação
CREATE OR REPLACE FUNCTION public.admin_set_user_role(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Só admins podem executar
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Validar valores permitidos
  IF p_role NOT IN ('admin', 'social_worker', 'citizen') THEN
    RAISE EXCEPTION 'Invalid role value: %', p_role;
  END IF;

  UPDATE public.profiles
  SET role = p_role,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO authenticated;
