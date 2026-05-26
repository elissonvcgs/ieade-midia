GRANT EXECUTE ON FUNCTION public.is_congresso_admin(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Creators or admins can update escalas" ON public.escalas;
DROP POLICY IF EXISTS "Creators or admins can delete escalas" ON public.escalas;

CREATE POLICY "Creators or admins can update escalas"
ON public.escalas
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by
  OR public.is_congresso_admin(congresso_id, auth.uid())
)
WITH CHECK (
  auth.uid() = created_by
  OR public.is_congresso_admin(congresso_id, auth.uid())
);

CREATE POLICY "Creators or admins can delete escalas"
ON public.escalas
FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by
  OR public.is_congresso_admin(congresso_id, auth.uid())
);