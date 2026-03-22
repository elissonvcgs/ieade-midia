
-- Chat rooms (groups and DMs)
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  congresso_id UUID NOT NULL REFERENCES public.congressos(id) ON DELETE CASCADE,
  nome TEXT,
  tipo TEXT NOT NULL DEFAULT 'group', -- 'group' or 'direct'
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat room members
CREATE TABLE public.chat_room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- chat_rooms policies
CREATE POLICY "Members can view rooms" ON public.chat_rooms FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.chat_room_members WHERE chat_room_members.room_id = chat_rooms.id AND chat_room_members.user_id = auth.uid()));

CREATE POLICY "Congress members can create rooms" ON public.chat_rooms FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by AND EXISTS (SELECT 1 FROM public.congresso_members WHERE congresso_members.congresso_id = chat_rooms.congresso_id AND congresso_members.user_id = auth.uid()));

CREATE POLICY "Creators can delete rooms" ON public.chat_rooms FOR DELETE TO authenticated
USING (auth.uid() = created_by);

-- chat_room_members policies
CREATE POLICY "Members can view room members" ON public.chat_room_members FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.chat_room_members crm WHERE crm.room_id = chat_room_members.room_id AND crm.user_id = auth.uid()));

CREATE POLICY "Room creators can add members" ON public.chat_room_members FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.chat_rooms WHERE chat_rooms.id = chat_room_members.room_id AND (chat_rooms.created_by = auth.uid() OR chat_room_members.user_id = auth.uid())));

CREATE POLICY "Members can leave rooms" ON public.chat_room_members FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- chat_messages policies
CREATE POLICY "Room members can view messages" ON public.chat_messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.chat_room_members WHERE chat_room_members.room_id = chat_messages.room_id AND chat_room_members.user_id = auth.uid()));

CREATE POLICY "Room members can send messages" ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.chat_room_members WHERE chat_room_members.room_id = chat_messages.room_id AND chat_room_members.user_id = auth.uid()));

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
