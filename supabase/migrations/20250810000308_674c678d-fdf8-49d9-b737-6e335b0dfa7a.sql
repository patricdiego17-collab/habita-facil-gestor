-- Add signer_name, signer_cpf, and terms_version to terms_agreements
ALTER TABLE public.terms_agreements
  ADD COLUMN IF NOT EXISTS signer_name text,
  ADD COLUMN IF NOT EXISTS signer_cpf text,
  ADD COLUMN IF NOT EXISTS terms_version text;