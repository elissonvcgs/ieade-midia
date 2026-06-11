DROP POLICY IF EXISTS "Members can view own congresso members" ON public.congresso_members;
CREATE POLICY "Members can view own congresso members"
ON public.congresso_members
FOR SELECT
TO authenticated
USING (private.is_congresso_member(congresso_id, auth.uid()));

DROP POLICY IF EXISTS "Admins can update member roles" ON public.congresso_members;
CREATE POLICY "Admins can update member roles"
ON public.congresso_members
FOR UPDATE
TO authenticated
USING (private.is_congresso_admin(congresso_id, auth.uid()))
WITH CHECK (private.is_congresso_admin(congresso_id, auth.uid()));

DROP POLICY IF EXISTS "Creators or admins can update modelos" ON public.roteiro_modelos;
CREATE POLICY "Creators or admins can update modelos"
ON public.roteiro_modelos
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by OR private.is_congresso_admin(congresso_id, auth.uid()))
WITH CHECK (auth.uid() = created_by OR private.is_congresso_admin(congresso_id, auth.uid()));