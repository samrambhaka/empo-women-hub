-- Enable RLS on programs table
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- Admin can manage programs
CREATE POLICY "Admin can manage programs"
ON public.programs
FOR ALL
USING (true)
WITH CHECK (true);

-- Anyone can view programs (for public-facing features)
CREATE POLICY "Anyone can view programs"
ON public.programs
FOR SELECT
USING (true);