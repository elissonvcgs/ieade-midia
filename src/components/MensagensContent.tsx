import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCongresso } from "@/hooks/useCongresso";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Send, Users, MessageCircle, ArrowLeft, Hash, User } from "lucide-react";
import { toast } from "sonner";

interface Room {
  id: string;
  nome: string | null;
  tipo: string;
  created_by: string;
}

interface Message {
  id: string;
  room_id: string;
  user_id: string;
  conteudo: string;
  created_at: string;
}

interface Profile {
  user_id: string;
  name: string;
  email: string | null;
}

interface MemberWithProfile {
  user_id: string;
  profile: Profile;
}

const MensagensContent = () => {
  const { user } = useAuth();
  const { congresso } = useCongresso();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [roomType, setRoomType] = useState<"group" | "direct">("group");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!congresso) return;
    loadRooms();
    loadMembers();
  }, [congresso]);

  useEffect(() => {
    if (!selectedRoom) return;
    loadMessages(selectedRoom.id);

    const channel = supabase
      .channel(`room-${selectedRoom.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${selectedRoom.id}` }, (payload) => {
        const msg = payload.new as Message;
        setMessages((prev) => [...prev, msg]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadRooms = async () => {
    const { data } = await supabase.from("chat_rooms").select("*").eq("congresso_id", congresso!.id);
    if (data) setRooms(data as Room[]);
    setLoading(false);
  };

  const loadMembers = async () => {
    // First get member user_ids
    const { data: memberData } = await supabase
      .from("congresso_members")
      .select("user_id")
      .eq("congresso_id", congresso!.id);

    if (!memberData || memberData.length === 0) return;

    const userIds = memberData.map(m => m.user_id);

    // Then fetch profiles for those users
    const { data: profileData } = await supabase
      .from("profiles")
      .select("user_id, name, email")
      .in("user_id", userIds);

    if (profileData) {
      const pMap: Record<string, Profile> = {};
      const mapped: MemberWithProfile[] = [];
      profileData.forEach((p) => {
        pMap[p.user_id] = p;
        mapped.push({ user_id: p.user_id, profile: p });
      });
      setProfiles(pMap);
      setMembers(mapped);
    }
  };

  const loadMessages = async (roomId: string) => {
    const { data } = await supabase.from("chat_messages").select("*").eq("room_id", roomId).order("created_at", { ascending: true });
    if (data) setMessages(data as Message[]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !user) return;
    const { error } = await supabase.from("chat_messages").insert({ room_id: selectedRoom.id, user_id: user.id, conteudo: newMessage.trim() });
    if (error) { toast.error("Erro ao enviar mensagem"); return; }
    setNewMessage("");
  };

  const createRoom = async () => {
    if (!user || !congresso) return;

    if (roomType === "direct") {
      if (selectedMembers.length !== 1) { toast.error("Selecione um membro para conversa privada"); return; }
    } else {
      if (!newRoomName.trim()) { toast.error("Digite o nome do grupo"); return; }
      if (selectedMembers.length === 0) { toast.error("Selecione pelo menos um membro"); return; }
    }

    const targetName = roomType === "direct"
      ? null
      : newRoomName.trim();

    // Insert room without .select() since RLS SELECT requires membership
    const { data: room, error } = await supabase.from("chat_rooms").insert({
      congresso_id: congresso.id,
      nome: targetName,
      tipo: roomType,
      created_by: user.id,
    }).select().single();

    if (error || !room) {
      console.error("Erro ao criar sala:", error);
      toast.error("Erro ao criar sala");
      return;
    }

    // Add members (including self) — creator can add via RLS
    const membersToAdd = [...new Set([...selectedMembers, user.id])].map((uid) => ({ room_id: room.id, user_id: uid }));
    const { error: membersError } = await supabase.from("chat_room_members").insert(membersToAdd);

    if (membersError) {
      console.error("Erro ao adicionar membros:", membersError);
      toast.error("Erro ao adicionar membros");
      return;
    }

    setCreateDialogOpen(false);
    setNewRoomName("");
    setSelectedMembers([]);
    loadRooms();
    setSelectedRoom(room as Room);
    toast.success(roomType === "direct" ? "Conversa iniciada!" : "Grupo criado!");
  };

  const getRoomDisplayName = (room: Room) => {
    if (room.tipo === "direct") {
      // For DMs show the other person's name
      return profiles[Object.keys(profiles).find((uid) => uid !== user?.id && members.some(m => m.user_id === uid)) || ""]?.name || "Conversa";
    }
    return room.nome || "Grupo";
  };

  const [roomMembers, setRoomMembers] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedRoom) return;
    supabase.from("chat_room_members").select("user_id").eq("room_id", selectedRoom.id).then(({ data }) => {
      if (data) setRoomMembers(data.map(d => d.user_id));
    });
  }, [selectedRoom]);

  const getDMName = (room: Room) => {
    if (room.tipo !== "direct") return room.nome || "Grupo";
    // We need room members to find the other user
    return "Conversa privada";
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  if (loading) return <p className="text-center text-muted-foreground py-10">Carregando...</p>;

  // Chat view
  if (selectedRoom) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[calc(100vh-120px)]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedRoom(null); setMessages([]); }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            {selectedRoom.tipo === "direct" ? <User className="w-5 h-5 text-primary-foreground" /> : <Users className="w-5 h-5 text-primary-foreground" />}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{selectedRoom.nome || "Conversa privada"}</h3>
            <p className="text-xs text-muted-foreground">{roomMembers.length} membros</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 py-4">
          <div className="space-y-4 px-2">
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-10">Nenhuma mensagem ainda. Comece a conversa!</p>
            )}
            {messages.map((msg, i) => {
              const isOwn = msg.user_id === user?.id;
              const profile = profiles[msg.user_id];
              const showAvatar = i === 0 || messages[i - 1].user_id !== msg.user_id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} gap-2`}>
                  {!isOwn && showAvatar && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                      {getInitials(profile?.name || "?")}
                    </div>
                  )}
                  {!isOwn && !showAvatar && <div className="w-8 shrink-0" />}
                  <div className={`max-w-[70%] ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"} rounded-2xl px-4 py-2`}>
                    {!isOwn && showAvatar && <p className="text-xs font-semibold mb-1 opacity-70">{profile?.name || "Desconhecido"}</p>}
                    <p className="text-sm whitespace-pre-wrap">{msg.conteudo}</p>
                    <p className={`text-[10px] mt-1 ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"} text-right`}>{formatTime(msg.created_at)}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="pt-4 border-t border-border flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Digite sua mensagem..."
            className="flex-1"
          />
          <Button onClick={sendMessage} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  // Room list view
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Mensagens</h2>
          <p className="text-sm text-muted-foreground">Comunicação entre membros</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Nova conversa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova conversa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Type selector */}
              <div className="flex gap-2">
                <Button variant={roomType === "direct" ? "default" : "outline"} size="sm" onClick={() => setRoomType("direct")} className="flex-1">
                  <User className="w-4 h-4 mr-2" /> Privado
                </Button>
                <Button variant={roomType === "group" ? "default" : "outline"} size="sm" onClick={() => setRoomType("group")} className="flex-1">
                  <Users className="w-4 h-4 mr-2" /> Grupo
                </Button>
              </div>

              {roomType === "group" && (
                <Input placeholder="Nome do grupo" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
              )}

              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  {roomType === "direct" ? "Escolha um membro:" : "Selecione os membros:"}
                </p>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {members.filter(m => m.user_id !== user?.id).map((m) => (
                      <label key={m.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                        {roomType === "group" ? (
                          <Checkbox
                            checked={selectedMembers.includes(m.user_id)}
                            onCheckedChange={(checked) => {
                              setSelectedMembers(checked ? [...selectedMembers, m.user_id] : selectedMembers.filter(id => id !== m.user_id));
                            }}
                          />
                        ) : (
                          <input
                            type="radio"
                            name="dm-member"
                            checked={selectedMembers[0] === m.user_id}
                            onChange={() => setSelectedMembers([m.user_id])}
                            className="accent-primary"
                          />
                        )}
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                          {getInitials(m.profile.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{m.profile.name}</p>
                          <p className="text-xs text-muted-foreground">{m.profile.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Button onClick={createRoom} className="w-full">
                {roomType === "direct" ? "Iniciar conversa" : "Criar grupo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {rooms.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 flex flex-col items-center justify-center text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma conversa ainda</p>
          <p className="text-sm text-muted-foreground mt-1">Crie um grupo ou inicie uma conversa privada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:bg-muted transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                {room.tipo === "direct" ? <User className="w-6 h-6 text-primary-foreground" /> : <Hash className="w-6 h-6 text-primary-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{room.nome || "Conversa privada"}</h3>
                <p className="text-xs text-muted-foreground">{room.tipo === "direct" ? "Mensagem direta" : "Grupo"}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MensagensContent;
