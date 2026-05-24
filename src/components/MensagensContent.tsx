import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, Search, Send, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCongresso } from "@/hooks/useCongresso";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Room {
  id: string;
  nome: string | null;
  tipo: string;
  created_by: string;
  created_at?: string;
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
  avatar_url: string | null;
}

interface Member {
  user_id: string;
  role: string;
  profile: Profile;
  funcoes: string[];
}

interface RoomMember {
  room_id: string;
  user_id: string;
}

const MensagensContent = () => {
  const { user } = useAuth();
  const { congresso } = useCongresso();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [openingMemberId, setOpeningMemberId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedRoom) return;
    loadMessages(selectedRoom.id);

    const channel = supabase
      .channel(`room-${selectedRoom.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${selectedRoom.id}` }, (payload) => {
        const msg = payload.new as Message;
        setMessages((prev) => (prev.some((item) => item.id === msg.id) ? prev : [...prev, msg]));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadData = useCallback(async () => {
    if (!congresso) return;
    setLoading(true);

    const { data: memberData, error: memberError } = await supabase
      .from("congresso_members")
      .select("user_id, role")
      .eq("congresso_id", congresso.id);

    if (memberError) {
      toast.error("Erro ao carregar membros");
      setLoading(false);
      return;
    }

    const userIds = (memberData || []).map((member) => member.user_id);
    const [{ data: profileData }, { data: funcoesData }, { data: roomsData, error: roomsError }] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("user_id, name, email, avatar_url").in("user_id", userIds)
        : Promise.resolve({ data: [] }),
      supabase.from("membro_funcoes").select("user_id, funcoes(nome)").eq("congresso_id", congresso.id),
      supabase.from("chat_rooms").select("*").eq("congresso_id", congresso.id).eq("tipo", "direct"),
    ]);

    if (roomsError) {
      console.error("Erro ao carregar conversas:", roomsError);
      toast.error("Erro ao carregar conversas");
    }

    const profileMap: Record<string, Profile> = {};
    (profileData || []).forEach((profile) => {
      profileMap[profile.user_id] = profile;
    });

    const funcaoMap = new Map<string, string[]>();
    ((funcoesData || []) as Array<{ user_id: string; funcoes: { nome: string } | null }>).forEach((item) => {
      if (!item.funcoes?.nome) return;
      const list = funcaoMap.get(item.user_id) || [];
      list.push(item.funcoes.nome);
      funcaoMap.set(item.user_id, list);
    });

    const builtMembers = (memberData || [])
      .filter((member) => member.user_id !== user?.id && profileMap[member.user_id])
      .map((member) => ({
        user_id: member.user_id,
        role: member.role,
        profile: profileMap[member.user_id],
        funcoes: funcaoMap.get(member.user_id) || [],
      }))
      .sort((a, b) => a.profile.name.localeCompare(b.profile.name));

    setProfiles(profileMap);
    setMembers(builtMembers);
    setRooms((roomsData || []) as Room[]);

    if (roomsData?.length) {
      const roomIds = roomsData.map((room) => room.id);
      const { data: roomMemberData } = await supabase
        .from("chat_room_members")
        .select("room_id, user_id")
        .in("room_id", roomIds);
      setRoomMembers((roomMemberData || []) as RoomMember[]);
    } else {
      setRoomMembers([]);
    }

    setLoading(false);
  }, [congresso, user]);

  useEffect(() => {
    if (!congresso || !user) return;
    loadData();
  }, [congresso, user, loadData]);

  const loadMessages = async (roomId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar mensagens");
      return;
    }

    setMessages((data || []) as Message[]);
  };

  const directRoomForMember = (memberId: string) => {
    if (!user) return null;
    return rooms.find((room) => {
      const ids = roomMembers.filter((item) => item.room_id === room.id).map((item) => item.user_id);
      return ids.includes(user.id) && ids.includes(memberId) && ids.length === 2;
    }) || null;
  };

  const openConversation = async (member: Member) => {
    if (!user || !congresso) return;
    setOpeningMemberId(member.user_id);
    setSelectedMember(member);
    setMessages([]);

    const existingRoom = directRoomForMember(member.user_id);
    if (existingRoom) {
      setSelectedRoom(existingRoom);
      setOpeningMemberId(null);
      return;
    }

    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .insert({ congresso_id: congresso.id, nome: null, tipo: "direct", created_by: user.id })
      .select()
      .single();

    if (roomError || !room) {
      console.error("Erro ao criar conversa:", roomError);
      toast.error("Erro ao abrir conversa");
      setOpeningMemberId(null);
      return;
    }

    const membersToAdd = [user.id, member.user_id].map((uid) => ({ room_id: room.id, user_id: uid }));
    const { error: membersError } = await supabase.from("chat_room_members").insert(membersToAdd);

    if (membersError) {
      console.error("Erro ao adicionar participantes:", membersError);
      toast.error("Erro ao adicionar participantes");
      setOpeningMemberId(null);
      return;
    }

    const createdRoom = room as Room;
    setRooms((prev) => [...prev, createdRoom]);
    setRoomMembers((prev) => [...prev, ...membersToAdd]);
    setSelectedRoom(createdRoom);
    setOpeningMemberId(null);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !user) return;
    const text = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase
      .from("chat_messages")
      .insert({ room_id: selectedRoom.id, user_id: user.id, conteudo: text });

    if (error) {
      console.error("Erro ao enviar mensagem:", error);
      setNewMessage(text);
      toast.error("Erro ao enviar mensagem");
    }
  };

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return members;
    return members.filter((member) => {
      const name = member.profile.name.toLowerCase();
      const email = member.profile.email?.toLowerCase() || "";
      const funcoes = member.funcoes.join(" ").toLowerCase();
      return name.includes(term) || email.includes(term) || funcoes.includes(term);
    });
  }, [members, search]);

  const getInitials = (name: string) => name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  const formatTime = (date: string) => new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const getLastMessage = (memberId: string) => {
    const room = directRoomForMember(memberId);
    if (!room || selectedRoom?.id !== room.id || messages.length === 0) return null;
    return messages[messages.length - 1];
  };

  if (loading) return <p className="text-center text-muted-foreground py-10">Carregando...</p>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="h-[calc(100vh-120px)] overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid h-full grid-cols-1 md:grid-cols-[340px_1fr]">
        <aside className={`${selectedRoom ? "hidden md:flex" : "flex"} min-h-0 flex-col border-r border-border bg-card`}>
          <div className="space-y-4 border-b border-border p-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Mensagens</h2>
              <p className="text-sm text-muted-foreground">Membros do ministério</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar ou começar conversa" className="pl-9" />
            </div>
            <div className="flex gap-2 text-xs font-medium">
              <span className="rounded-full bg-primary px-3 py-1 text-primary-foreground">Tudo</span>
              <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">Ministério</span>
              <span className="rounded-full border border-border px-3 py-1 text-muted-foreground">Conversas</span>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredMembers.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Nenhum membro encontrado</div>
              ) : (
                filteredMembers.map((member) => {
                  const active = selectedMember?.user_id === member.user_id;
                  const lastMessage = getLastMessage(member.user_id);
                  return (
                    <button
                      key={member.user_id}
                      onClick={() => openConversation(member)}
                      disabled={openingMemberId === member.user_id}
                      className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${active ? "bg-muted" : "hover:bg-muted/70"}`}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {getInitials(member.profile.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">{member.profile.name}</p>
                          {lastMessage && <span className="shrink-0 text-xs text-muted-foreground">{formatTime(lastMessage.created_at)}</span>}
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {openingMemberId === member.user_id ? "Abrindo conversa..." : lastMessage?.conteudo || member.funcoes.join(", ") || member.profile.email || "Membro do ministério"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </aside>

        <section className={`${selectedRoom ? "flex" : "hidden md:flex"} min-h-0 flex-col bg-background`}>
          {selectedRoom && selectedMember ? (
            <>
              <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => { setSelectedRoom(null); setSelectedMember(null); setMessages([]); }}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {getInitials(selectedMember.profile.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-foreground">{selectedMember.profile.name}</h3>
                  <p className="truncate text-xs text-muted-foreground">{selectedMember.funcoes.join(", ") || selectedMember.profile.email || "Membro do ministério"}</p>
                </div>
              </div>

              <ScrollArea className="flex-1 px-4 py-5">
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center text-muted-foreground">
                      <MessageCircle className="mb-3 h-12 w-12" />
                      <p className="text-sm">Nenhuma mensagem ainda</p>
                    </div>
                  )}
                  {messages.map((msg, index) => {
                    const isOwn = msg.user_id === user?.id;
                    const profile = profiles[msg.user_id];
                    const showAvatar = index === 0 || messages[index - 1].user_id !== msg.user_id;
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                        {!isOwn && showAvatar && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                            {getInitials(profile?.name || selectedMember.profile.name)}
                          </div>
                        )}
                        {!isOwn && !showAvatar && <div className="w-8 shrink-0" />}
                        <div className={`max-w-[78%] rounded-2xl px-4 py-2 ${isOwn ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.conteudo}</p>
                          <p className={`mt-1 text-right text-[10px] ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{formatTime(msg.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="border-t border-border bg-card p-3">
                <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-2">
                  <Input
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && !event.shiftKey && sendMessage()}
                    placeholder="Digite uma mensagem"
                    className="h-10 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                  />
                  <Button onClick={sendMessage} size="icon" disabled={!newMessage.trim()} className="shrink-0 rounded-full">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <User className="mb-4 h-14 w-14" />
              <p className="font-medium text-foreground">Selecione um membro</p>
              <p className="mt-1 text-sm">Clique em alguém do ministério para ver a conversa.</p>
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
};

export default MensagensContent;