CREATE OR REPLACE FUNCTION public.is_congresso_member(_congresso_id uuid, _user_id uuid)
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
  );
$$;

CREATE OR REPLACE FUNCTION public.is_chat_room_member(_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_room_members
    WHERE room_id = _room_id
      AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_add_chat_room_member(_room_id uuid, _member_user_id uuid, _actor_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_rooms cr
    WHERE cr.id = _room_id
      AND (
        cr.created_by = _actor_user_id
        OR _member_user_id = _actor_user_id
      )
      AND public.is_congresso_member(cr.congresso_id, _member_user_id)
      AND public.is_congresso_member(cr.congresso_id, _actor_user_id)
  );
$$;

DROP POLICY IF EXISTS "Members can view rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Members and creators can view rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Congress members can create rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Members can view room members" ON public.chat_room_members;
DROP POLICY IF EXISTS "Room creators can add members" ON public.chat_room_members;
DROP POLICY IF EXISTS "Room members can view messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Room members can send messages" ON public.chat_messages;

CREATE POLICY "Members and creators can view rooms"
ON public.chat_rooms
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by
  OR public.is_chat_room_member(id, auth.uid())
);

CREATE POLICY "Congress members can create rooms"
ON public.chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND public.is_congresso_member(congresso_id, auth.uid())
);

CREATE POLICY "Members can view room members"
ON public.chat_room_members
FOR SELECT
TO authenticated
USING (
  public.is_chat_room_member(room_id, auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.chat_rooms cr
    WHERE cr.id = room_id
      AND cr.created_by = auth.uid()
  )
);

CREATE POLICY "Room creators can add members"
ON public.chat_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_add_chat_room_member(room_id, user_id, auth.uid())
);

CREATE POLICY "Room members can view messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  public.is_chat_room_member(room_id, auth.uid())
);

CREATE POLICY "Room members can send messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_chat_room_member(room_id, auth.uid())
);