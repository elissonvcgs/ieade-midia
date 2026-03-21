import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCongresso } from "@/hooks/useCongresso";
import { useToast } from "@/hooks/use-toast";

type Tab = "ingressar" | "cadastrar";

const generateCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const Congresso = () => {
  const [activeTab, setActiveTab] = useState<Tab>("ingressar");
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCongresso } = useCongresso();
  const { toast } = useToast();

  const handleIngressar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !user) return;
    setLoading(true);

    const { data: congresso, error } = await supabase
      .from("congressos")
      .select("*")
      .eq("codigo", codigo.trim().toUpperCase())
      .maybeSingle();

    if (error || !congresso) {
      toast({ title: "Erro", description: "Código de congresso não encontrado.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("congresso_members")
      .select("id")
      .eq("congresso_id", congresso.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      const { error: joinError } = await supabase
        .from("congresso_members")
        .insert({ congresso_id: congresso.id, user_id: user.id });

      if (joinError) {
        toast({ title: "Erro", description: joinError.message, variant: "destructive" });
        setLoading(false);
        return;
      }
    }

    setCongresso(congresso);
    setLoading(false);
    navigate("/dashboard");
  };

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !user) return;
    setLoading(true);

    const codigo = generateCode();
    const { data: congresso, error } = await supabase
      .from("congressos")
      .insert({ nome: nome.trim(), codigo, created_by: user.id })
      .select()
      .single();

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Auto-join as admin
    await supabase
      .from("congresso_members")
      .insert({ congresso_id: congresso.id, user_id: user.id, role: "admin" });

    setCongresso(congresso);
    toast({ title: "Congresso criado!", description: `Código: ${codigo}` });
    setLoading(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <h1 className="text-xl font-semibold text-foreground text-center mb-6">Adicionar congresso</h1>

        <div className="flex rounded-full border border-border overflow-hidden mb-6">
          <button onClick={() => setActiveTab("ingressar")} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === "ingressar" ? "bg-accent text-accent-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
            <UserPlus className="w-4 h-4" /> Ingressar
          </button>
          <button onClick={() => setActiveTab("cadastrar")} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === "cadastrar" ? "bg-accent text-accent-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
            <Plus className="w-4 h-4" /> Cadastrar
          </button>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          {activeTab === "ingressar" ? (
            <form onSubmit={handleIngressar} className="space-y-5">
              <p className="text-sm font-medium text-foreground">Ingressar em um congresso existente</p>
              <div className="relative">
                <Input placeholder="XXXX" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} className="h-12 rounded-lg text-center text-lg tracking-widest" maxLength={10} />
                <label className="absolute -top-2.5 left-3 bg-card px-1 text-xs text-muted-foreground">Código do congresso</label>
              </div>
              <Button type="submit" className="w-full h-12 text-base font-semibold rounded-lg uppercase tracking-wide" disabled={loading}>
                {loading ? "Ingressando..." : "Ingressar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCadastrar} className="space-y-5">
              <p className="text-sm font-medium text-foreground">Novo congresso</p>
              <Input placeholder="Nome do congresso" value={nome} onChange={(e) => setNome(e.target.value)} className="h-12 rounded-lg" />
              <Button type="submit" className="w-full h-12 text-base font-semibold rounded-lg uppercase tracking-wide" disabled={loading}>
                {loading ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </form>
          )}
        </div>

        <button onClick={() => navigate("/login")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6 mx-auto transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar ao login
        </button>
      </motion.div>
    </div>
  );
};

export default Congresso;
