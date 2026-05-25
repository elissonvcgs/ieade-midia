import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, CalendarDays, Clock, Users, Music, ListChecks, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface Escala {
  id: string;
  titulo: string;
  data: string | null;
  hora: string | null;
  observacoes: string | null;
  status: string;
}

interface Participante {
  user_id: string;
  name: string;
  avatar_url: string | null;
  funcoes: string[];
}

interface Musica { nome: string; artista: string | null; tom: string | null; ordem: number; }
interface Roteiro { titulo: string; descricao: string | null; hora: string | null; ordem: number; }

const EscalaDetalhes = ({ escala, congressoId, onClose }: { escala: Escala; congressoId: string; onClose: () => void }) => {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [roteiro, setRoteiro] = useState<Roteiro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [partsRes, musRes, rotRes, funcoesRes, mfRes] = await Promise.all([
        supabase.from("escala_participantes").select("user_id").eq("escala_id", escala.id),
        supabase.from("escala_musicas").select("nome, artista, tom, ordem").eq("escala_id", escala.id).order("ordem"),
        supabase.from("escala_roteiro").select("titulo, descricao, hora, ordem").eq("escala_id", escala.id).order("ordem"),
        supabase.from("funcoes").select("id, nome").eq("congresso_id", congressoId),
        supabase.from("membro_funcoes").select("user_id, funcao_id").eq("congresso_id", congressoId),
      ]);

      const userIds = partsRes.data?.map((p) => p.user_id) || [];
      let profs: any[] = [];
      if (userIds.length) {
        const { data } = await supabase.from("profiles").select("user_id, name, avatar_url").in("user_id", userIds);
        profs = data || [];
      }
      const funcaoMap = new Map((funcoesRes.data || []).map((f) => [f.id, f.nome]));
      const parts: Participante[] = userIds.map((uid) => {
        const p = profs.find((x) => x.user_id === uid);
        const funcoes = (mfRes.data || []).filter((m) => m.user_id === uid).map((m) => funcaoMap.get(m.funcao_id) || "").filter(Boolean);
        return { user_id: uid, name: p?.name || "Sem nome", avatar_url: p?.avatar_url || null, funcoes };
      });
      parts.sort((a, b) => a.name.localeCompare(b.name));
      setParticipantes(parts);
      setMusicas(musRes.data || []);
      setRoteiro(rotRes.data || []);
      setLoading(false);
    };
    load();
  }, [escala.id, congressoId]);

  const initials = (n: string) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto p-6 lg:p-10">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onClose} className="text-foreground hover:text-muted-foreground"><X className="w-6 h-6" /></button>
        <h1 className="text-xl font-semibold text-foreground">Detalhes da escala</h1>
        <div className="w-6" />
      </div>

      <div className="bg-card rounded-xl border border-border p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-2xl font-bold text-foreground">{escala.titulo}</h2>
          <span className="text-xs text-muted-foreground bg-accent px-2 py-1 rounded">{escala.status}</span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><CalendarDays className="w-4 h-4" />
            {escala.data ? new Date(escala.data + "T00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : "Data não definida"}
          </span>
          <span className="flex items-center gap-2"><Clock className="w-4 h-4" />{escala.hora || "Horário não definido"}</span>
        </div>
        {escala.observacoes && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs uppercase text-muted-foreground mb-1 flex items-center gap-1"><FileText className="w-3 h-3" /> Observações</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{escala.observacoes}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><p className="text-muted-foreground">Carregando...</p></div>
      ) : (
        <div className="space-y-4">
          <section className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-primary" /> Participantes ({participantes.length})</h3>
            {participantes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum participante adicionado.</p>
            ) : (
              <div className="space-y-2">
                {participantes.map((p) => (
                  <div key={p.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">{initials(p.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      {p.funcoes.length > 0 && <p className="text-xs text-muted-foreground">{p.funcoes.join(", ")}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3"><Music className="w-4 h-4 text-primary" /> Músicas ({musicas.length})</h3>
            {musicas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma música cadastrada.</p>
            ) : (
              <div className="space-y-2">
                {musicas.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                    <span className="text-xs text-muted-foreground font-bold w-6 text-center">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{m.nome}</p>
                      <p className="text-xs text-muted-foreground">{[m.artista, m.tom && `Tom: ${m.tom}`].filter(Boolean).join(" • ") || "Sem detalhes"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3"><ListChecks className="w-4 h-4 text-primary" /> Roteiro ({roteiro.length})</h3>
            {roteiro.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item no roteiro.</p>
            ) : (
              <div className="space-y-2">
                {roteiro.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-background/50">
                    {r.hora && <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded min-w-[50px] text-center">{r.hora}</span>}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{r.titulo}</p>
                      {r.descricao && <p className="text-xs text-muted-foreground">{r.descricao}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </motion.div>
  );
};

export default EscalaDetalhes;