
-- Helper: do two users share at least one congresso?
CREATE OR REPLACE FUNCTION public.shares_congresso(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.congresso_members ca
    JOIN public.congresso_members cb ON cb.congresso_id = ca.congresso_id
    WHERE ca.user_id = _a AND cb.user_id = _b
  );
$$;

-- PROFILES: restrict SELECT
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own or co-member profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.shares_congresso(auth.uid(), user_id)
);

-- CONGRESSO_MEMBERS: restrict SELECT to same-congresso members
DROP POLICY IF EXISTS "Members can view congresso members" ON public.congresso_members;
CREATE POLICY "Members can view own congresso members"
ON public.congresso_members FOR SELECT
TO authenticated
USING (public.is_congresso_member(congresso_id, auth.uid()));

-- ESCALA_MUSICAS: restrict SELECT
DROP POLICY IF EXISTS "Members can view musicas" ON public.escala_musicas;
CREATE POLICY "Members can view musicas"
ON public.escala_musicas FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.escalas e
    JOIN public.congresso_members cm ON cm.congresso_id = e.congresso_id
    WHERE e.id = escala_musicas.escala_id
      AND cm.user_id = auth.uid()
  )
);

-- ESCALA_ROTEIRO: restrict SELECT
DROP POLICY IF EXISTS "Members can view roteiro" ON public.escala_roteiro;
CREATE POLICY "Members can view roteiro"
ON public.escala_roteiro FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.escalas e
    JOIN public.congresso_members cm ON cm.congresso_id = e.congresso_id
    WHERE e.id = escala_roteiro.escala_id
      AND cm.user_id = auth.uid()
  )
);

-- ROTEIRO_MODELOS: add UPDATE policy
CREATE POLICY "Creators or admins can update modelos"
ON public.roteiro_modelos FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by
  OR public.is_congresso_admin(congresso_id, auth.uid())
)
WITH CHECK (
  auth.uid() = created_by
  OR public.is_congresso_admin(congresso_id, auth.uid())
);

-- STORAGE chat-attachments: add UPDATE policy (owner-only)
CREATE POLICY "Owners can update chat attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- REALTIME messages: restrict subscriptions to chat room members
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Room members can receive chat realtime" ON realtime.messages;
CREATE POLICY "Room members can receive chat realtime"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_room_members crm
    WHERE crm.user_id = auth.uid()
      AND ('room-' || crm.room_id::text) = realtime.topic()
  )
);
