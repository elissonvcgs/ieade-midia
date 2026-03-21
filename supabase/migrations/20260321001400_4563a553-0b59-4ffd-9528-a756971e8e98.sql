
-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  birthday DATE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Congressos table
CREATE TABLE public.congressos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.congressos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view congressos" ON public.congressos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create congressos" ON public.congressos FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners can update congressos" ON public.congressos FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE TRIGGER update_congressos_updated_at BEFORE UPDATE ON public.congressos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Congresso members
CREATE TABLE public.congresso_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  congresso_id UUID NOT NULL REFERENCES public.congressos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(congresso_id, user_id)
);
ALTER TABLE public.congresso_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view congresso members" ON public.congresso_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join congressos" ON public.congresso_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave congressos" ON public.congresso_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Escalas table
CREATE TABLE public.escalas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  congresso_id UUID NOT NULL REFERENCES public.congressos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  data DATE,
  hora TIME,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'Rascunho',
  confirmacao BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.escalas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view escalas" ON public.escalas FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.congresso_members WHERE congresso_id = escalas.congresso_id AND user_id = auth.uid())
);
CREATE POLICY "Members can create escalas" ON public.escalas FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = created_by AND EXISTS (SELECT 1 FROM public.congresso_members WHERE congresso_id = escalas.congresso_id AND user_id = auth.uid())
);
CREATE POLICY "Creators can update escalas" ON public.escalas FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Creators can delete escalas" ON public.escalas FOR DELETE TO authenticated USING (auth.uid() = created_by);
CREATE TRIGGER update_escalas_updated_at BEFORE UPDATE ON public.escalas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Escala participantes
CREATE TABLE public.escala_participantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escala_id UUID NOT NULL REFERENCES public.escalas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  confirmado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(escala_id, user_id)
);
ALTER TABLE public.escala_participantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view participantes" ON public.escala_participantes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can be added as participantes" ON public.escala_participantes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own participation" ON public.escala_participantes FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Escala musicas
CREATE TABLE public.escala_musicas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escala_id UUID NOT NULL REFERENCES public.escalas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  artista TEXT,
  tom TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.escala_musicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view musicas" ON public.escala_musicas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can add musicas" ON public.escala_musicas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update musicas" ON public.escala_musicas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete musicas" ON public.escala_musicas FOR DELETE TO authenticated USING (true);

-- Mensagens
CREATE TABLE public.mensagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  congresso_id UUID NOT NULL REFERENCES public.congressos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view mensagens" ON public.mensagens FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.congresso_members WHERE congresso_id = mensagens.congresso_id AND user_id = auth.uid())
);
CREATE POLICY "Members can send mensagens" ON public.mensagens FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.congresso_members WHERE congresso_id = mensagens.congresso_id AND user_id = auth.uid())
);

-- Avisos
CREATE TABLE public.avisos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  congresso_id UUID NOT NULL REFERENCES public.congressos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  destaque BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view avisos" ON public.avisos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.congresso_members WHERE congresso_id = avisos.congresso_id AND user_id = auth.uid())
);
CREATE POLICY "Members can create avisos" ON public.avisos FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = created_by AND EXISTS (SELECT 1 FROM public.congresso_members WHERE congresso_id = avisos.congresso_id AND user_id = auth.uid())
);
CREATE POLICY "Creators can update avisos" ON public.avisos FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE TRIGGER update_avisos_updated_at BEFORE UPDATE ON public.avisos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
