import { motion } from "framer-motion";
import { Check, ThumbsUp, Music, MessageSquare, ArrowRight, Cake } from "lucide-react";
import EscalasContent from "./EscalasContent";
import ConfiguracoesContent from "./ConfiguracoesContent";
import RepertorioContent from "./RepertorioContent";

const sectionReveal = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

interface Props {
  activeSection: string;
}

const DashboardContent = ({ activeSection }: Props) => {
  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div />
        <h1 className="text-xl font-semibold text-primary">IEADE MÍDIA</h1>
        <div className="w-8" />
      </div>

      {activeSection === "inicio" && <HomeContent />}
      {activeSection === "escalas" && <EscalasContent />}
      {activeSection === "repertorio" && <RepertorioContent />}
      {activeSection === "mensagens" && <PlaceholderSection title="Mensagens" description="Comunicação entre membros" />}
      {activeSection === "ministerio" && <PlaceholderSection title="Ministério" description="Configurações do ministério" />}
      {activeSection === "visao-geral" && <PlaceholderSection title="Visão Geral" description="Resumo geral das atividades" />}
      {activeSection === "avisos" && <PlaceholderSection title="Avisos" description="Avisos e comunicados" />}
      {activeSection === "indisponibilidades" && <PlaceholderSection title="Indisponibilidades" description="Marque suas indisponibilidades" />}
      {activeSection === "planejamento" && <PlaceholderSection title="Planejamento de Funções" description="Planeje as funções do ministério" />}
      {activeSection === "aniversariantes" && <PlaceholderSection title="Aniversariantes" description="Aniversariantes do mês" />}
      {activeSection === "configuracoes" && <ConfiguracoesContent />}
    </div>
  );
};

const HomeContent = () => {
  const members = [
    { initials: "EV", color: "bg-primary" },
    { initials: "DA", color: "bg-louveapp-gold" },
    { initials: "KM", color: "bg-emerald-500" },
    { initials: "SM", color: "bg-rose-500" },
  ];

  return (
    <motion.div {...sectionReveal} className="space-y-8">
      {/* Ministérios */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Ministérios</h2>
            <p className="text-sm text-muted-foreground">Selecionado: MLE</p>
          </div>
          <button className="text-sm text-primary font-medium hover:underline">Adicionar</button>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
            <Music className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">MLE</h3>
            <p className="text-sm text-muted-foreground">Escalas: 1/1</p>
            <p className="text-sm text-muted-foreground">Músicas: 166</p>
            <p className="text-sm text-muted-foreground">Membros: 15</p>
          </div>
          <Check className="w-6 h-6 text-primary" />
        </div>
      </section>

      {/* Avisos */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Avisos (0/0)</h2>
            <p className="text-sm text-muted-foreground">Em destaque</p>
          </div>
          <button className="text-sm text-primary font-medium hover:underline">Ver todos</button>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 flex items-center justify-center gap-2 text-muted-foreground">
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm">Lista vazia.</span>
        </div>
      </section>

      {/* Minhas Escalas */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Minhas escalas (1)</h2>
            <p className="text-sm text-muted-foreground">Próximas</p>
          </div>
          <button className="text-sm text-primary font-medium hover:underline">Ver todas</button>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-start gap-4">
            <div className="text-center">
              <span className="text-2xl font-bold text-primary">15</span>
              <p className="text-xs font-semibold text-muted-foreground">MAR</p>
              <p className="text-xs text-muted-foreground mt-1">DOM</p>
              <p className="text-xs text-muted-foreground">08:30</p>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary hover:underline cursor-pointer">Culto de posse Ismael</h3>
              <p className="text-sm text-muted-foreground">hoje</p>
              <div className="flex items-center gap-1 mt-2">
                {members.map((m, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full ${m.color} flex items-center justify-center text-[10px] font-bold text-primary-foreground ring-2 ring-card -ml-1 first:ml-0`}
                  >
                    {m.initials}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> 0/7</span>
                <span className="flex items-center gap-1"><Music className="w-4 h-4" /> 3</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> 0</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Aniversariantes */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Aniversariantes (1)</h2>
            <p className="text-sm text-muted-foreground">Março</p>
          </div>
          <button className="text-sm text-primary font-medium hover:underline">Ver todos</button>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <Cake className="w-5 h-5 text-primary" />
          <span className="text-sm text-foreground">1 aniversariante neste mês</span>
        </div>
      </section>
    </motion.div>
  );
};

const PlaceholderSection = ({ title, description }: { title: string; description: string }) => (
  <motion.div {...sectionReveal} className="flex flex-col items-center justify-center py-20">
    <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
    <p className="text-muted-foreground">{description}</p>
    <p className="text-sm text-muted-foreground mt-4">Em breve disponível</p>
  </motion.div>
);

export default DashboardContent;
