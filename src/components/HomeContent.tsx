import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, ThumbsUp, Music, MessageSquare, ArrowRight, Cake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCongresso } from "@/hooks/useCongresso";

const sectionReveal = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

interface HomeContentProps {
  onSectionChange: (section: string) => void;
}

interface Aviso {
  id: string;
  titulo: string;
  conteudo: string | null;
  destaque: boolean;
  created_at: string;
}

interface Escala {
  id: string;
  titulo: string;
  data: string | null;
  hora: string | null;
  status: string;
}

interface EscalaWithDetails extends Escala {
  participantCount: number;
  musicCount: number;
  participantAvatars: { initials: string; name: string }[];
  isUserParticipant: boolean;
  confirmedCount: number;
  totalParticipants: number;
}

interface Birthday {
  name: string;
  birthday: string;
  user_id: string;
}

const HomeContent = ({ onSectionChange }: HomeContentProps) => {
  const { user } = useAuth();
  const { congresso } = useCongresso();
  const [memberCount, setMemberCount] = useState(0);
  const [musicCount, setMusicCount] = useState(0);
  const [escalaCount, setEscalaCount] = useState({ total: 0, user: 0 });
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [escalas, setEscalas] = useState<EscalaWithDetails[]>([]);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!congresso || !user) return;

    const fetchAll = async () => {
      setLoading(true);

      const today = new Date().toISOString().split("T")[0];
      const currentMonth = new Date().getMonth() + 1;
      const currentMonthStr = String(currentMonth).padStart(2, "0");

      // Fetch all in parallel
      const [
        membersRes,
        musicsRes,
        avisosRes,
        escalasRes,
        totalEscalasRes,
      ] = await Promise.all([
        supabase.from("congresso_members").select("user_id", { count: "exact" }).eq("congresso_id", congresso.id),
        supabase.from("repertorio").select("id", { count: "exact" }).eq("congresso_id", congresso.id),
        supabase.from("avisos").select("*").eq("congresso_id", congresso.id).eq("destaque", true).order("created_at", { ascending: false }).limit(3),
        supabase.from("escalas").select("*").eq("congresso_id", congresso.id).gte("data", today).order("data", { ascending: true }).limit(5),
        supabase.from("escalas").select("id", { count: "exact" }).eq("congresso_id", congresso.id),
      ]);

      setMemberCount(membersRes.count || 0);
      setMusicCount(musicsRes.count || 0);
      setAvisos(avisosRes.data || []);

      const allEscalas = escalasRes.data || [];

      // Fetch details for each escala
      const escalasWithDetails: EscalaWithDetails[] = await Promise.all(
        allEscalas.map(async (escala) => {
          const [participantsRes, musicsRes] = await Promise.all([
            supabase.from("escala_participantes").select("user_id, confirmado").eq("escala_id", escala.id),
            supabase.from("escala_musicas").select("id", { count: "exact" }).eq("escala_id", escala.id),
          ]);

          const participants = participantsRes.data || [];
          const isUserParticipant = participants.some(p => p.user_id === user.id);

          // Get profile initials for first 4 participants
          let participantAvatars: { initials: string; name: string }[] = [];
          if (participants.length > 0) {
            const userIds = participants.slice(0, 4).map(p => p.user_id);
            const { data: profiles } = await supabase
              .from("profiles")
              .select("user_id, name")
              .in("user_id", userIds);

            participantAvatars = (profiles || []).map(p => ({
              initials: p.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
              name: p.name,
            }));
          }

          return {
            ...escala,
            participantCount: participants.length,
            musicCount: musicsRes.count || 0,
            participantAvatars,
            isUserParticipant,
            confirmedCount: participants.filter(p => p.confirmado).length,
            totalParticipants: participants.length,
          };
        })
      );

      // Count escalas where user is participant
      const userEscalaCount = escalasWithDetails.filter(e => e.isUserParticipant).length;
      setEscalas(escalasWithDetails);
      setEscalaCount({ total: totalEscalasRes.count || 0, user: userEscalaCount });

      // Fetch birthdays for current month
      const { data: memberIds } = await supabase
        .from("congresso_members")
        .select("user_id")
        .eq("congresso_id", congresso.id);

      if (memberIds && memberIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, birthday")
          .in("user_id", memberIds.map(m => m.user_id))
          .not("birthday", "is", null);

        const monthBirthdays = (profiles || []).filter(p => {
          if (!p.birthday) return false;
          const month = p.birthday.split("-")[1];
          return month === currentMonthStr;
        });

        setBirthdays(monthBirthdays.map(p => ({
          name: p.name,
          birthday: p.birthday!,
          user_id: p.user_id,
        })));
      }

      setLoading(false);
    };

    fetchAll();
  }, [congresso, user]);

  const avatarColors = [
    "bg-primary", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-violet-500", "bg-cyan-500"
  ];

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const currentMonthName = monthNames[new Date().getMonth()];

  const totalAvisos = avisos.length;
  const destaqueAvisos = avisos.filter(a => a.destaque).length;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const formatRelativeDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "hoje";
    if (diff === 1) return "amanhã";
    if (diff < 7) return `em ${diff} dias`;
    return date.toLocaleDateString("pt-BR");
  };

  const getDayOfWeek = (dateStr: string) => {
    const days = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
    return days[new Date(dateStr + "T00:00").getDay()];
  };

  return (
    <motion.div {...sectionReveal} className="space-y-8">
      {/* Ministérios */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Ministérios</h2>
            <p className="text-sm text-muted-foreground">Selecionado: {congresso?.nome || "---"}</p>
          </div>
          <button className="text-sm text-primary font-medium hover:underline">Adicionar</button>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
            <Music className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">{congresso?.nome || "---"}</h3>
            <p className="text-sm text-muted-foreground">Escalas: {escalaCount.user}/{escalaCount.total}</p>
            <p className="text-sm text-muted-foreground">Músicas: {musicCount}</p>
            <p className="text-sm text-muted-foreground">Membros: {memberCount}</p>
          </div>
          <Check className="w-6 h-6 text-primary" />
        </div>
      </section>

      {/* Avisos */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Avisos ({destaqueAvisos}/{totalAvisos})</h2>
            <p className="text-sm text-muted-foreground">Em destaque</p>
          </div>
          <button onClick={() => onSectionChange("avisos")} className="text-sm text-primary font-medium hover:underline">Ver todos</button>
        </div>
        {avisos.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-6 flex items-center justify-center gap-2 text-muted-foreground">
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm">Lista vazia.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {avisos.map(aviso => (
              <div key={aviso.id} className="bg-card rounded-xl border border-border p-4">
                <h3 className="font-semibold text-foreground text-sm">{aviso.titulo}</h3>
                {aviso.conteudo && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{aviso.conteudo}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Minhas Escalas */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Minhas escalas ({escalas.length})</h2>
            <p className="text-sm text-muted-foreground">Próximas</p>
          </div>
          <button onClick={() => onSectionChange("escalas")} className="text-sm text-primary font-medium hover:underline">Ver todas</button>
        </div>

        {escalas.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-6 flex items-center justify-center gap-2 text-muted-foreground">
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm">Nenhuma escala próxima.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {escalas.map((escala) => (
              <div key={escala.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start gap-4">
                  <div className="text-center min-w-[50px]">
                    <span className="text-2xl font-bold text-primary">
                      {escala.data ? new Date(escala.data + "T00:00").getDate() : "--"}
                    </span>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      {escala.data ? new Date(escala.data + "T00:00").toLocaleString("pt-BR", { month: "short" }) : "---"}
                    </p>
                    {escala.data && (
                      <>
                        <p className="text-xs text-muted-foreground mt-1">{getDayOfWeek(escala.data)}</p>
                        {escala.hora && <p className="text-xs text-muted-foreground">{String(escala.hora).slice(0, 5)}</p>}
                      </>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary hover:underline cursor-pointer" onClick={() => onSectionChange("escalas")}>{escala.titulo}</h3>
                    <p className="text-sm text-muted-foreground">{formatRelativeDate(escala.data)}</p>
                    {escala.participantAvatars.length > 0 && (
                      <div className="flex items-center gap-0 mt-2">
                        {escala.participantAvatars.map((avatar, i) => (
                          <div
                            key={i}
                            className={`w-7 h-7 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-[10px] font-bold text-primary-foreground ring-2 ring-card ${i > 0 ? "-ml-1" : ""}`}
                            title={avatar.name}
                          >
                            {avatar.initials}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> {escala.confirmedCount}/{escala.totalParticipants}</span>
                      <span className="flex items-center gap-1"><Music className="w-4 h-4" /> {escala.musicCount}</span>
                      <ArrowRight className="w-4 h-4 cursor-pointer" onClick={() => onSectionChange("escalas")} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Aniversariantes */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Aniversariantes ({birthdays.length})</h2>
            <p className="text-sm text-muted-foreground">{currentMonthName}</p>
          </div>
          <button onClick={() => onSectionChange("aniversariantes")} className="text-sm text-primary font-medium hover:underline">Ver todos</button>
        </div>
        {birthdays.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <Cake className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Nenhum aniversariante neste mês</span>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <Cake className="w-5 h-5 text-primary" />
            <span className="text-sm text-foreground">{birthdays.length} aniversariante{birthdays.length !== 1 ? "s" : ""} neste mês</span>
          </div>
        )}
      </section>
    </motion.div>
  );
};

export default HomeContent;
