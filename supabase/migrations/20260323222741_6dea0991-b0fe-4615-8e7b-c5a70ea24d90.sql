
-- Funções disponíveis no congresso (ex: Vocalista, Violão, Guitarra, etc.)
CREATE TABLE public.funcoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  congresso_id UUID NOT NULL REFERENCES public.congressos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.funcoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view funcoes" ON public.funcoes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM congresso_members WHERE congresso_members.congresso_id = funcoes.congresso_id AND congresso_members.user_id = auth.uid()));

CREATE POLICY "Admins can create funcoes" ON public.funcoes
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM congresso_members WHERE congresso_members.congresso_id = funcoes.congresso_id AND congresso_members.user_id = auth.uid() AND congresso_members.role = 'admin'));

CREATE POLICY "Admins can delete funcoes" ON public.funcoes
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM congresso_members WHERE congresso_members.congresso_id = funcoes.congresso_id AND congresso_members.user_id = auth.uid() AND congresso_members.role = 'admin'));

-- Funções atribuídas a cada membro
CREATE TABLE public.membro_funcoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  congresso_id UUID NOT NULL REFERENCES public.congressos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  funcao_id UUID NOT NULL REFERENCES public.funcoes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, funcao_id)
);

ALTER TABLE public.membro_funcoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view membro_funcoes" ON public.membro_funcoes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM congresso_members WHERE congresso_members.congresso_id = membro_funcoes.congresso_id AND congresso_members.user_id = auth.uid()));

CREATE POLICY "Admins can manage membro_funcoes" ON public.membro_funcoes
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM congresso_members WHERE congresso_members.congresso_id = membro_funcoes.congresso_id AND congresso_members.user_id = auth.uid() AND congresso_members.role = 'admin'));

CREATE POLICY "Admins can delete membro_funcoes" ON public.membro_funcoes
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM congresso_members WHERE congresso_members.congresso_id = membro_funcoes.congresso_id AND congresso_members.user_id = auth.uid() AND congresso_members.role = 'admin'));
