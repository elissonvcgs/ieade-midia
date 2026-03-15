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
    window.location.href = "/congresso";
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
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Registre-se com Google
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
