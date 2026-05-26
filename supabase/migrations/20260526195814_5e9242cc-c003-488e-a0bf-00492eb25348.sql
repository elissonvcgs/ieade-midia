CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_congresso_admin(_congresso_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.congresso_members
    WHERE congresso_id = _congresso_id
      AND user_id = _user_id
      AND role = 'admin'
  );
$$;

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_congresso_admin(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Creators or admins can update escalas" ON public.escalas;
DROP POLICY IF EXISTS "Creators or admins can delete escalas" ON public.escalas;

CREATE POLICY "Creators or admins can update escalas"
ON public.escalas
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by
  OR private.is_congresso_admin(congresso_id, auth.uid())
)
WITH CHECK (
  auth.uid() = created_by
  OR private.is_congresso_admin(congresso_id, auth.uid())
);

CREATE POLICY "Creators or admins can delete escalas"
ON public.escalas
FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by
  OR private.is_congresso_admin(congresso_id, auth.uid())
);

REVOKE EXECUTE ON FUNCTION public.is_congresso_admin(uuid, uuid) FROM PUBLIC, anon, authenticated;