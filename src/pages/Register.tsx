import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Calendar, Lock, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    birthday: "",
    password: "",
    confirmPassword: "",
  });

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-card p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center mb-8">
          <Link to="/login" className="text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-semibold text-foreground flex-1 text-center">Cadastre-se</h1>
          <div className="w-6" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-12 text-base rounded-lg border-border mb-6"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.11 4.45-3.74 4.25z" />
          </svg>
          Registre-se com Apple
        </Button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Nome e sobrenome"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="pl-11 h-12 rounded-lg"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="email"
              placeholder="E-mail"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="pl-11 h-12 rounded-lg"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Data de nascimento ( Opcional )"
              value={form.birthday}
              onChange={(e) => update("birthday", e.target.value)}
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
              className="pl-11 pr-11 h-12 rounded-lg"
            />
            <Info className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Senha"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="pl-11 h-12 rounded-lg"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Confirmar senha"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              className="pl-11 h-12 rounded-lg"
            />
          </div>

          <Button type="submit" className="w-full h-12 text-base font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wide">
            Registrar
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao cadastrar, você concorda com:{" "}
          <a href="#" className="text-primary hover:underline">Termos de uso</a>{" "}
          e{" "}
          <a href="#" className="text-primary hover:underline">Política de privacidade</a>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
