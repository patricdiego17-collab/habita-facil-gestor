-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'citizen' CHECK (role IN ('admin', 'social_worker', 'citizen')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create social_registrations table
CREATE TABLE public.social_registrations (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  rg TEXT,
  birth_date DATE,
  phone TEXT,
  address TEXT,
  neighborhood TEXT,
  city TEXT DEFAULT 'Itapecerica da Serra',
  state TEXT DEFAULT 'SP',
  zip_code TEXT,
  marital_status TEXT,
  education TEXT,
  profession TEXT,
  income DECIMAL(10,2),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  has_children BOOLEAN DEFAULT false,
  housing_situation TEXT,
  receives_benefits BOOLEAN DEFAULT false,
  benefits_description TEXT,
  observations TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create family_compositions table
CREATE TABLE public.family_compositions (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  social_registration_id UUID REFERENCES public.social_registrations(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  age INTEGER,
  cpf TEXT,
  income DECIMAL(10,2) DEFAULT 0,
  profession TEXT,
  education TEXT,
  has_disability BOOLEAN DEFAULT false,
  disability_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  social_registration_id UUID REFERENCES public.social_registrations(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  file_type TEXT,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  observations TEXT
);

-- Create terms_agreements table
CREATE TABLE public.terms_agreements (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  social_registration_id UUID REFERENCES public.social_registrations(id) ON DELETE CASCADE,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  acceptance_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms_agreements ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS Policies for social_registrations
CREATE POLICY "Users can view their own registrations" ON public.social_registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own registrations" ON public.social_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations" ON public.social_registrations
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS Policies for family_compositions
CREATE POLICY "Users can view their own family data" ON public.family_compositions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own family data" ON public.family_compositions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own family data" ON public.family_compositions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own family data" ON public.family_compositions
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS Policies for documents
CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS Policies for terms_agreements
CREATE POLICY "Users can view their own terms" ON public.terms_agreements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own terms" ON public.terms_agreements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_registrations_updated_at
  BEFORE UPDATE ON public.social_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_compositions_updated_at
  BEFORE UPDATE ON public.family_compositions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();