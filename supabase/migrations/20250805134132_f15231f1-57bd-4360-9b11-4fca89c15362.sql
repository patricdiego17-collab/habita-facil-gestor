-- Create registration tracking table for status updates and messages
CREATE TABLE public.registration_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  social_registration_id UUID NOT NULL,
  user_id UUID NOT NULL,
  updated_by UUID NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.registration_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for registration tracking
CREATE POLICY "Users can view tracking for their registrations" 
ON public.registration_tracking 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'social_worker')
  )
);

CREATE POLICY "Admin and social workers can insert tracking" 
ON public.registration_tracking 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'social_worker')
  )
);

CREATE POLICY "Admin and social workers can update tracking" 
ON public.registration_tracking 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'social_worker')
  )
);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_registration_tracking_updated_at
BEFORE UPDATE ON public.registration_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update social_registrations table to include assigned social worker
ALTER TABLE public.social_registrations 
ADD COLUMN assigned_social_worker_id UUID;