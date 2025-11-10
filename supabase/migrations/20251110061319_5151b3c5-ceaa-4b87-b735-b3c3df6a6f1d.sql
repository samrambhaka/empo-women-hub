-- Enable RLS on sub_categories table
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;

-- Admin can manage sub-categories
CREATE POLICY "Admin can manage sub_categories"
ON public.sub_categories
FOR ALL
USING (true)
WITH CHECK (true);

-- Anyone can view sub-categories (for public-facing features)
CREATE POLICY "Anyone can view sub_categories"
ON public.sub_categories
FOR SELECT
USING (true);