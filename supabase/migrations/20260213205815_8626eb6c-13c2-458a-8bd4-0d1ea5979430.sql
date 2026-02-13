
-- Fix 1: Replace overly permissive INSERT policy on newsletter_subscribers
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;

CREATE POLICY "Anyone can subscribe" 
ON public.newsletter_subscribers 
FOR INSERT 
WITH CHECK (
  subscribed = true
  AND char_length(email) > 0
  AND char_length(email) <= 255
);

-- Fix 2: Add DELETE policy for profiles (admin only)
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (public.is_admin());

-- Fix 3: Fix admin assignment race condition
CREATE OR REPLACE FUNCTION public.assign_admin_to_first_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use advisory lock to prevent race conditions
  PERFORM pg_advisory_xact_lock(123456789);
  
  -- Only assign admin if no admin exists yet
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
