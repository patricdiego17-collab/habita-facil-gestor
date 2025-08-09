
CREATE OR REPLACE FUNCTION public.create_tracking_entry(
  p_user_id uuid,
  p_social_registration_id uuid,
  p_status text,
  p_message text DEFAULT NULL::text,
  p_updated_by uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  tracking_id UUID;
  updater_id UUID;
BEGIN
  -- Garante que updated_by nunca será NULL (corrige deleções via service_role/admin)
  updater_id := COALESCE(p_updated_by, auth.uid(), p_user_id);
  
  INSERT INTO public.registration_tracking (
    user_id,
    social_registration_id,
    status,
    message,
    updated_by
  ) VALUES (
    p_user_id,
    p_social_registration_id,
    p_status,
    p_message,
    updater_id
  )
  RETURNING id INTO tracking_id;
  
  RETURN tracking_id;
END;
$function$;
