import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Music, X, Loader2, ChevronRight, Wand2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCongresso } from "@/hooks/useCongresso";
import { useToast } from "@/hooks/use-toast";

interface Song {
  id: string;
  nome: string;
  artista: string | null;
  album: string | null;
  tom: string | null;
  duracao: string | null;
  bpm: string | null;
  classificacao: string | null;
  letra: string | null;
  cifra: string | null;
  audio_url: string | null;
  video_url: string | null;
  letra_url: string | null;
}

interface SearchResult {
  nome: string;
  artista: string;
  album?: string;
  tom?: string;
  duracao?: string;
  bpm?: string;
  classificacao?: string;
  letra?: string;
}

type Tab = "musicas" | "artistas";

const RepertorioContent = () => {
  const { user } = useAuth();
  const { congresso } = useCongresso();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("musicas");
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const fetchSongs = useCallback(async () => {
    if (!congresso) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("repertorio")
      .select("*")
      .eq("congresso_id", congresso.id)
      .order("nome");
    if (!error && data) setSongs(data as unknown as Song[]);
    setLoading(false);
  }, [congresso]);

  useEffect(() => { fetchSongs(); }, [fetchSongs]);

  const filtered = songs.filter(s =>
    s.nome.toLowerCase().includes(filter.toLowerCase()) ||
    (s.artista && s.artista.toLowerCase().includes(filter.toLowerCase()))
  );

  const artists = [...new Set(songs.map(s => s.artista).filter(Boolean))].sort();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold text-foreground">Repertório</h2>
        {congresso && <p className="text-sm text-muted-foreground">{congresso.nome}</p>}
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-4">
        <button onClick={() => setTab("musicas")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === "musicas" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
          Músicas ({songs.length})
        </button>
        <button onClick={() => setTab("artistas")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === "artistas" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
          Artistas ({artists.length})
        </button>
      </div>

      {/* Search & Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar música..." value={filter} onChange={e => setFilter(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setShowAdd(true)} size="icon"><Plus className="w-5 h-5" /></Button>
      </div>

      {/* Song List */}
      {tab === "musicas" && (
        <div className="space-y-1">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Music className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Nenhuma música cadastrada</p>
            </div>
          ) : (
            filtered.map(song => (
              <button key={song.id} onClick={() => setSelectedSong(song)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Music className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{song.nome}</p>
                  <p className="text-sm text-muted-foreground truncate">{song.artista || "Artista desconhecido"}{song.tom ? `, Tom: ${song.tom}` : ""}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))
          )}
        </div>
      )}

      {/* Artists List */}
      {tab === "artistas" && (
        <div className="space-y-1">
          {artists.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">Nenhum artista</p>
          ) : (
            artists.map(artist => (
              <div key={artist} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {(artist as string).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-foreground">{artist}</p>
                  <p className="text-sm text-muted-foreground">{songs.filter(s => s.artista === artist).length} músicas</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Song Dialog */}
      {showAdd && <AddSongDialog open={showAdd} onClose={() => setShowAdd(false)} onAdded={fetchSongs} congressoId={congresso?.id} userId={user?.id} />}

      {/* Song Detail Dialog */}
      {selectedSong && <SongDetailDialog song={selectedSong} onClose={() => setSelectedSong(null)} />}
    </motion.div>
  );
};

/* ─── Add Song Dialog ─── */
interface AddSongDialogProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
  congressoId?: string;
  userId?: string;
}

const AddSongDialog = ({ open, onClose, onAdded, congressoId, userId }: AddSongDialogProps) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<"choose" | "auto" | "manual">("choose");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [saving, setSaving] = useState(false);

  // Manual form state
  const [form, setForm] = useState<Partial<SearchResult & { cifra: string; audio_url: string; video_url: string }>>({});

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("search-song", {
        body: { query: searchQuery },
      });
      if (error) throw error;
      setResults(data?.songs || []);
      if (!data?.songs?.length) {
        toast({ title: "Nenhum resultado encontrado", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erro na busca", description: e.message, variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const selectResult = (r: SearchResult) => {
    setForm({
      nome: r.nome,
      artista: r.artista,
      album: r.album || "",
      tom: r.tom || "",
      duracao: r.duracao || "",
      bpm: r.bpm || "",
      classificacao: r.classificacao || "Louvor",
      letra: r.letra || "",
    });
    setMode("manual"); // switch to manual to allow editing before saving
  };

  const handleSave = async () => {
    if (!form.nome || !congressoId || !userId) return;
    setSaving(true);
    const { error } = await supabase.from("repertorio").insert({
      congresso_id: congressoId,
      created_by: userId,
      nome: form.nome,
      artista: form.artista || null,
      album: form.album || null,
      tom: form.tom || null,
      duracao: form.duracao || null,
      bpm: form.bpm || null,
      classificacao: form.classificacao || "Louvor",
      letra: form.letra || null,
      cifra: form.cifra || null,
      audio_url: form.audio_url || null,
      video_url: form.video_url || null,
    } as any);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Música adicionada!" });
      onAdded();
      onClose();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Música</DialogTitle>
        </DialogHeader>

        {mode === "choose" && (
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground text-center mb-4">Como deseja adicionar a música?</p>
            <Button variant="outline" className="w-full h-16 flex items-center gap-3 justify-start" onClick={() => setMode("auto")}>
              <Wand2 className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Busca Automática</p>
                <p className="text-xs text-muted-foreground">Pesquise e preencha automaticamente</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full h-16 flex items-center gap-3 justify-start" onClick={() => setMode("manual")}>
              <PenLine className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Manual</p>
                <p className="text-xs text-muted-foreground">Preencha todas as informações manualmente</p>
              </div>
            </Button>
          </div>
        )}

        {mode === "auto" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Nome da música..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            {results.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.map((r, i) => (
                  <button key={i} onClick={() => selectResult(r)} className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <p className="font-medium text-foreground">{r.nome}</p>
                    <p className="text-sm text-muted-foreground">{r.artista}{r.tom ? ` · Tom: ${r.tom}` : ""}</p>
                  </button>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => setMode("choose")}>← Voltar</Button>
          </div>
        )}

        {mode === "manual" && (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Nome *</label>
              <Input value={form.nome || ""} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome da música" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Artista</label>
                <Input value={form.artista || ""} onChange={e => setForm(f => ({ ...f, artista: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Álbum</label>
                <Input value={form.album || ""} onChange={e => setForm(f => ({ ...f, album: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Tom</label>
                <Input value={form.tom || ""} onChange={e => setForm(f => ({ ...f, tom: e.target.value }))} placeholder="Ex: C" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Duração</label>
                <Input value={form.duracao || ""} onChange={e => setForm(f => ({ ...f, duracao: e.target.value }))} placeholder="Ex: 5:32" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">BPM</label>
                <Input value={form.bpm || ""} onChange={e => setForm(f => ({ ...f, bpm: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Classificação</label>
              <Input value={form.classificacao || ""} onChange={e => setForm(f => ({ ...f, classificacao: e.target.value }))} placeholder="Louvor, Adoração..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">URL Áudio</label>
                <Input value={form.audio_url || ""} onChange={e => setForm(f => ({ ...f, audio_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">URL Vídeo</label>
                <Input value={form.video_url || ""} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Letra</label>
              <Textarea value={form.letra || ""} onChange={e => setForm(f => ({ ...f, letra: e.target.value }))} rows={5} placeholder="Cole a letra aqui..." />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Cifra</label>
              <Textarea value={form.cifra || ""} onChange={e => setForm(f => ({ ...f, cifra: e.target.value }))} rows={3} placeholder="Cole a cifra aqui..." />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={() => { setForm({}); setMode("choose"); }}>← Voltar</Button>
              <Button onClick={handleSave} disabled={saving || !form.nome} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Salvar Música
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* ─── Song Detail Dialog ─── */
const SongDetailDialog = ({ song, onClose }: { song: Song; onClose: () => void }) => (
  <Dialog open onOpenChange={v => !v && onClose()}>
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Música</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Music className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{song.nome}</h3>
            {song.album && <p className="text-sm text-muted-foreground">Álbum: {song.album}</p>}
            <p className="text-sm text-muted-foreground">{song.artista || "Artista desconhecido"}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="bg-muted/50 rounded-xl p-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Tom</p>
            <p className="font-semibold text-foreground">{song.tom || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Duração</p>
            <p className="font-semibold text-foreground">{song.duracao || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">BPM</p>
            <p className="font-semibold text-foreground">{song.bpm || "-"}</p>
          </div>
        </div>

        {song.classificacao && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Classificação</p>
            <p className="font-medium text-foreground">{song.classificacao}</p>
          </div>
        )}

        {/* References */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Referências</p>

          {song.letra && (
            <details className="group">
              <summary className="flex items-center gap-2 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                <span className="text-sm font-medium text-foreground flex-1">📄 Letra</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
              </summary>
              <pre className="mt-2 p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap text-foreground max-h-60 overflow-y-auto">{song.letra}</pre>
            </details>
          )}

          {song.cifra && (
            <details className="group">
              <summary className="flex items-center gap-2 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                <span className="text-sm font-medium text-foreground flex-1">🎸 Cifra</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
              </summary>
              <pre className="mt-2 p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap text-foreground max-h-60 overflow-y-auto font-mono">{song.cifra}</pre>
            </details>
          )}

          {song.audio_url && (
            <a href={song.audio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <span className="text-sm font-medium text-foreground flex-1">🎵 Áudio</span>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{song.audio_url}</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </a>
          )}

          {song.video_url && (
            <a href={song.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <span className="text-sm font-medium text-foreground flex-1">🎬 Vídeo</span>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{song.video_url}</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </a>
          )}
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default RepertorioContent;
