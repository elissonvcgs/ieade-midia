import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Congresso {
  id: string;
  nome: string;
  codigo: string;
  descricao: string | null;
  created_by: string;
}

interface CongressoContextType {
  congresso: Congresso | null;
  setCongresso: (c: Congresso | null) => void;
  loading: boolean;
}

const CongressoContext = createContext<CongressoContextType>({
  congresso: null,
  setCongresso: () => {},
  loading: true,
});

export const CongressoProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [congresso, setCongresso] = useState<Congresso | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setCongresso(null);
      setLoading(false);
      return;
    }

    const loadCongresso = async () => {
      setLoading(true);
      try {
        // Get first congresso the user is a member of
        const { data: membership, error } = await supabase
          .from("congresso_members")
          .select("congresso_id, congressos(*)")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (membership?.congressos) {
          const c = membership.congressos as unknown as Congresso;
          setCongresso(c);
        } else {
          setCongresso(null);
        }
      } catch (error) {
        console.error("Erro ao carregar congresso", error);
        setCongresso(null);
      } finally {
        setLoading(false);
      }
    };

    loadCongresso();
  }, [user, authLoading]);

  return (
    <CongressoContext.Provider value={{ congresso, setCongresso, loading }}>
      {children}
    </CongressoContext.Provider>
  );
};

export const useCongresso = () => useContext(CongressoContext);
