
CREATE TABLE public.repertorio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  congresso_id UUID NOT NULL REFERENCES public.congressos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  artista TEXT,
  album TEXT,
  tom TEXT,
  duracao TEXT,
  bpm TEXT,
  classificacao TEXT DEFAULT 'Louvor',
  letra TEXT,
  cifra TEXT,
  audio_url TEXT,
  video_url TEXT,
  letra_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.repertorio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view repertorio" ON public.repertorio
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM congresso_members WHERE congresso_members.congresso_id = repertorio.congresso_id AND congresso_members.user_id = auth.uid()));

CREATE POLICY "Members can create repertorio" ON public.repertorio
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND EXISTS (SELECT 1 FROM congresso_members WHERE congresso_members.congresso_id = repertorio.congresso_id AND congresso_members.user_id = auth.uid()));

CREATE POLICY "Creators can update repertorio" ON public.repertorio
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete repertorio" ON public.repertorio
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

CREATE TRIGGER update_repertorio_updated_at
  BEFORE UPDATE ON public.repertorio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
