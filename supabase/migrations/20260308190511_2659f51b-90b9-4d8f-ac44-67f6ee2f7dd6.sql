-- Fix permissive INSERT policy: only allow inserts from the trigger (via SECURITY DEFINER functions)
-- Drop the overly permissive policy and create a restricted one
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = from_user_id);