import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Calendar, Lock, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", birthday: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name, birthday: form.birthday || null },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conta criada!", description: "Você já pode usar o sistema." });
      navigate("/congresso");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-card p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="flex items-center mb-8">
          <Link to="/login" className="text-foreground hover:text-primary transition-colors"><ArrowLeft className="w-6 h-6" /></Link>
          <h1 className="text-xl font-semibold text-foreground flex-1 text-center">Cadastre-se</h1>
          <div className="w-6" />
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Nome e sobrenome" value={form.name} onChange={(e) => update("name", e.target.value)} className="pl-11 h-12 rounded-lg" required />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input type="email" placeholder="E-mail" value={form.email} onChange={(e) => update("email", e.target.value)} className="pl-11 h-12 rounded-lg" required />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input type="text" placeholder="Data de nascimento (Opcional)" value={form.birthday} onChange={(e) => update("birthday", e.target.value)} onFocus={(e) => (e.target.type = "date")} onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }} className="pl-11 pr-11 h-12 rounded-lg" />
            <Info className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input type="password" placeholder="Senha" value={form.password} onChange={(e) => update("password", e.target.value)} className="pl-11 h-12 rounded-lg" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input type="password" placeholder="Confirmar senha" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} className="pl-11 h-12 rounded-lg" required />
          </div>
          <Button type="submit" className="w-full h-12 text-base font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wide" disabled={loading}>
            {loading ? "Cadastrando..." : "Registrar"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao cadastrar, você concorda com: <a href="#" className="text-primary hover:underline">Termos de uso</a> e <a href="#" className="text-primary hover:underline">Política de privacidade</a>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
