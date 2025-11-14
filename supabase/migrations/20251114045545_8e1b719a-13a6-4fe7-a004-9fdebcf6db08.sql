-- Add program_id column to registrations table
ALTER TABLE public.registrations 
ADD COLUMN program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_registrations_program_id 
ON public.registrations(program_id);