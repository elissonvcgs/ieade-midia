
-- Helper function: is admin of a congresso
CREATE OR REPLACE FUNCTION public.is_congresso_admin(_congresso_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.congresso_members
    WHERE congresso_id = _congresso_id
      AND user_id = _user_id
      AND role = 'admin'
  );
$$;

-- escalas: allow admins to update/delete in addition to creators
DROP POLICY IF EXISTS "Creators can update escalas" ON public.escalas;
DROP POLICY IF EXISTS "Creators can delete escalas" ON public.escalas;

CREATE POLICY "Creators or admins can update escalas"
ON public.escalas FOR UPDATE
TO authenticated
USING (auth.uid() = created_by OR public.is_congresso_admin(congresso_id, auth.uid()));

CREATE POLICY "Creators or admins can delete escalas"
ON public.escalas FOR DELETE
TO authenticated
USING (auth.uid() = created_by OR public.is_congresso_admin(congresso_id, auth.uid()));
