import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import louveappLogo from "@/assets/louveapp-logo.png";

const slides = [
  {
    verse: "Grande é o Senhor e digno de ser louvado.",
    reference: "Salmos 145:3",
  },
  {
    verse: "Cantai ao Senhor um cântico novo, cantai ao Senhor, todas as terras.",
    reference: "Salmos 96:1",
  },
  {
    verse: "Louvai ao Senhor porque ele é bom; porque a sua misericórdia dura para sempre.",
    reference: "Salmos 136:1",
  },
  {
    verse: "Tudo o que tem fôlego louve ao Senhor.",
    reference: "Salmos 150:6",
  },
];

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const nextSlide = () => setCurrentSlide((p) => (p + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to dashboard (no real auth yet)
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Carousel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-accent p-12 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center"
          >
            <img src={louveappLogo} alt="LouveApp Logo" className="w-64 h-64 mb-8" />
            <h2 className="text-2xl font-bold text-foreground mb-3">BEM-VINDO AO LOUVEAPP</h2>
            <p className="text-lg text-foreground/80 max-w-md">{slides[currentSlide].verse}</p>
            <p className="text-sm text-muted-foreground mt-2 italic">{slides[currentSlide].reference}</p>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Controls */}
        <div className="absolute bottom-12 flex items-center gap-3">
          <button onClick={prevSlide} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentSlide ? "w-6 bg-primary" : "w-2 bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>
          <button onClick={nextSlide} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-card">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="flex flex-col items-center mb-8">
            <img src={louveappLogo} alt="LouveApp" className="w-16 h-16 mb-3" />
            <h1 className="text-2xl font-semibold text-foreground">LouveApp</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-12 rounded-lg border-border bg-card"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 pr-11 h-12 rounded-lg border-border bg-card"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Esqueceu a senha?
              </Link>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              Entrar
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base rounded-lg border-border"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Entrar com Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base rounded-lg border-border"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.11 4.45-3.74 4.25z" />
              </svg>
              Entrar com Apple
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Não possui login?{" "}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Cadastre-se
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
