CREATE OR REPLACE FUNCTION public.shares_congresso(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.congresso_members ca
    JOIN public.congresso_members cb ON cb.congresso_id = ca.congresso_id
    WHERE ca.user_id = _a AND cb.user_id = _b
  )
$$;

REVOKE ALL ON FUNCTION public.shares_congresso(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.shares_congresso(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_congresso(uuid, uuid) TO service_role;