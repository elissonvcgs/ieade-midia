import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Tab = "ingressar" | "cadastrar";

const Congresso = () => {
  const [activeTab, setActiveTab] = useState<Tab>("ingressar");
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const navigate = useNavigate();

  const handleIngressar = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.trim()) {
      navigate("/dashboard");
    }
  };

  const handleCadastrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim()) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <h1 className="text-xl font-semibold text-foreground text-center mb-6">
          Adicionar congresso
        </h1>

        {/* Tab switcher */}
        <div className="flex rounded-full border border-border overflow-hidden mb-6">
          <button
            onClick={() => setActiveTab("ingressar")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === "ingressar"
                ? "bg-accent text-accent-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Ingressar
          </button>
          <button
            onClick={() => setActiveTab("cadastrar")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === "cadastrar"
                ? "bg-accent text-accent-foreground"
                : "bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <Plus className="w-4 h-4" />
            Cadastrar
          </button>
        </div>

        {/* Content */}
        <div className="bg-card rounded-xl border border-border p-6">
          {activeTab === "ingressar" ? (
            <form onSubmit={handleIngressar} className="space-y-5">
              <p className="text-sm font-medium text-foreground">
                Ingressar em um congresso existente
              </p>
              <div className="relative">
                <Input
                  placeholder="XXXX"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  className="h-12 rounded-lg text-center text-lg tracking-widest"
                  maxLength={10}
                />
                <label className="absolute -top-2.5 left-3 bg-card px-1 text-xs text-muted-foreground">
                  Código do congresso
                </label>
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wide"
              >
                Ingressar
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCadastrar} className="space-y-5">
              <p className="text-sm font-medium text-foreground">
                Novo congresso
              </p>
              <Input
                placeholder="Nome do congresso"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-12 rounded-lg"
              />
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wide"
              >
                Cadastrar
              </Button>
            </form>
          )}
        </div>

        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6 mx-auto transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao login
        </button>
      </motion.div>
    </div>
  );
};

export default Congresso;
