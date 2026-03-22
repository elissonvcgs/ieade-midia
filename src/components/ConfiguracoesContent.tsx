import { useState } from "react";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCongresso } from "@/hooks/useCongresso";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const ConfiguracoesContent = () => {
  const { user } = useAuth();
  const { congresso, setCongresso } = useCongresso();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leaving, setLeaving] = useState(false);

  const handleLeaveCongresso = async () => {
    if (!user || !congresso) return;
    setLeaving(true);

    const { error } = await supabase
      .from("congresso_members")
      .delete()
      .eq("congresso_id", congresso.id)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setLeaving(false);
      return;
    }

    setCongresso(null);
    toast({ title: "Você saiu do congresso" });
    navigate("/congresso");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-foreground">Configurações</h2>

      {congresso && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Congresso atual</h3>
          <div className="space-y-1">
            <p className="text-sm text-foreground"><span className="text-muted-foreground">Nome:</span> {congresso.nome}</p>
            <p className="text-sm text-foreground"><span className="text-muted-foreground">Código:</span> {congresso.codigo}</p>
          </div>
          <Button
            variant="destructive"
            onClick={handleLeaveCongresso}
            disabled={leaving}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            {leaving ? "Saindo..." : "Sair do congresso"}
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default ConfiguracoesContent;
