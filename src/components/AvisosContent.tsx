import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Plus, ImagePlus, X, Trash2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCongresso } from "@/hooks/useCongresso";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Aviso {
  id: string;
  titulo: string;
  conteudo: string | null;
  image_url: string | null;
  destaque: boolean;
  created_at: string;
  created_by: string;
  author_name?: string;
}

const AvisosContent = () => {
  const { congresso } = useCongresso();
  const { user } = useAuth();
  const { toast } = useToast();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [canPost, setCanPost] = useState(false);
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [destaque, setDestaque] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!congresso) return;
    setLoading(true);
    const { data } = await supabase
      .from("avisos")
      .select("*")
      .eq("congresso_id", congresso.id)
      .order("destaque", { ascending: false })
      .order("created_at", { ascending: false });

    const list = ((data || []) as unknown) as Aviso[];
    const ids = Array.from(new Set(list.map((a) => a.created_by)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, name").in("user_id", ids);
      const map = new Map((profs || []).map((p: any) => [p.user_id, p.name]));
      list.forEach((a) => (a.author_name = map.get(a.created_by) || "Autor"));
    }
    setAvisos(list);
    setLoading(false);
  };

  useEffect(() => {
    if (!congresso || !user) return;
    (async () => {
      const { data } = await supabase
        .from("congresso_members")
        .select("role")
        .eq("congresso_id", congresso.id)
        .eq("user_id", user.id)
        .maybeSingle();
      setCanPost(data?.role === "admin" || data?.role === "pastor");
    })();
    load();

    const channel = supabase
      .channel("avisos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "avisos", filter: `congresso_id=eq.${congresso.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [congresso, user]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const reset = () => {
    setTitulo(""); setConteudo(""); setDestaque(false); setImageFile(null); setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!congresso || !user) return;
    if (!titulo.trim()) {
      toast({ title: "Tema é obrigatório", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    let image_url: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("aviso-images").upload(path, imageFile);
      if (upErr) {
        toast({ title: "Erro ao enviar imagem", description: upErr.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      const { data: pub } = supabase.storage.from("aviso-images").getPublicUrl(path);
      image_url = pub.publicUrl;
    }
    const { error } = await supabase.from("avisos").insert({
      congresso_id: congresso.id,
      created_by: user.id,
      titulo: titulo.trim(),
      conteudo: conteudo.trim() || null,
      image_url,
      destaque,
    } as any);
    setSubmitting(false);
    if (error) {
      toast({ title: "Erro ao publicar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Aviso publicado" });
    setOpen(false);
    reset();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este aviso?")) return;
    const { error } = await supabase.from("avisos").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Aviso excluído" });
    load();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Avisos</h2>
        </div>
        {canPost && (
          <Button onClick={() => setOpen(true)} className="rounded-full">
            <Plus className="w-4 h-4 mr-1" /> Novo aviso
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-10">Carregando...</p>
      ) : avisos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum aviso publicado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {avisos.map((a) => {
            const canDelete = a.created_by === user?.id;
            return (
              <article key={a.id} className={`rounded-xl border p-4 ${a.destaque ? "border-primary/50 bg-primary/5" : "border-border bg-card"}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {a.destaque && <Star className="w-4 h-4 text-primary fill-primary" />}
                    <h3 className="font-semibold text-foreground">{a.titulo}</h3>
                  </div>
                  {canDelete && (
                    <button onClick={() => handleDelete(a.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {a.image_url && (
                  <img src={a.image_url} alt={a.titulo} className="w-full max-h-80 object-cover rounded-lg mb-3" />
                )}
                {a.conteudo && <p className="text-sm text-foreground whitespace-pre-wrap mb-3">{a.conteudo}</p>}
                <p className="text-xs text-muted-foreground">
                  {a.author_name} · {formatDistanceToNow(new Date(a.created_at), { locale: ptBR, addSuffix: true })}
                </p>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="bg-card max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo aviso</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tema</label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Ensaio especial" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Mensagem</label>
              <Textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} placeholder="Escreva sua mensagem..." rows={5} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Imagem (opcional)</label>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="" className="w-full max-h-60 object-cover rounded-lg" />
                  <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-background/80 rounded-full p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} className="w-full border border-dashed border-border rounded-lg p-6 flex flex-col items-center text-muted-foreground hover:bg-muted/30 transition-colors">
                  <ImagePlus className="w-6 h-6 mb-1" />
                  <span className="text-sm">Adicionar imagem</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </div>
            <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
              <div>
                <p className="text-sm text-foreground">Destacar aviso</p>
                <p className="text-xs text-muted-foreground">Aparecerá no topo da lista</p>
              </div>
              <Switch checked={destaque} onCheckedChange={setDestaque} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AvisosContent;