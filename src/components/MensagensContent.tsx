import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Image as ImageIcon, MessageCircle, Mic, Paperclip, Plus, Search, Send, User, Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCongresso } from "@/hooks/useCongresso";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  conteudo: string | null;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
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

type TabKey = "tudo" | "ministerio" | "conversas" | "grupos";

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
  const [tab, setTab] = useState<TabKey>("tudo");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupSelected, setGroupSelected] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      supabase.from("chat_rooms").select("*").eq("congresso_id", congresso.id),
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
    return rooms.filter((r) => r.tipo === "direct").find((room) => {
      const ids = roomMembers.filter((item) => item.room_id === room.id).map((item) => item.user_id);
      return ids.includes(user.id) && ids.includes(memberId) && ids.length === 2;
    }) || null;
  };

  const openConversation = async (member: Member) => {
    if (!user || !congresso) return;
    setOpeningMemberId(member.user_id);
    setSelectedMember(member);
    setSelectedRoom(null);
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

  const openGroup = (room: Room) => {
    setSelectedMember(null);
    setSelectedRoom(room);
    setMessages([]);
  };

  const createGroup = async () => {
    if (!user || !congresso) return;
    const name = groupName.trim();
    if (!name) { toast.error("Informe um nome para o grupo"); return; }
    if (groupSelected.length === 0) { toast.error("Selecione pelo menos um membro"); return; }
    setCreatingGroup(true);

    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .insert({ congresso_id: congresso.id, nome: name, tipo: "group", created_by: user.id })
      .select()
      .single();

    if (roomError || !room) {
      console.error(roomError);
      toast.error("Erro ao criar grupo");
      setCreatingGroup(false);
      return;
    }

    const ids = Array.from(new Set([user.id, ...groupSelected]));
    const toAdd = ids.map((uid) => ({ room_id: room.id, user_id: uid }));
    const { error: mErr } = await supabase.from("chat_room_members").insert(toAdd);
    if (mErr) {
      console.error(mErr);
      toast.error("Erro ao adicionar membros ao grupo");
      setCreatingGroup(false);
      return;
    }

    const created = room as Room;
    setRooms((prev) => [...prev, created]);
    setRoomMembers((prev) => [...prev, ...toAdd]);
    setGroupDialogOpen(false);
    setGroupName("");
    setGroupSelected([]);
    setCreatingGroup(false);
    setTab("grupos");
    openGroup(created);
    toast.success("Grupo criado");
  };

  const uploadAndSend = async (file: File) => {
    if (!selectedRoom || !user) return;
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${selectedRoom.id}/${user.id}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage.from("chat-attachments").upload(path, file, {
      contentType: file.type || "application/octet-stream",
    });
    if (upErr) {
      console.error(upErr);
      toast.error("Erro ao enviar arquivo");
      setUploading(false);
      return;
    }
    const { error } = await supabase.from("chat_messages").insert({
      room_id: selectedRoom.id,
      user_id: user.id,
      conteudo: null,
      attachment_url: path,
      attachment_type: file.type || "application/octet-stream",
      attachment_name: file.name,
    });
    if (error) {
      console.error(error);
      toast.error("Erro ao enviar mensagem");
    }
    setUploading(false);
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadAndSend(f);
    e.target.value = "";
  };

  // Generate signed URLs for attachments
  useEffect(() => {
    const missing = messages.filter((m) => m.attachment_url && !signedUrls[m.attachment_url]);
    if (missing.length === 0) return;
    (async () => {
      const updates: Record<string, string> = {};
      await Promise.all(missing.map(async (m) => {
        const { data } = await supabase.storage.from("chat-attachments").createSignedUrl(m.attachment_url!, 3600);
        if (data?.signedUrl) updates[m.attachment_url!] = data.signedUrl;
      }));
      if (Object.keys(updates).length) setSignedUrls((prev) => ({ ...prev, ...updates }));
    })();
  }, [messages, signedUrls]);

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
    const base = members;
    if (!term) return base;
    return base.filter((member) => {
      const name = member.profile.name.toLowerCase();
      const email = member.profile.email?.toLowerCase() || "";
      const funcoes = member.funcoes.join(" ").toLowerCase();
      return name.includes(term) || email.includes(term) || funcoes.includes(term);
    });
  }, [members, search]);

  const groupRooms = useMemo(() => rooms.filter((r) => r.tipo === "group"), [rooms]);

  const membersWithConversation = useMemo(() => {
    return members.filter((m) => directRoomForMember(m.user_id) !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, rooms, roomMembers, user]);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return groupRooms;
    return groupRooms.filter((g) => (g.nome || "").toLowerCase().includes(term));
  }, [groupRooms, search]);

  const getInitials = (name: string) => name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  const formatTime = (date: string) => new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const groupMemberNames = (roomId: string) => {
    const ids = roomMembers.filter((rm) => rm.room_id === roomId).map((rm) => rm.user_id);
    return ids.map((id) => profiles[id]?.name).filter(Boolean).join(", ");
  };

  const renderAttachment = (msg: Message, isOwn: boolean) => {
    if (!msg.attachment_url) return null;
    const url = signedUrls[msg.attachment_url];
    const type = msg.attachment_type || "";
    if (type.startsWith("image/")) {
      return url ? (
        <a href={url} target="_blank" rel="noreferrer" className="block">
          <img src={url} alt={msg.attachment_name || "imagem"} className="max-h-64 rounded-lg" />
        </a>
      ) : <div className="h-32 w-48 animate-pulse rounded-lg bg-muted" />;
    }
    if (type.startsWith("audio/")) {
      return url ? <audio controls src={url} className="max-w-full" /> : <div className="flex items-center gap-2 text-sm"><Mic className="h-4 w-4" /> Carregando áudio...</div>;
    }
    return (
      <a href={url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${isOwn ? "border-primary-foreground/30" : "border-border"}`}>
        <FileText className="h-5 w-5 shrink-0" />
        <span className="truncate">{msg.attachment_name || "Arquivo"}</span>
      </a>
    );
  };

  const showMembersList = tab === "tudo" || tab === "ministerio";
  const showGroupsList = tab === "tudo" || tab === "grupos";
  const showConversationsList = tab === "conversas";

  if (loading) return <p className="text-center text-muted-foreground py-10">Carregando...</p>;

  const headerTitle = selectedRoom?.tipo === "group"
    ? selectedRoom.nome || "Grupo"
    : selectedMember?.profile.name || "";
  const headerSubtitle = selectedRoom?.tipo === "group"
    ? groupMemberNames(selectedRoom.id)
    : selectedMember?.funcoes.join(", ") || selectedMember?.profile.email || "Membro do ministério";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="h-[calc(100vh-120px)] overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid h-full grid-cols-1 md:grid-cols-[340px_1fr]">
        <aside className={`${selectedRoom ? "hidden md:flex" : "flex"} min-h-0 flex-col border-r border-border bg-card`}>
          <div className="space-y-4 border-b border-border p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-foreground">Mensagens</h2>
                <p className="text-sm text-muted-foreground">Membros e grupos</p>
              </div>
              <Button size="icon" variant="outline" onClick={() => setGroupDialogOpen(true)} title="Novo grupo">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar ou começar conversa" className="pl-9" />
            </div>
            <div className="flex gap-2 text-xs font-medium">
              {(["tudo","ministerio","conversas","grupos"] as TabKey[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-full px-3 py-1 capitalize transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}
                >
                  {t === "tudo" ? "Tudo" : t === "ministerio" ? "Ministério" : t === "conversas" ? "Conversas" : "Grupos"}
                </button>
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {showGroupsList && filteredGroups.length > 0 && (
                <>
                  {tab === "tudo" && <p className="px-2 py-2 text-xs font-semibold uppercase text-muted-foreground">Grupos</p>}
                  {filteredGroups.map((g) => {
                    const active = selectedRoom?.id === g.id;
                    return (
                      <button
                        key={g.id}
                        onClick={() => openGroup(g)}
                        className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${active ? "bg-muted" : "hover:bg-muted/70"}`}
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{g.nome}</p>
                          <p className="truncate text-xs text-muted-foreground">{groupMemberNames(g.id) || "Grupo"}</p>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}

              {showConversationsList && (
                membersWithConversation.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma conversa ainda</div>
                ) : membersWithConversation.map((member) => {
                  const active = selectedMember?.user_id === member.user_id;
                  return (
                    <button key={member.user_id} onClick={() => openConversation(member)} className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${active ? "bg-muted" : "hover:bg-muted/70"}`}>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{getInitials(member.profile.name)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{member.profile.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{member.funcoes.join(", ") || member.profile.email}</p>
                      </div>
                    </button>
                  );
                })
              )}

              {showMembersList && (
                <>
                  {tab === "tudo" && filteredMembers.length > 0 && <p className="px-2 py-2 text-xs font-semibold uppercase text-muted-foreground">Membros</p>}
                  {filteredMembers.length === 0 && !showGroupsList ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">Nenhum membro encontrado</div>
                  ) : filteredMembers.map((member) => {
                  const active = selectedMember?.user_id === member.user_id;
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
                        <p className="truncate text-sm font-semibold text-foreground">{member.profile.name}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {openingMemberId === member.user_id ? "Abrindo conversa..." : member.funcoes.join(", ") || member.profile.email || "Membro do ministério"}
                        </p>
                      </div>
                    </button>
                  );
                })}
                </>
              )}
            </div>
          </ScrollArea>
        </aside>

        <section className={`${selectedRoom ? "flex" : "hidden md:flex"} min-h-0 flex-col bg-background`}>
          {selectedRoom ? (
            <>
              <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => { setSelectedRoom(null); setSelectedMember(null); setMessages([]); }}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {selectedRoom.tipo === "group" ? <Users className="h-5 w-5" /> : getInitials(selectedMember?.profile.name || "?")}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-foreground">{headerTitle}</h3>
                  <p className="truncate text-xs text-muted-foreground">{headerSubtitle}</p>
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
                            {getInitials(profile?.name || "?")}
                          </div>
                        )}
                        {!isOwn && !showAvatar && <div className="w-8 shrink-0" />}
                        <div className={`max-w-[78%] space-y-2 rounded-2xl px-4 py-2 ${isOwn ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border"}`}>
                          {selectedRoom.tipo === "group" && !isOwn && showAvatar && (
                            <p className="text-xs font-semibold opacity-80">{profile?.name}</p>
                          )}
                          {renderAttachment(msg, isOwn)}
                          {msg.conteudo && <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.conteudo}</p>}
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
                  <input ref={fileInputRef} type="file" hidden accept="image/*,audio/*,application/pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx" onChange={onPickFile} />
                  <Button type="button" onClick={() => fileInputRef.current?.click()} size="icon" variant="ghost" disabled={uploading} className="shrink-0 rounded-full" title="Anexar arquivo">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && !event.shiftKey && sendMessage()}
                    placeholder={uploading ? "Enviando arquivo..." : "Digite uma mensagem"}
                    disabled={uploading}
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
              <p className="font-medium text-foreground">Selecione uma conversa</p>
              <p className="mt-1 text-sm">Clique em um membro ou grupo para começar.</p>
            </div>
          )}
        </section>
      </div>

      <Dialog open={groupDialogOpen} onOpenChange={(o) => { setGroupDialogOpen(o); if (!o) { setGroupName(""); setGroupSelected([]); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Nome do grupo</Label>
              <Input id="group-name" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Ex: Equipe Louvor" />
            </div>
            <div className="space-y-2">
              <Label>Selecione os membros</Label>
              <ScrollArea className="h-64 rounded-md border border-border p-2">
                {members.map((m) => {
                  const checked = groupSelected.includes(m.user_id);
                  return (
                    <label key={m.user_id} className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted">
                      <Checkbox checked={checked} onCheckedChange={(v) => {
                        setGroupSelected((prev) => v ? [...prev, m.user_id] : prev.filter((id) => id !== m.user_id));
                      }} />
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{getInitials(m.profile.name)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{m.profile.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{m.funcoes.join(", ") || m.profile.email}</p>
                      </div>
                    </label>
                  );
                })}
                {members.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">Nenhum membro disponível</p>}
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>Cancelar</Button>
            <Button onClick={createGroup} disabled={creatingGroup}>{creatingGroup ? "Criando..." : "Criar grupo"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default MensagensContent;