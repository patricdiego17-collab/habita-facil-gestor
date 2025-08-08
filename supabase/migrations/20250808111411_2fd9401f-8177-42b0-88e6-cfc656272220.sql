-- Fix security warnings by setting search_path on functions

-- Fix create_tracking_entry function
CREATE OR REPLACE FUNCTION public.create_tracking_entry(
  p_user_id UUID,
  p_social_registration_id UUID,
  p_status TEXT,
  p_message TEXT DEFAULT NULL,
  p_updated_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  tracking_id UUID;
  updater_id UUID;
BEGIN
  -- Use provided updated_by or current user
  updater_id := COALESCE(p_updated_by, auth.uid());
  
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
  ) RETURNING id INTO tracking_id;
  
  RETURN tracking_id;
END;
$$;

-- Fix auto_track_registration_changes function
CREATE OR REPLACE FUNCTION public.auto_track_registration_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Handle INSERT (new registration)
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_tracking_entry(
      NEW.user_id,
      NEW.id,
      'cadastro_criado',
      'Cadastro social criado',
      NEW.user_id
    );
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE (status changes)
  IF TG_OP = 'UPDATE' THEN
    -- Track status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      PERFORM public.create_tracking_entry(
        NEW.user_id,
        NEW.id,
        NEW.status,
        'Status atualizado para: ' || NEW.status,
        auth.uid()
      );
    END IF;
    
    -- Track assignment changes
    IF OLD.assigned_social_worker_id IS DISTINCT FROM NEW.assigned_social_worker_id THEN
      PERFORM public.create_tracking_entry(
        NEW.user_id,
        NEW.id,
        'em_analise',
        'Assistente social designado',
        auth.uid()
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Fix auto_track_document_changes function
CREATE OR REPLACE FUNCTION public.auto_track_document_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Handle INSERT (new document)
  IF TG_OP = 'INSERT' THEN
    IF NEW.social_registration_id IS NOT NULL THEN
      PERFORM public.create_tracking_entry(
        NEW.user_id,
        NEW.social_registration_id,
        'documento_enviado',
        'Documento anexado: ' || NEW.document_name,
        NEW.user_id
      );
    END IF;
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE (status changes)
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.social_registration_id IS NOT NULL THEN
      PERFORM public.create_tracking_entry(
        NEW.user_id,
        NEW.social_registration_id,
        CASE 
          WHEN NEW.status = 'approved' THEN 'documento_aprovado'
          WHEN NEW.status = 'rejected' THEN 'documento_rejeitado'
          ELSE 'documento_atualizado'
        END,
        'Status do documento "' || NEW.document_name || '" alterado para: ' || NEW.status,
        auth.uid()
      );
    END IF;
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.social_registration_id IS NOT NULL THEN
      PERFORM public.create_tracking_entry(
        OLD.user_id,
        OLD.social_registration_id,
        'documento_removido',
        'Documento removido: ' || OLD.document_name,
        auth.uid()
      );
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;