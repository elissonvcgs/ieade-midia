CREATE POLICY "Admins can update member roles"
ON public.congresso_members
FOR UPDATE
TO authenticated
USING (public.is_congresso_admin(congresso_id, auth.uid()))
WITH CHECK (public.is_congresso_admin(congresso_id, auth.uid()));