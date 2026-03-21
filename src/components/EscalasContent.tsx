import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, X, Filter, List, Info, Users, Music, Clock, ChevronRight, Shuffle, CalendarDays, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCongresso } from "@/hooks/useCongresso";
import { useToast } from "@/hooks/use-toast";

type EscalaTab = "proximas" | "anteriores";
type NovaEscalaTab = "detalhes" | "participantes" | "musicas" | "roteiro";

interface Escala {
  id: string;
  titulo: string;
  data: string | null;
  hora: string | null;
  observacoes: string | null;
  status: string;
  confirmacao: boolean;
  created_by: string;
}

const EscalasContent = () => {
  const [tab, setTab] = useState<EscalaTab>("proximas");
  const [showNovaEscala, setShowNovaEscala] = useState(false);
  const [novaTab, setNovaTab] = useState<NovaEscalaTab>("detalhes");
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ titulo: "", data: "", hora: "", observacoes: "", confirmacao: true });
  const { user } = useAuth();
  const { congresso } = useCongresso();
  const { toast } = useToast();

  const fetchEscalas = async () => {
    if (!congresso) return;
    const { data, error } = await supabase
      .from("escalas")
      .select("*")
      .eq("congresso_id", congresso.id)
      .order("data", { ascending: true });

    if (!error && data) setEscalas(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEscalas();
  }, [congresso]);

  const handleSalvar = async () => {
    if (!form.titulo.trim() || !user || !congresso) return;
    const { error } = await supabase.from("escalas").insert({
      congresso_id: congresso.id,
      titulo: form.titulo,
      data: form.data || null,
      hora: form.hora || null,
      observacoes: form.observacoes || null,
      confirmacao: form.confirmacao,
      created_by: user.id,
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Escala criada!" });
    setForm({ titulo: "", data: "", hora: "", observacoes: "", confirmacao: true });
    setShowNovaEscala(false);
    setNovaTab("detalhes");
    fetchEscalas();
  };

  const today = new Date().toISOString().split("T")[0];
  const proximas = escalas.filter((e) => !e.data || e.data >= today);
  const anteriores = escalas.filter((e) => e.data && e.data < today);
  const displayed = tab === "proximas" ? proximas : anteriores;

  if (showNovaEscala) {
    return (
      <NovaEscalaView
        novaTab={novaTab}
        setNovaTab={setNovaTab}
        form={form}
        setForm={(f) => setForm(f)}
        onClose={() => { setShowNovaEscala(false); setNovaTab("detalhes"); }}
        onSalvar={handleSalvar}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10">
      <div className="flex items-center justify-between mb-2">
        <div />
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Escalas</h1>
          <p className="text-sm text-muted-foreground">IEADE MÍDIA</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-muted-foreground hover:text-foreground"><Filter className="w-5 h-5" /></button>
          <button className="p-2 text-muted-foreground hover:text-foreground"><List className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex rounded-full border border-border overflow-hidden mb-8">
        <button onClick={() => setTab("proximas")} className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "proximas" ? "bg-accent text-accent-foreground" : "bg-card text-muted-foreground"}`}>Próximas</button>
        <button onClick={() => setTab("anteriores")} className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === "anteriores" ? "bg-accent text-accent-foreground" : "bg-card text-muted-foreground"}`}>Anteriores</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><p className="text-muted-foreground">Carregando...</p></div>
      ) : displayed.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16">
          <div className="w-40 h-40 rounded-full bg-accent flex items-center justify-center mb-6">
            <CalendarDays className="w-16 h-16 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">Lista vazia.</p>
          <p className="text-sm text-muted-foreground mt-1">Para cadastrar uma escala, toque no botão:</p>
          <p className="text-sm text-muted-foreground">( + )</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {displayed.map((escala) => (
            <div key={escala.id} className="bg-card rounded-xl border border-border p-4 flex items-start gap-4">
              <div className="text-center min-w-[50px]">
                <span className="text-2xl font-bold text-primary">
                  {escala.data ? new Date(escala.data + "T00:00").getDate() : "--"}
                </span>
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  {escala.data ? new Date(escala.data + "T00:00").toLocaleString("pt-BR", { month: "short" }) : "---"}
                </p>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{escala.titulo}</h3>
                <p className="text-sm text-muted-foreground">{escala.hora || "Horário não definido"}</p>
              </div>
              <span className="text-xs text-muted-foreground bg-accent px-2 py-1 rounded">{escala.status}</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setShowNovaEscala(true)} className="fixed bottom-6 right-6 flex items-center gap-2 bg-accent hover:bg-accent/80 text-accent-foreground px-5 py-3 rounded-xl shadow-lg transition-colors">
        <Plus className="w-5 h-5" /> Adicionar
      </button>
    </div>
  );
};

interface NovaEscalaProps {
  novaTab: NovaEscalaTab;
  setNovaTab: (t: NovaEscalaTab) => void;
  form: { titulo: string; data: string; hora: string; observacoes: string; confirmacao: boolean };
  setForm: (f: { titulo: string; data: string; hora: string; observacoes: string; confirmacao: boolean }) => void;
  onClose: () => void;
  onSalvar: () => void;
}

const NovaEscalaView = ({ novaTab, setNovaTab, form, setForm, onClose, onSalvar }: NovaEscalaProps) => {
  const tabs: { id: NovaEscalaTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "detalhes", label: "Detalhes", icon: <Info className="w-5 h-5" /> },
    { id: "participantes", label: "Participantes", icon: <Users className="w-5 h-5" />, count: 0 },
    { id: "musicas", label: "Músicas", icon: <Music className="w-5 h-5" />, count: 0 },
    { id: "roteiro", label: "Roteiro", icon: <Clock className="w-5 h-5" />, count: 0 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto p-6 lg:p-10">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onClose} className="text-foreground hover:text-muted-foreground"><X className="w-6 h-6" /></button>
        <h1 className="text-xl font-semibold text-foreground">Nova escala</h1>
        <div className="w-6" />
      </div>

      <div className="flex bg-card rounded-xl border border-border p-1 mb-6">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setNovaTab(t.id)} className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg text-xs font-medium transition-colors ${novaTab === t.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t.icon}
            <span className="flex items-center gap-1">
              {t.count !== undefined && <span>{t.count}</span>}
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {novaTab === "detalhes" && (
        <div className="space-y-4">
          <div className="relative">
            <Input placeholder="Título *" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="h-12 rounded-lg pl-10" />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg font-bold">T</span>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="h-12 rounded-lg pl-10" />
              <label className="absolute -top-2.5 left-3 bg-card px-1 text-xs text-muted-foreground">Data</label>
            </div>
            <div className="w-36 relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} className="h-12 rounded-lg pl-10" />
              <label className="absolute -top-2.5 left-3 bg-card px-1 text-xs text-muted-foreground">Hora</label>
            </div>
          </div>
          <div className="relative">
            <Input placeholder="Observações" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value.slice(0, 500) })} className="h-12 rounded-lg pl-10" />
            <List className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{form.observacoes.length}/500</span>
          </div>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-3">
              <div><p className="text-sm font-medium text-foreground">Status</p><p className="text-xs text-primary">Rascunho</p></div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-medium text-foreground">Solicitar confirmação dos participantes</p>
              <Switch checked={form.confirmacao} onCheckedChange={(v) => setForm({ ...form, confirmacao: v })} />
            </div>
          </div>
        </div>
      )}

      {novaTab === "participantes" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button className="rounded-lg"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
            <Button variant="outline" className="rounded-lg"><Users className="w-4 h-4 mr-1" /> Equipes</Button>
            <Button variant="outline" className="rounded-lg"><Shuffle className="w-4 h-4 mr-1" /> Sortear</Button>
          </div>
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-40 h-40 rounded-full bg-accent flex items-center justify-center mb-6"><Users className="w-16 h-16 text-muted-foreground" /></div>
            <p className="text-sm text-muted-foreground">Para adicionar um participante, toque no botão:</p>
            <p className="text-sm text-muted-foreground">( + Adicionar )</p>
          </div>
        </div>
      )}

      {novaTab === "musicas" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button className="rounded-lg"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
            <Button variant="outline" className="rounded-lg"><Shuffle className="w-4 h-4 mr-1" /> Sortear</Button>
          </div>
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-40 h-40 rounded-full bg-accent flex items-center justify-center mb-6"><Music className="w-16 h-16 text-muted-foreground" /></div>
            <p className="text-sm text-muted-foreground">Para adicionar uma música, toque no botão:</p>
            <p className="text-sm text-muted-foreground">( + Adicionar )</p>
          </div>
        </div>
      )}

      {novaTab === "roteiro" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-lg"><Plus className="w-4 h-4 mr-1" /> Evento</Button>
            <Button variant="outline" className="rounded-lg"><List className="w-4 h-4 mr-1" /> Modelos</Button>
          </div>
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-40 h-40 rounded-full bg-accent flex items-center justify-center mb-6"><Clock className="w-16 h-16 text-muted-foreground" /></div>
            <p className="text-sm text-muted-foreground">Nenhum item adicionado ao roteiro.</p>
          </div>
        </div>
      )}

      <button onClick={onSalvar} className="fixed bottom-6 right-6 flex items-center gap-2 bg-accent hover:bg-accent/80 text-accent-foreground px-5 py-3 rounded-xl shadow-lg transition-colors">
        <span className="text-lg">✓</span> Salvar
      </button>
    </motion.div>
  );
};

export default EscalasContent;
