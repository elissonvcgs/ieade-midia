import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Calendar,
  Music,
  UserPlus,
  ThumbsUp,
  UserX,
  UserCog,
  ChevronDown,
  Search,
  X,
  Check,
  ClipboardList,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCongresso } from "@/hooks/useCongresso";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  onBack: () => void;
}

type EscalaRow = {
  id: string;
  titulo: string;
  data: string | null;
  hora: string | null;
};

type ParticipanteRow = {
  escala_id: string;
  user_id: string;
  confirmado: boolean | null;
};

type MusicaRow = {
  escala_id: string;
  nome: string;
};

type Member = { user_id: string; name: string };

const WEEKDAYS = [
  { id: 0, short: "DOM", label: "Domingo" },
  { id: 1, short: "SEG", label: "Segunda" },
  { id: 2, short: "TER", label: "Terça" },
  { id: 3, short: "QUA", label: "Quarta" },
  { id: 4, short: "QUI", label: "Quinta" },
  { id: 5, short: "SEX", label: "Sexta" },
  { id: 6, short: "SAB", label: "Sábado" },
];

type PeriodPreset = "7d" | "1m" | "atual" | "3m" | "custom";

const PRESETS: { id: PeriodPreset; label: string }[] = [
  { id: "7d", label: "7 dias" },
  { id: "1m", label: "1 mês" },
  { id: "atual", label: "mês atual" },
  { id: "3m", label: "3 meses" },
];

function presetRange(preset: PeriodPreset): { from: Date; to: Date } {
  const today = new Date();
  switch (preset) {
    case "7d":
      return { from: subDays(today, 7), to: today };
    case "1m":
      return { from: subMonths(today, 1), to: today };
    case "atual":
      return { from: startOfMonth(today), to: endOfMonth(today) };
    case "3m":
      return { from: subMonths(today, 3), to: today };
    default:
      return { from: subDays(today, 7), to: today };
  }
}

const VisaoGeralContent = ({ onBack }: Props) => {
  const { congresso } = useCongresso();
  const [loading, setLoading] = useState(true);

  // Data
  const [escalas, setEscalas] = useState<EscalaRow[]>([]);
  const [participantes, setParticipantes] = useState<ParticipanteRow[]>([]);
  const [musicas, setMusicas] = useState<MusicaRow[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [funcoesCount, setFuncoesCount] = useState<Record<string, number>>({});

  // Filters (applied)
  const [preset, setPreset] = useState<PeriodPreset>("7d");
  const initial = presetRange("7d");
  const [from, setFrom] = useState<Date>(initial.from);
  const [to, setTo] = useState<Date>(initial.to);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [hourRange, setHourRange] = useState<[number, number]>([0, 23]);
  const [memberIds, setMemberIds] = useState<string[]>([]);

  // Pending filter state (in panel) — applied with "Aplicar"
  const [pending, setPending] = useState({
    preset,
    from,
    to,
    weekdays,
    hourRange,
    memberIds,
  });

  // Drill-down
  const [openDetail, setOpenDetail] = useState<null | string>(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [weekdayDialogOpen, setWeekdayDialogOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  useEffect(() => {
    if (!congresso) return;
    const load = async () => {
      setLoading(true);

      const [escalasRes, membersRes] = await Promise.all([
        supabase
          .from("escalas")
          .select("id, titulo, data, hora")
          .eq("congresso_id", congresso.id),
        supabase
          .from("congresso_members")
          .select("user_id")
          .eq("congresso_id", congresso.id),
      ]);

      const escalaList = (escalasRes.data || []) as EscalaRow[];
      setEscalas(escalaList);

      const memberUserIds = (membersRes.data || []).map((m: any) => m.user_id);
      let memberList: Member[] = [];
      if (memberUserIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, name")
          .in("user_id", memberUserIds);
        memberList = (profs || []).map((p: any) => ({ user_id: p.user_id, name: p.name }));
      }
      setMembers(memberList);

      // funcoes per user
      const { data: funcRows } = await supabase
        .from("membro_funcoes")
        .select("user_id")
        .eq("congresso_id", congresso.id);
      const counts: Record<string, number> = {};
      (funcRows || []).forEach((r: any) => {
        counts[r.user_id] = (counts[r.user_id] || 0) + 1;
      });
      setFuncoesCount(counts);

      const ids = escalaList.map((e) => e.id);
      if (ids.length > 0) {
        const [partsRes, musRes] = await Promise.all([
          supabase
            .from("escala_participantes")
            .select("escala_id, user_id, confirmado")
            .in("escala_id", ids),
          supabase
            .from("escala_musicas")
            .select("escala_id, nome")
            .in("escala_id", ids),
        ]);
        setParticipantes((partsRes.data || []) as ParticipanteRow[]);
        setMusicas((musRes.data || []) as MusicaRow[]);
      } else {
        setParticipantes([]);
        setMusicas([]);
      }

      setLoading(false);
    };
    load();
  }, [congresso]);

  // Filtered escalas (by applied filters)
  const filteredEscalas = useMemo(() => {
    return escalas.filter((e) => {
      if (!e.data) return false;
      const d = new Date(e.data + "T00:00:00");
      if (d < new Date(from.getFullYear(), from.getMonth(), from.getDate())) return false;
      if (d > new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59)) return false;
      if (weekdays.length > 0 && !weekdays.includes(d.getDay())) return false;
      if (e.hora) {
        const h = parseInt(String(e.hora).slice(0, 2), 10);
        if (h < hourRange[0] || h > hourRange[1]) return false;
      }
      if (memberIds.length > 0) {
        const escalaMembers = participantes.filter((p) => p.escala_id === e.id).map((p) => p.user_id);
        if (!escalaMembers.some((id) => memberIds.includes(id))) return false;
      }
      return true;
    });
  }, [escalas, from, to, weekdays, hourRange, memberIds, participantes]);

  const filteredEscalaIds = useMemo(() => new Set(filteredEscalas.map((e) => e.id)), [filteredEscalas]);

  const filteredParticipantes = useMemo(
    () => participantes.filter((p) => filteredEscalaIds.has(p.escala_id) && (memberIds.length === 0 || memberIds.includes(p.user_id))),
    [participantes, filteredEscalaIds, memberIds]
  );

  const filteredMusicas = useMemo(
    () => musicas.filter((m) => filteredEscalaIds.has(m.escala_id)),
    [musicas, filteredEscalaIds]
  );

  // Stats
  const escalasCount = filteredEscalas.length;
  const musicasCount = filteredMusicas.length;
  const escaladosUnicos = new Set(filteredParticipantes.map((p) => p.user_id)).size;
  const totalMembros = memberIds.length > 0 ? memberIds.length : members.length;
  const totalEscalacoes = filteredParticipantes.length;
  const confirmadas = filteredParticipantes.filter((p) => p.confirmado).length;
  const faltas = filteredParticipantes.filter((p) => p.confirmado === false).length;
  const confirmacoesPct = totalEscalacoes > 0 ? Math.round((confirmadas / totalEscalacoes) * 100) : 0;
  const faltasPct = totalEscalacoes > 0 ? Math.round((faltas / totalEscalacoes) * 100) : 0;
  const membrosEscaladosPct = totalMembros > 0 ? Math.round((escaladosUnicos / totalMembros) * 100) : 0;
  const funcoesAssociadasTotal = (memberIds.length > 0 ? memberIds : members.map((m) => m.user_id)).reduce(
    (acc, id) => acc + (funcoesCount[id] || 0),
    0
  );

  const apply = () => {
    setPreset(pending.preset);
    setFrom(pending.from);
    setTo(pending.to);
    setWeekdays(pending.weekdays);
    setHourRange(pending.hourRange);
    setMemberIds(pending.memberIds);
  };

  const clearFilters = () => {
    const r = presetRange("7d");
    const next = { preset: "7d" as PeriodPreset, from: r.from, to: r.to, weekdays: [] as number[], hourRange: [0, 23] as [number, number], memberIds: [] as string[] };
    setPending(next);
    setPreset(next.preset);
    setFrom(next.from);
    setTo(next.to);
    setWeekdays(next.weekdays);
    setHourRange(next.hourRange);
    setMemberIds(next.memberIds);
  };

  const setPendingPreset = (p: PeriodPreset) => {
    const r = presetRange(p);
    setPending((s) => ({ ...s, preset: p, from: r.from, to: r.to }));
  };

  const toggleWeekday = (id: number) => {
    setPending((s) => ({
      ...s,
      weekdays: s.weekdays.includes(id) ? s.weekdays.filter((x) => x !== id) : [...s.weekdays, id],
    }));
  };

  const toggleMember = (id: string) => {
    setPending((s) => ({
      ...s,
      memberIds: s.memberIds.includes(id) ? s.memberIds.filter((x) => x !== id) : [...s.memberIds, id],
    }));
  };

  const selectAllMembers = () => {
    const filtered = members.filter((m) => m.name.toLowerCase().includes(memberSearch.toLowerCase()));
    const ids = filtered.map((m) => m.user_id);
    const allSelected = ids.every((id) => pending.memberIds.includes(id));
    setPending((s) => ({
      ...s,
      memberIds: allSelected ? s.memberIds.filter((id) => !ids.includes(id)) : Array.from(new Set([...s.memberIds, ...ids])),
    }));
  };

  const memberById = (id: string) => members.find((m) => m.user_id === id);

  // Card definitions
  const cards = [
    {
      id: "escalas",
      label: "Escalas",
      value: String(escalasCount),
      icon: Calendar,
      highlight: true,
    },
    { id: "musicas", label: "Músicas selecionadas", value: String(musicasCount), icon: Music },
    {
      id: "membros",
      label: "Membros escalados",
      value: `${escaladosUnicos}/${totalMembros}`,
      icon: UserPlus,
      progress: membrosEscaladosPct,
    },
    { id: "total", label: "Total de escalações", value: String(totalEscalacoes), icon: UserPlus },
    {
      id: "confirmacoes",
      label: "Confirmações de presença",
      value: String(confirmadas),
      icon: ThumbsUp,
      progress: confirmacoesPct,
    },
    {
      id: "faltas",
      label: "Faltas",
      value: String(faltas),
      icon: ThumbsUp,
      progress: faltasPct,
    },
    { id: "indisponibilidades", label: "Indisponibilidades", value: "0", icon: UserX },
    { id: "funcoes", label: "Funções associadas", value: String(funcoesAssociadasTotal), icon: UserCog },
  ];

  const filteredMembersList = members.filter((m) => m.name?.toLowerCase().includes(memberSearch.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex gap-6 min-h-[80vh]">
      {/* Main content */}
      <div className="flex-1 relative">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-foreground">Visão geral</h2>
          <div className="w-5" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  onClick={() => setOpenDetail(c.id)}
                  className={cn(
                    "rounded-xl border border-border p-4 text-left flex flex-col h-36 transition-colors hover:bg-muted/40",
                    c.highlight ? "bg-primary/15 border-primary/30" : "bg-card"
                  )}
                >
                  <div className="text-3xl font-semibold text-foreground">{c.value}</div>
                  <div className="mt-2 text-sm text-foreground/90 leading-tight">{c.label}</div>
                  <div className="mt-auto flex items-center gap-2">
                    {c.progress !== undefined && (
                      <div className="flex-1">
                        <div className="text-[10px] text-muted-foreground mb-1">{c.progress}%</div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${c.progress}%` }} />
                        </div>
                      </div>
                    )}
                    {c.progress === undefined && <Icon className="w-4 h-4 text-muted-foreground" />}
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filters Sidebar */}
      <aside className="w-72 shrink-0 hidden md:flex flex-col border-l border-border pl-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
          <button onClick={clearFilters} className="text-sm text-primary hover:underline">Limpar</button>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto pr-1">
          {/* Período */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">PERÍODO</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPendingPreset(p.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    pending.preset === p.id ? "bg-primary/20 border-primary/50 text-foreground" : "bg-card border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <DateField label="de" value={pending.from} onChange={(d) => setPending((s) => ({ ...s, from: d, preset: "custom" }))} />
              <DateField label="até" value={pending.to} onChange={(d) => setPending((s) => ({ ...s, to: d, preset: "custom" }))} />
            </div>
          </div>

          {/* Dias da semana */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">DIAS DA SEMANA</p>
            <button
              onClick={() => setWeekdayDialogOpen(true)}
              className="w-full flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <span>{pending.weekdays.length === 0 ? "Todos" : pending.weekdays.map((id) => WEEKDAYS[id].short).join(", ")}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Horas */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">HORAS</p>
            <Slider
              min={0}
              max={23}
              step={1}
              value={pending.hourRange}
              onValueChange={(v) => setPending((s) => ({ ...s, hourRange: [v[0], v[1]] as [number, number] }))}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{String(pending.hourRange[0]).padStart(2, "0")}h</span>
              <span>{String(pending.hourRange[1]).padStart(2, "0")}h</span>
            </div>
          </div>

          {/* Membros */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">MEMBROS</p>
            <button
              onClick={() => setMemberDialogOpen(true)}
              className="w-full flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <span>{pending.memberIds.length === 0 ? "Todos" : `${pending.memberIds.length} selecionado(s)`}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <Button onClick={apply} className="mt-4 w-full rounded-full">
          <Check className="w-4 h-4 mr-2" /> Aplicar
        </Button>
      </aside>

      {/* Detail Sheet */}
      <Sheet open={!!openDetail} onOpenChange={(o) => !o && setOpenDetail(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-card border-l border-border">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 uppercase text-foreground">
              {cardLabel(openDetail)}
              <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                {detailItems(openDetail, {
                  escalas: filteredEscalas,
                  musicas: filteredMusicas,
                  participantes: filteredParticipantes,
                  members,
                  memberIds,
                  funcoesCount,
                }).length}
              </span>
            </SheetTitle>
          </SheetHeader>
          <DetailList
            cardId={openDetail}
            items={detailItems(openDetail, {
              escalas: filteredEscalas,
              musicas: filteredMusicas,
              participantes: filteredParticipantes,
              members,
              memberIds,
              funcoesCount,
            })}
            memberById={memberById}
            escalas={filteredEscalas}
          />
        </SheetContent>
      </Sheet>

      {/* Member selection dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="bg-card max-w-md p-0">
          <div className="flex justify-end p-3">
            <button onClick={() => setMemberDialogOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-4 pb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-9 rounded-full bg-background"
              />
            </div>
            <button
              onClick={selectAllMembers}
              className="w-full text-center text-sm font-medium text-primary border border-primary/40 rounded-full py-2 hover:bg-primary/10 transition-colors"
            >
              Selecionar todos
            </button>
            <div className="max-h-80 overflow-y-auto space-y-1">
              {filteredMembersList.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum membro encontrado</p>
              )}
              {filteredMembersList.map((m) => {
                const selected = pending.memberIds.includes(m.user_id);
                const initials = m.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
                const f = funcoesCount[m.user_id] || 0;
                return (
                  <button
                    key={m.user_id}
                    onClick={() => toggleMember(m.user_id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
                      selected ? "bg-primary/15" : "hover:bg-muted"
                    )}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">{initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{f === 0 ? "Nenhuma função atribuída." : `${f} função(ões)`}</p>
                    </div>
                    {selected && <Check className="w-4 h-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Weekday dialog */}
      <Dialog open={weekdayDialogOpen} onOpenChange={setWeekdayDialogOpen}>
        <DialogContent className="bg-card max-w-xs p-0">
          <div className="flex justify-end p-3">
            <button onClick={() => setWeekdayDialogOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-4 pb-4 space-y-1">
            {WEEKDAYS.map((w) => {
              const selected = pending.weekdays.includes(w.id);
              return (
                <button
                  key={w.id}
                  onClick={() => toggleWeekday(w.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-lg transition-colors",
                    selected ? "bg-primary/15 text-foreground" : "hover:bg-muted text-foreground"
                  )}
                >
                  <span className="text-sm">{w.label}</span>
                  {selected && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

const DateField = ({ label, value, onChange }: { label: string; value: Date; onChange: (d: Date) => void }) => (
  <label className="block bg-card border border-border rounded-full px-3 py-2 cursor-pointer">
    <span className="block text-[10px] text-muted-foreground">{label}:</span>
    <input
      type="date"
      value={format(value, "yyyy-MM-dd")}
      onChange={(e) => onChange(new Date(e.target.value + "T00:00:00"))}
      className="bg-transparent text-xs text-foreground outline-none w-full"
    />
  </label>
);

function cardLabel(id: string | null): string {
  switch (id) {
    case "escalas": return "Escalas";
    case "musicas": return "Músicas selecionadas";
    case "membros": return "Membros escalados";
    case "total": return "Total de escalações";
    case "confirmacoes": return "Confirmações de presença";
    case "faltas": return "Faltas";
    case "indisponibilidades": return "Indisponibilidades";
    case "funcoes": return "Funções associadas";
    default: return "";
  }
}

function detailItems(
  id: string | null,
  data: {
    escalas: EscalaRow[];
    musicas: MusicaRow[];
    participantes: ParticipanteRow[];
    members: Member[];
    memberIds: string[];
    funcoesCount: Record<string, number>;
  }
): any[] {
  if (!id) return [];
  switch (id) {
    case "escalas":
      return data.escalas;
    case "musicas":
      return data.musicas;
    case "total":
      return data.participantes;
    case "confirmacoes":
      return data.participantes.filter((p) => p.confirmado);
    case "faltas":
      return data.participantes.filter((p) => p.confirmado === false);
    case "membros": {
      const escaladosIds = new Set(data.participantes.map((p) => p.user_id));
      return data.members.filter((m) => escaladosIds.has(m.user_id));
    }
    case "funcoes": {
      const ids = data.memberIds.length > 0 ? data.memberIds : data.members.map((m) => m.user_id);
      return data.members.filter((m) => ids.includes(m.user_id) && (data.funcoesCount[m.user_id] || 0) > 0);
    }
    case "indisponibilidades":
      return [];
    default:
      return [];
  }
}

const DetailList = ({
  cardId,
  items,
  memberById,
  escalas,
}: {
  cardId: string | null;
  items: any[];
  memberById: (id: string) => Member | undefined;
  escalas: EscalaRow[];
}) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <div className="w-20 h-20 rounded-full bg-muted/40 flex items-center justify-center mb-3">
          <ClipboardList className="w-10 h-10 text-primary/60" />
        </div>
        <p className="text-sm">Lista vazia.</p>
      </div>
    );
  }

  const escalaMap = new Map(escalas.map((e) => [e.id, e]));

  return (
    <div className="mt-4 space-y-2 max-h-[80vh] overflow-y-auto pr-2">
      {items.map((item, idx) => {
        if (cardId === "escalas") {
          const e = item as EscalaRow;
          return (
            <div key={e.id} className="bg-muted/30 rounded-lg p-3">
              <p className="text-sm font-medium text-foreground">{e.titulo}</p>
              <p className="text-xs text-muted-foreground">
                {e.data ? format(new Date(e.data + "T00:00:00"), "dd 'de' MMM", { locale: ptBR }) : "Sem data"}
                {e.hora ? ` · ${String(e.hora).slice(0, 5)}` : ""}
              </p>
            </div>
          );
        }
        if (cardId === "musicas") {
          const m = item as MusicaRow;
          const e = escalaMap.get(m.escala_id);
          return (
            <div key={idx} className="bg-muted/30 rounded-lg p-3">
              <p className="text-sm font-medium text-foreground">{m.nome}</p>
              {e && <p className="text-xs text-muted-foreground">{e.titulo}</p>}
            </div>
          );
        }
        if (cardId === "membros" || cardId === "funcoes") {
          const m = item as Member;
          const initials = m.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
          return (
            <div key={m.user_id} className="bg-muted/30 rounded-lg p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">{initials}</div>
              <p className="text-sm text-foreground">{m.name}</p>
            </div>
          );
        }
        // total / confirmacoes / faltas
        const p = item as ParticipanteRow;
        const m = memberById(p.user_id);
        const e = escalaMap.get(p.escala_id);
        const initials = m?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
        return (
          <div key={idx} className="bg-muted/30 rounded-lg p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">{initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">{m?.name || "Membro"}</p>
              <p className="text-xs text-muted-foreground truncate">{e?.titulo}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VisaoGeralContent;