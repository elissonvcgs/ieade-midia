
-- Add attachment columns to chat_messages
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_name text;

-- Allow empty conteudo when sending only an attachment
ALTER TABLE public.chat_messages ALTER COLUMN conteudo DROP NOT NULL;

-- Create storage bucket for chat attachments (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: files are stored under {room_id}/{user_id}/{filename}
CREATE POLICY "Room members can view chat attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND private.is_chat_room_member(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Room members can upload chat attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND private.is_chat_room_member(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Users can delete own chat attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[2]
);
