-- Fix RLS policies to allow proper role-based access

-- First, create a security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update social_registrations policies to allow admin and social workers to view all
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.social_registrations;
CREATE POLICY "Users can view registrations" ON public.social_registrations
FOR SELECT USING (
  auth.uid() = user_id OR 
  public.get_current_user_role() IN ('admin', 'social_worker')
);

-- Allow admin and social workers to update all registrations
DROP POLICY IF EXISTS "Users can update their own registrations" ON public.social_registrations;
CREATE POLICY "Users can update registrations" ON public.social_registrations
FOR UPDATE USING (
  auth.uid() = user_id OR 
  public.get_current_user_role() IN ('admin', 'social_worker')
);

-- Update family_compositions policies
DROP POLICY IF EXISTS "Users can view their own family data" ON public.family_compositions;
CREATE POLICY "Users can view family data" ON public.family_compositions
FOR SELECT USING (
  auth.uid() = user_id OR 
  public.get_current_user_role() IN ('admin', 'social_worker')
);

DROP POLICY IF EXISTS "Users can update their own family data" ON public.family_compositions;
CREATE POLICY "Users can update family data" ON public.family_compositions
FOR UPDATE USING (
  auth.uid() = user_id OR 
  public.get_current_user_role() IN ('admin', 'social_worker')
);

-- Update documents policies
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
CREATE POLICY "Users can view documents" ON public.documents
FOR SELECT USING (
  auth.uid() = user_id OR 
  public.get_current_user_role() IN ('admin', 'social_worker')
);

DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
CREATE POLICY "Users can update documents" ON public.documents
FOR UPDATE USING (
  auth.uid() = user_id OR 
  public.get_current_user_role() IN ('admin', 'social_worker')
);

-- Fix profiles policies to allow viewing all profiles for admin/social workers
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view profiles" ON public.profiles
FOR SELECT USING (
  auth.uid() = user_id OR 
  public.get_current_user_role() IN ('admin', 'social_worker')
);

-- Add missing social_registration_id column for linking data
ALTER TABLE public.family_compositions 
ADD COLUMN IF NOT EXISTS social_registration_id uuid REFERENCES public.social_registrations(id);

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS social_registration_id uuid REFERENCES public.social_registrations(id);