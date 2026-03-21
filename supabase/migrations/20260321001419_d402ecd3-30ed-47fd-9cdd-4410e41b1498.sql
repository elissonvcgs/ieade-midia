
-- Fix overly permissive policies on escala_participantes
DROP POLICY "Users can be added as participantes" ON public.escala_participantes;
CREATE POLICY "Users can be added as participantes" ON public.escala_participantes FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.escalas e JOIN public.congresso_members cm ON cm.congresso_id = e.congresso_id WHERE e.id = escala_id AND cm.user_id = auth.uid())
);

-- Fix overly permissive policies on escala_musicas
DROP POLICY "Authenticated can add musicas" ON public.escala_musicas;
DROP POLICY "Authenticated can update musicas" ON public.escala_musicas;
DROP POLICY "Authenticated can delete musicas" ON public.escala_musicas;

CREATE POLICY "Members can add musicas" ON public.escala_musicas FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.escalas e JOIN public.congresso_members cm ON cm.congresso_id = e.congresso_id WHERE e.id = escala_id AND cm.user_id = auth.uid())
);
CREATE POLICY "Members can update musicas" ON public.escala_musicas FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.escalas e JOIN public.congresso_members cm ON cm.congresso_id = e.congresso_id WHERE e.id = escala_id AND cm.user_id = auth.uid())
);
CREATE POLICY "Members can delete musicas" ON public.escala_musicas FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.escalas e JOIN public.congresso_members cm ON cm.congresso_id = e.congresso_id WHERE e.id = escala_id AND cm.user_id = auth.uid())
);
