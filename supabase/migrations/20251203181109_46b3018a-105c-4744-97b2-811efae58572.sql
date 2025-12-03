-- Create job transfer requests table
CREATE TABLE public.job_transfer_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL,
  from_program_id UUID NOT NULL,
  to_program_id UUID NOT NULL,
  mobile_number TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_transfer_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can create job transfer requests" 
ON public.job_transfer_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own job transfer requests" 
ON public.job_transfer_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage job transfer requests" 
ON public.job_transfer_requests 
FOR ALL 
USING (true);