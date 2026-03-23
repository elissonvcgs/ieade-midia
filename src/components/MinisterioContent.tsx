import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, UserCog, Tags, Eye, EyeOff, Lock, Plus, X, Trash2, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCongresso } from "@/hooks/useCongresso";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Profile {
  user_id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
}

interface Funcao {
  id: string;
  nome: string;
}

interface MembroFuncao {
  user_id: string;
  funcao_id: string;
  funcoes: { nome: string } | null;
}

interface Member {
  user_id: string;
  role: string;
  profile: Profile | null;
  funcoes: string[];
}

const CLASSIFICACOES = [
  { nome: "Louvor", desc: "São cânticos cujas letras expressam elogio e agradecimento por aquilo que Deus fez, faz ou fará." },
  { nome: "Adoração", desc: "São cânticos cujas letras expressam reconhecimento a Deus por aquilo que Ele é." },
  { nome: "Contemplação", desc: "São cânticos cujas letras se concentram em meditar (contemplar) a Pessoa de Deus (Seu caráter, Sua natureza e Suas qualidades)." },
  { nome: "Consagração", desc: "São cânticos cujas letras tratam da dedicação de nossas vidas a Deus, da nossa Santificação, etc." },
  { nome: "Alegria", desc: "(Júbilo) — São cânticos cujas letras expressam alegria pelo Senhor, pelos Seus feitos, etc." },
  { nome: "Especiais", desc: "São cânticos cujas letras tratam de temas como casamento, batizados, etc." },
];

const DEFAULT_FUNCOES = [
  "Vocalista", "Ministro", "Violão", "Guitarra", "Baixo",
  "Bateria", "Teclado", "Piano", "Violino", "Mesa de som",
  "Projeção", "Iluminação", "Transmissão",
];

const MinisterioContent = () => {
  const { congresso } = useCongresso();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"info" | "membros">("info");
  const [members, setMembers] = useState<Member[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Sub-pages
  const [subPage, setSubPage] = useState<"main" | "funcoes" | "classificacoes" | null>("main");
  const [newFuncao, setNewFuncao] = useState("");
  const [showAddFuncao, setShowAddFuncao] = useState(false);

  // Assign function dialog
  const [assignDialog, setAssignDialog] = useState<{ memberId: string; memberName: string } | null>(null);
  const [memberFuncoes, setMemberFuncoes] = useState<string[]>([]);

  useEffect(() => {
    if (!congresso || !user) return;
    loadData();
  }, [congresso, user]);

  const loadData = async () => {
    if (!congresso || !user) return;
    setLoading(true);

    // Check admin
    const { data: myMembership } = await supabase
      .from("congresso_members")
      .select("role")
      .eq("congresso_id", congresso.id)
      .eq("user_id", user.id)
      .maybeSingle();
    setIsAdmin(myMembership?.role === "admin");

    // Load members
    const { data: membersData } = await supabase
      .from("congresso_members")
      .select("user_id, role")
      .eq("congresso_id", congresso.id);

    // Load profiles
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, name, email, avatar_url");

    // Load funcoes
    const { data: funcoesData } = await supabase
      .from("funcoes")
      .select("id, nome")
      .eq("congresso_id", congresso.id);
    setFuncoes(funcoesData || []);

    // Load membro_funcoes
    const { data: membroFuncoesData } = await supabase
      .from("membro_funcoes")
      .select("user_id, funcao_id, funcoes(nome)")
      .eq("congresso_id", congresso.id) as { data: MembroFuncao[] | null };

    // Build members list
    const profileMap = new Map((profilesData || []).map(p => [p.user_id, p]));
    const funcaoMap = new Map<string, string[]>();
    (membroFuncoesData || []).forEach(mf => {
      const list = funcaoMap.get(mf.user_id) || [];
      if (mf.funcoes?.nome) list.push(mf.funcoes.nome);
      funcaoMap.set(mf.user_id, list);
    });

    const built: Member[] = (membersData || []).map(m => ({
      user_id: m.user_id,
      role: m.role,
      profile: profileMap.get(m.user_id) || null,
      funcoes: funcaoMap.get(m.user_id) || [],
    }));
    built.sort((a, b) => (a.profile?.name || "").localeCompare(b.profile?.name || ""));
    setMembers(built);
    setLoading(false);
  };

  const addFuncao = async () => {
    if (!newFuncao.trim() || !congresso) return;
    const { error } = await supabase.from("funcoes").insert({
      congresso_id: congresso.id,
      nome: newFuncao.trim(),
    });
    if (error) { toast.error("Erro ao adicionar função"); return; }
    toast.success("Função adicionada");
    setNewFuncao("");
    setShowAddFuncao(false);
    loadData();
  };

  const deleteFuncao = async (id: string) => {
    const { error } = await supabase.from("funcoes").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover"); return; }
    loadData();
  };

  const seedDefaultFuncoes = async () => {
    if (!congresso) return;
    const inserts = DEFAULT_FUNCOES.map(nome => ({ congresso_id: congresso.id, nome }));
    const { error } = await supabase.from("funcoes").insert(inserts);
    if (error) { toast.error("Erro ao criar funções padrão"); return; }
    toast.success("Funções padrão criadas");
    loadData();
  };

  const openAssignDialog = (memberId: string, memberName: string) => {
    const member = members.find(m => m.user_id === memberId);
    setMemberFuncoes(member?.funcoes || []);
    setAssignDialog({ memberId, memberName });
  };

  const toggleMemberFuncao = async (funcaoNome: string, funcaoId: string) => {
    if (!assignDialog || !congresso) return;
    const has = memberFuncoes.includes(funcaoNome);

    if (has) {
      // Remove
      const { data: existing } = await supabase
        .from("membro_funcoes")
        .select("id")
        .eq("user_id", assignDialog.memberId)
        .eq("funcao_id", funcaoId)
        .maybeSingle();
      if (existing) {
        await supabase.from("membro_funcoes").delete().eq("id", existing.id);
      }
      setMemberFuncoes(prev => prev.filter(f => f !== funcaoNome));
    } else {
      // Add
      const { error } = await supabase.from("membro_funcoes").insert({
        congresso_id: congresso.id,
        user_id: assignDialog.memberId,
        funcao_id: funcaoId,
      });
      if (error) { toast.error("Erro ao atribuir função"); return; }
      setMemberFuncoes(prev => [...prev, funcaoNome]);
    }
    loadData();
  };

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Carregando...</div>;
  }

  // Sub-pages
  if (subPage === "funcoes") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSubPage("main")} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          <h2 className="text-xl font-semibold text-foreground flex-1 text-center">Funções</h2>
          <div className="w-5" />
        </div>
        <p className="text-sm text-muted-foreground text-center mb-4">{congresso?.nome}</p>

        {funcoes.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <p className="text-muted-foreground text-sm">Nenhuma função cadastrada.</p>
            {isAdmin && (
              <Button variant="outline" onClick={seedDefaultFuncoes}>Criar funções padrão</Button>
            )}
          </div>
        )}

        <div className="space-y-2">
          {funcoes.map(f => (
            <div key={f.id} className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3">
              <span className="text-sm text-foreground">{f.nome}</span>
              {isAdmin && (
                <button onClick={() => deleteFuncao(f.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {isAdmin && (
          showAddFuncao ? (
            <div className="flex gap-2">
              <Input value={newFuncao} onChange={e => setNewFuncao(e.target.value)} placeholder="Nome da função" onKeyDown={e => e.key === "Enter" && addFuncao()} />
              <Button onClick={addFuncao} size="sm">Adicionar</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAddFuncao(false)}>Cancelar</Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setShowAddFuncao(true)}>
              <Plus className="w-4 h-4 mr-2" /> Adicionar função
            </Button>
          )
        )}
      </motion.div>
    );
  }

  if (subPage === "classificacoes") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSubPage("main")} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          <h2 className="text-xl font-semibold text-foreground flex-1 text-center">Classificações</h2>
          <div className="w-5" />
        </div>

        {CLASSIFICACOES.map(c => (
          <div key={c.nome} className="border-b border-border pb-4 last:border-0">
            <h3 className="font-semibold text-foreground">{c.nome}</h3>
            <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
          </div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">Ministério</h2>
        <p className="text-sm text-muted-foreground">{congresso?.nome}</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-lg p-1">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "info" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          Informações
        </button>
        <button
          onClick={() => setActiveTab("membros")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "membros" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          Membros ({members.length})
        </button>
      </div>

      {activeTab === "info" ? (
        <div className="space-y-4">
          {/* Congresso banner */}
          <div className="bg-muted rounded-xl h-40 flex items-end p-4">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <span className="text-lg">🎵</span>
              <span>{congresso?.nome}</span>
            </div>
          </div>

          {/* Menu items */}
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            <button onClick={() => setSubPage("funcoes")} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors">
              <UserCog className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left text-sm text-foreground">Funções</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => setSubPage("classificacoes")} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors">
              <Tags className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left text-sm text-foreground">Classificações</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Código */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-foreground">Código:</span>
              <span className="text-sm font-mono text-foreground tracking-widest">
                {showCode ? congresso?.codigo : "• • • •"}
              </span>
              <button onClick={() => setShowCode(!showCode)} className="ml-auto text-muted-foreground hover:text-foreground">
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Acesso por código</p>
                <p className="text-xs text-muted-foreground">Membros podem entrar no ministério utilizando o código</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Members tab */
        <div className="space-y-2">
          {members.map(m => (
            <div
              key={m.user_id}
              className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => isAdmin ? openAssignDialog(m.user_id, m.profile?.name || "Membro") : undefined}
            >
              {m.profile?.avatar_url ? (
                <img src={m.profile.avatar_url} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs">
                  {initials(m.profile?.name || "?")}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{m.profile?.name}</p>
                {m.funcoes.length > 0 && (
                  <p className="text-xs text-muted-foreground truncate">{m.funcoes.join(", ")}</p>
                )}
                {m.role === "admin" && (
                  <p className="text-xs text-primary font-medium">Administrador</p>
                )}
              </div>
              {isAdmin && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          ))}
        </div>
      )}

      {/* Assign funcoes dialog */}
      <Dialog open={!!assignDialog} onOpenChange={() => setAssignDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Funções de {assignDialog?.memberName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {funcoes.map(f => {
              const active = memberFuncoes.includes(f.nome);
              return (
                <button
                  key={f.id}
                  onClick={() => toggleMemberFuncao(f.nome, f.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${active ? "bg-primary/10 border-primary text-primary" : "border-border hover:bg-muted"}`}
                >
                  <span className="text-sm">{f.nome}</span>
                  {active && <span className="ml-auto text-xs">✓</span>}
                </button>
              );
            })}
            {funcoes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma função cadastrada. Vá em Funções para criar.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default MinisterioContent;
