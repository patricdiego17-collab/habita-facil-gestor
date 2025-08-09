-- Attach missing triggers for tracking and timestamps
-- Ensures registration and document events are tracked automatically

-- Use a DO block to safely (re)create triggers
DO $$
BEGIN
  -- social_registrations: updated_at trigger
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_social_registrations_updated_at'
  ) THEN
    DROP TRIGGER set_social_registrations_updated_at ON public.social_registrations;
  END IF;

  CREATE TRIGGER set_social_registrations_updated_at
  BEFORE UPDATE ON public.social_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

  -- social_registrations: tracking trigger
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'track_social_registrations_changes'
  ) THEN
    DROP TRIGGER track_social_registrations_changes ON public.social_registrations;
  END IF;

  CREATE TRIGGER track_social_registrations_changes
  AFTER INSERT OR UPDATE ON public.social_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_track_registration_changes();

  -- documents: tracking trigger
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'track_documents_changes'
  ) THEN
    DROP TRIGGER track_documents_changes ON public.documents;
  END IF;

  CREATE TRIGGER track_documents_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_track_document_changes();
END
$$;