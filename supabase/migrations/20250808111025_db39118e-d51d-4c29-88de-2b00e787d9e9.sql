-- Phase 1: Database Structure Updates (Fixed)

-- Create messages table for communication system
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  social_registration_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'user_message', -- 'user_message', 'system_update', 'status_change'
  is_internal BOOLEAN NOT NULL DEFAULT false, -- true for admin/social_worker only messages
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages
CREATE POLICY "Users can view messages for their registrations" 
ON public.messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.social_registrations 
    WHERE id = social_registration_id 
    AND user_id = auth.uid()
  ) 
  OR 
  get_current_user_role() = ANY (ARRAY['admin'::text, 'social_worker'::text])
);

CREATE POLICY "Users can insert messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id AND is_internal = false) 
  OR 
  (get_current_user_role() = ANY (ARRAY['admin'::text, 'social_worker'::text]))
);

-- Function to create automatic tracking entries
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

-- Trigger function for automatic registration tracking
CREATE OR REPLACE FUNCTION public.auto_track_registration_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for automatic tracking
DROP TRIGGER IF EXISTS trigger_auto_track_registration ON public.social_registrations;
CREATE TRIGGER trigger_auto_track_registration
  AFTER INSERT OR UPDATE ON public.social_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_track_registration_changes();

-- Trigger function for document tracking
CREATE OR REPLACE FUNCTION public.auto_track_document_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for document tracking
DROP TRIGGER IF EXISTS trigger_auto_track_documents ON public.documents;
CREATE TRIGGER trigger_auto_track_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_track_document_changes();

-- Update RLS policies to allow deletion of documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documents' 
    AND policyname = 'Users can delete their own documents'
  ) THEN
    CREATE POLICY "Users can delete their own documents" 
    ON public.documents 
    FOR DELETE 
    USING (auth.uid() = user_id);
  END IF;
END;
$$;

-- Create trigger for messages timestamp updates
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance on messages
CREATE INDEX IF NOT EXISTS idx_messages_social_registration ON public.messages(social_registration_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id, created_at DESC);