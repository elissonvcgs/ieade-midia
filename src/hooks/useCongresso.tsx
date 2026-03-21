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
  const { user } = useAuth();
  const [congresso, setCongresso] = useState<Congresso | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCongresso(null);
      setLoading(false);
      return;
    }

    const loadCongresso = async () => {
      // Get first congresso the user is a member of
      const { data: membership } = await supabase
        .from("congresso_members")
        .select("congresso_id, congressos(*)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (membership?.congressos) {
        const c = membership.congressos as unknown as Congresso;
        setCongresso(c);
      }
      setLoading(false);
    };

    loadCongresso();
  }, [user]);

  return (
    <CongressoContext.Provider value={{ congresso, setCongresso, loading }}>
      {children}
    </CongressoContext.Provider>
  );
};

export const useCongresso = () => useContext(CongressoContext);
