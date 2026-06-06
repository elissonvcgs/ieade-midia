
-- Auto-add every new user to the default ministry (IEADE) and backfill existing users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_congresso_id uuid;
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );

  SELECT id INTO default_congresso_id
  FROM public.congressos
  ORDER BY created_at ASC
  LIMIT 1;

  IF default_congresso_id IS NOT NULL THEN
    INSERT INTO public.congresso_members (congresso_id, user_id, role)
    VALUES (default_congresso_id, NEW.id, 'member')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill existing auth users into the default congresso
INSERT INTO public.congresso_members (congresso_id, user_id, role)
SELECT
  (SELECT id FROM public.congressos ORDER BY created_at ASC LIMIT 1),
  u.id,
  'member'
FROM auth.users u
WHERE (SELECT id FROM public.congressos ORDER BY created_at ASC LIMIT 1) IS NOT NULL
ON CONFLICT DO NOTHING;
