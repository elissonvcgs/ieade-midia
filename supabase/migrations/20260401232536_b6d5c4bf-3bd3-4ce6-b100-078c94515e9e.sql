
-- Roteiro items table
CREATE TABLE public.escala_roteiro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escala_id UUID NOT NULL REFERENCES public.escalas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  hora TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.escala_roteiro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view roteiro" ON public.escala_roteiro FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can add roteiro" ON public.escala_roteiro FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM escalas e JOIN congresso_members cm ON cm.congresso_id = e.congresso_id WHERE e.id = escala_roteiro.escala_id AND cm.user_id = auth.uid()));
CREATE POLICY "Members can update roteiro" ON public.escala_roteiro FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM escalas e JOIN congresso_members cm ON cm.congresso_id = e.congresso_id WHERE e.id = escala_roteiro.escala_id AND cm.user_id = auth.uid()));
CREATE POLICY "Members can delete roteiro" ON public.escala_roteiro FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM escalas e JOIN congresso_members cm ON cm.congresso_id = e.congresso_id WHERE e.id = escala_roteiro.escala_id AND cm.user_id = auth.uid()));

-- Roteiro templates
CREATE TABLE public.roteiro_modelos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  congresso_id UUID NOT NULL REFERENCES public.congressos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  itens JSONB NOT NULL DEFAULT '[]',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.roteiro_modelos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view modelos" ON public.roteiro_modelos FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM congresso_members WHERE congresso_members.congresso_id = roteiro_modelos.congresso_id AND congresso_members.user_id = auth.uid()));
CREATE POLICY "Members can create modelos" ON public.roteiro_modelos FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by AND EXISTS (SELECT 1 FROM congresso_members WHERE congresso_members.congresso_id = roteiro_modelos.congresso_id AND congresso_members.user_id = auth.uid()));
CREATE POLICY "Creators can delete modelos" ON public.roteiro_modelos FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Add DELETE policy for escala_participantes
CREATE POLICY "Members can delete participantes" ON public.escala_participantes FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM escalas e JOIN congresso_members cm ON cm.congresso_id = e.congresso_id WHERE e.id = escala_participantes.escala_id AND cm.user_id = auth.uid()));
