-- Function to auto-approve Pennyekart Free Registration on insert
CREATE OR REPLACE FUNCTION public.auto_approve_pennyekart_free_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    pennyekart_free_category_id UUID;
BEGIN
    -- Get the category ID for "Pennyekart Free Registration"
    SELECT id INTO pennyekart_free_category_id 
    FROM public.categories 
    WHERE name_english = 'Pennyekart Free Registration';
    
    -- If this registration is for Pennyekart Free Registration, auto-approve it
    IF NEW.category_id = pennyekart_free_category_id THEN
        NEW.status = 'approved';
        NEW.approved_date = NOW();
        NEW.approved_by = 'auto_system';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to auto-approve Pennyekart Free Registration on insert
DROP TRIGGER IF EXISTS auto_approve_pennyekart_free_trigger ON public.registrations;
CREATE TRIGGER auto_approve_pennyekart_free_trigger
    BEFORE INSERT ON public.registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_approve_pennyekart_free_on_insert();