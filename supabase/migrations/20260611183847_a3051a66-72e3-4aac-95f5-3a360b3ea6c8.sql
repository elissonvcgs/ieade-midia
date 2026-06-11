GRANT SELECT, INSERT, UPDATE, DELETE ON public.congressos TO authenticated;
GRANT ALL ON public.congressos TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.congresso_members TO authenticated;
GRANT ALL ON public.congresso_members TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.avisos TO authenticated;
GRANT ALL ON public.avisos TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.escalas TO authenticated;
GRANT ALL ON public.escalas TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.escala_participantes TO authenticated;
GRANT ALL ON public.escala_participantes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.escala_musicas TO authenticated;
GRANT ALL ON public.escala_musicas TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.escala_roteiro TO authenticated;
GRANT ALL ON public.escala_roteiro TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.repertorio TO authenticated;
GRANT ALL ON public.repertorio TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.funcoes TO authenticated;
GRANT ALL ON public.funcoes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.membro_funcoes TO authenticated;
GRANT ALL ON public.membro_funcoes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mensagens TO authenticated;
GRANT ALL ON public.mensagens TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_rooms TO authenticated;
GRANT ALL ON public.chat_rooms TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_room_members TO authenticated;
GRANT ALL ON public.chat_room_members TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.roteiro_modelos TO authenticated;
GRANT ALL ON public.roteiro_modelos TO service_role;