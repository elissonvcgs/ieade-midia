import { Home, CalendarDays, Music, MessageCircle, Church, LayoutGrid, Bell, UserX, BarChart3, Cake, Settings, ChevronRight, Menu } from "lucide-react";
import ieadeLogo from "@/assets/ieade-logo.png";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const mainNav = [
  { id: "inicio", label: "Início", icon: Home, hasSubmenu: false },
  { id: "escalas", label: "Escalas", icon: CalendarDays, hasSubmenu: true },
  { id: "repertorio", label: "Repertório", icon: Music, hasSubmenu: true },
  { id: "mensagens", label: "Mensagens", icon: MessageCircle, hasSubmenu: true },
  { id: "ministerio", label: "Ministério", icon: Church, hasSubmenu: true },
];

const secondaryNav = [
  { id: "visao-geral", label: "Visão geral", icon: LayoutGrid },
  { id: "avisos", label: "Avisos", icon: Bell },
  { id: "indisponibilidades", label: "Indisponibilidades", icon: UserX },
  { id: "planejamento", label: "Planejamento de funções", icon: BarChart3 },
  { id: "aniversariantes", label: "Aniversariantes", icon: Cake },
];

const DashboardSidebar = ({ activeSection, onSectionChange, isOpen, onToggle }: SidebarProps) => {
  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border shadow-sm"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/20 z-30"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-40 bg-card border-r border-border flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } w-72`}
      >
        {/* User Profile */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
              EV
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">Elisson Victor</p>
              <p className="text-xs text-muted-foreground truncate">elissonvictorc@gmail...</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          <div className="space-y-0.5 px-2">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {isActive && item.id === "inicio" ? (
                    <img src={louveappLogo} alt="" className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.hasSubmenu && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>
              );
            })}
          </div>

          <div className="my-3 mx-4 h-px bg-border" />

          <div className="space-y-0.5 px-2">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Settings */}
        <div className="p-2 border-t border-border">
          <button
            onClick={() => onSectionChange("configuracoes")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeSection === "configuracoes"
                ? "bg-accent text-accent-foreground"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Configurações</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
