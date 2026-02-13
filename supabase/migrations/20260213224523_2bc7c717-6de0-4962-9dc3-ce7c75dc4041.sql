-- Fix newsletter_subscribers RLS: replace email-based SELECT/UPDATE with user_id-based or admin-only

-- Drop existing vulnerable policies
DROP POLICY IF EXISTS "Subscribers can read own" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Subscribers can update own" ON public.newsletter_subscribers;

-- Only admins can read subscribers (users manage via email unsubscribe links)
CREATE POLICY "Only admins can read subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only admins can update subscribers
CREATE POLICY "Only admins can update subscribers"
ON public.newsletter_subscribers
FOR UPDATE
TO authenticated
USING (public.is_admin());