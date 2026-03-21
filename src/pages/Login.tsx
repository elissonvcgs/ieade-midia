import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ieadeLogo from "@/assets/ieade-logo.png";

const slides = [
  { verse: "Grande é o Senhor e digno de ser louvado.", reference: "Salmos 145:3" },
  { verse: "Cantai ao Senhor um cântico novo, cantai ao Senhor, todas as terras.", reference: "Salmos 96:1" },
  { verse: "Louvai ao Senhor porque ele é bom; porque a sua misericórdia dura para sempre.", reference: "Salmos 136:1" },
  { verse: "Tudo o que tem fôlego louve ao Senhor.", reference: "Salmos 150:6" },
];

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const nextSlide = () => setCurrentSlide((p) => (p + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      navigate("/congresso");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Carousel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-primary p-12 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center"
          >
            <img src={ieadeLogo} alt="IEADE Mídia Logo" className="w-48 h-48 mb-8 rounded-full" />
            <h2 className="text-2xl font-bold text-primary-foreground mb-3">BEM-VINDO AO IEADE MÍDIA</h2>
            <p className="text-lg text-primary-foreground/80 max-w-md">{slides[currentSlide].verse}</p>
            <p className="text-sm text-primary-foreground/60 mt-2 italic">{slides[currentSlide].reference}</p>
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-12 flex items-center gap-3">
          <button onClick={prevSlide} className="p-1 text-primary-foreground/60 hover:text-primary-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)} className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? "w-6 bg-primary-foreground" : "w-2 bg-primary-foreground/40"}`} />
            ))}
          </div>
          <button onClick={nextSlide} className="p-1 text-primary-foreground/60 hover:text-primary-foreground transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-card">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <img src={ieadeLogo} alt="IEADE Mídia" className="w-16 h-16 mb-3 rounded-full" />
            <h1 className="text-2xl font-semibold text-foreground">IEADE MÍDIA</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11 h-12 rounded-lg border-border bg-card" required />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input type={showPassword ? "text" : "password"} placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 pr-11 h-12 rounded-lg border-border bg-card" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <Button type="submit" className="w-full h-12 text-base font-semibold rounded-lg" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Não possui login?{" "}
            <Link to="/register" className="text-primary font-semibold hover:underline">Cadastre-se</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
