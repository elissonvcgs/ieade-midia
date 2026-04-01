import { useState, useEffect } from "react";
import { Plus, Users, Shuffle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useCongresso } from "@/hooks/useCongresso";
import { useToast } from "@/hooks/use-toast";

interface Member {
  user_id: string;
  name: string;
  avatar_url: string | null;
  funcoes: string[];
  role: string;
}

interface Props {
  escalaId: string | null; // null when creating new (not yet saved)
  selectedParticipants: string[];
  onParticipantsChange: (ids: string[]) => void;
}

const EscalaParticipantesTab = ({ escalaId, selectedParticipants, onParticipantsChange }: Props) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const { congresso } = useCongresso();

  useEffect(() => {
    if (!congresso) return;
    const fetchMembers = async () => {
      setLoading(true);
      // Get congress members
      const { data: cm } = await supabase
        .from("congresso_members")
        .select("user_id, role")
        .eq("congresso_id", congresso.id);

      if (!cm || cm.length === 0) { setLoading(false); return; }

      const userIds = cm.map((m) => m.user_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", userIds);

      // Get member functions
      const { data: mf } = await supabase
        .from("membro_funcoes")
        .select("user_id, funcao_id")
        .eq("congresso_id", congresso.id);

      const { data: funcoes } = await supabase
        .from("funcoes")
        .select("id, nome")
        .eq("congresso_id", congresso.id);

      const funcaoMap = new Map(funcoes?.map((f) => [f.id, f.nome]) || []);

      const membersList: Member[] = cm.map((m) => {
        const profile = profiles?.find((p) => p.user_id === m.user_id);
        const memberFuncoes = mf?.filter((f) => f.user_id === m.user_id).map((f) => funcaoMap.get(f.funcao_id) || "") .filter(Boolean) || [];
        return {
          user_id: m.user_id,
          name: profile?.name || "Sem nome",
          avatar_url: profile?.avatar_url || null,
          funcoes: memberFuncoes,
          role: m.role,
        };
      });

      membersList.sort((a, b) => a.name.localeCompare(b.name));
      setMembers(membersList);

      // If editing existing escala, load saved participants
      if (escalaId && selectedParticipants.length === 0) {
        const { data: parts } = await supabase
          .from("escala_participantes")
          .select("user_id")
          .eq("escala_id", escalaId);
        if (parts) onParticipantsChange(parts.map((p) => p.user_id));
      }

      setLoading(false);
    };
    fetchMembers();
  }, [congresso, escalaId]);

  const toggleMember = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      onParticipantsChange(selectedParticipants.filter((id) => id !== userId));
    } else {
      onParticipantsChange([...selectedParticipants, userId]);
    }
  };

  const selectAll = () => {
    if (selectedParticipants.length === members.length) {
      onParticipantsChange([]);
    } else {
      onParticipantsChange(members.map((m) => m.user_id));
    }
  };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  if (loading) {
    return <div className="flex justify-center py-16"><p className="text-muted-foreground">Carregando membros...</p></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedParticipants.length} de {members.length} selecionados
        </p>
        <Button variant="outline" size="sm" onClick={selectAll} className="rounded-lg">
          <Check className="w-4 h-4 mr-1" />
          {selectedParticipants.length === members.length ? "Desmarcar todos" : "Selecionar todos"}
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-40 h-40 rounded-full bg-accent flex items-center justify-center mb-6">
            <Users className="w-16 h-16 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhum membro encontrado no ministério.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {members.map((member) => (
            <button
              key={member.user_id}
              onClick={() => toggleMember(member.user_id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                selectedParticipants.includes(member.user_id)
                  ? "bg-accent/50 border border-primary/30"
                  : "bg-card border border-border hover:bg-accent/20"
              }`}
            >
              <Checkbox
                checked={selectedParticipants.includes(member.user_id)}
                className="pointer-events-none"
              />
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{member.name}</p>
                {member.funcoes.length > 0 && (
                  <p className="text-xs text-muted-foreground">{member.funcoes.join(", ")}</p>
                )}
                {member.role === "admin" && (
                  <p className="text-xs text-primary">Administrador</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EscalaParticipantesTab;
