import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardContent from "@/components/DashboardContent";
import { useCongresso } from "@/hooks/useCongresso";

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState("inicio");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { congresso, loading } = useCongresso();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!congresso) return <Navigate to="/congresso" replace />;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <motion.main
        className="flex-1 overflow-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <DashboardContent activeSection={activeSection} />
      </motion.main>
    </div>
  );
};

export default Dashboard;
