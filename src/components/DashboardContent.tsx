import { motion } from "framer-motion";
import EscalasContent from "./EscalasContent";
import ConfiguracoesContent from "./ConfiguracoesContent";
import RepertorioContent from "./RepertorioContent";
import MensagensContent from "./MensagensContent";
import MinisterioContent from "./MinisterioContent";
import HomeContent from "./HomeContent";

const sectionReveal = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

interface Props {
  activeSection: string;
  onSectionChange?: (section: string) => void;
}

const DashboardContent = ({ activeSection, onSectionChange }: Props) => {
  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div />
        <h1 className="text-xl font-semibold text-primary">IEADE MÍDIA</h1>
        <div className="w-8" />
      </div>

      {activeSection === "inicio" && onSectionChange && <HomeContent onSectionChange={onSectionChange} />}
      {activeSection === "escalas" && <EscalasContent />}
      {activeSection === "repertorio" && <RepertorioContent />}
      {activeSection === "mensagens" && <MensagensContent />}
      {activeSection === "ministerio" && <MinisterioContent />}
      {activeSection === "visao-geral" && <PlaceholderSection title="Visão Geral" description="Resumo geral das atividades" />}
      {activeSection === "avisos" && <PlaceholderSection title="Avisos" description="Avisos e comunicados" />}
      {activeSection === "indisponibilidades" && <PlaceholderSection title="Indisponibilidades" description="Marque suas indisponibilidades" />}
      {activeSection === "planejamento" && <PlaceholderSection title="Planejamento de Funções" description="Planeje as funções do ministério" />}
      {activeSection === "aniversariantes" && <PlaceholderSection title="Aniversariantes" description="Aniversariantes do mês" />}
      {activeSection === "configuracoes" && <ConfiguracoesContent />}
    </div>
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
