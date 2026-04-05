DROP POLICY IF EXISTS "Members can view rooms" ON public.chat_rooms;
CREATE POLICY "Members and creators can view rooms" ON public.chat_rooms FOR SELECT TO authenticated USING (
  auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM chat_room_members WHERE chat_room_members.room_id = chat_rooms.id AND chat_room_members.user_id = auth.uid()
  )
);