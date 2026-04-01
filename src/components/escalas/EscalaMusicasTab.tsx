import { useState, useEffect } from "react";
import { Plus, Music, Trash2, GripVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCongresso } from "@/hooks/useCongresso";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface MusicaEscala {
  id?: string;
  nome: string;
  artista: string | null;
  tom: string | null;
  ordem: number;
}

interface RepertorioItem {
  id: string;
  nome: string;
  artista: string | null;
  tom: string | null;
}

interface Props {
  escalaId: string | null;
  musicas: MusicaEscala[];
  onMusicasChange: (m: MusicaEscala[]) => void;
}

const EscalaMusicasTab = ({ escalaId, musicas, onMusicasChange }: Props) => {
  const [showModal, setShowModal] = useState(false);
  const [showNovaMusica, setShowNovaMusica] = useState(false);
  const [repertorio, setRepertorio] = useState<RepertorioItem[]>([]);
  const [search, setSearch] = useState("");
  const [novaMusica, setNovaMusica] = useState({ nome: "", artista: "", tom: "" });
  const { congresso } = useCongresso();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!congresso) return;
    // Load existing musicas if editing
    if (escalaId && musicas.length === 0) {
      supabase
        .from("escala_musicas")
        .select("*")
        .eq("escala_id", escalaId)
        .order("ordem")
        .then(({ data }) => {
          if (data) onMusicasChange(data);
        });
    }
  }, [escalaId, congresso]);

  const fetchRepertorio = async () => {
    if (!congresso) return;
    const { data } = await supabase
      .from("repertorio")
      .select("id, nome, artista, tom")
      .eq("congresso_id", congresso.id)
      .order("nome");
    if (data) setRepertorio(data);
  };

  const openModal = () => {
    fetchRepertorio();
    setShowModal(true);
    setSearch("");
  };

  const addFromRepertorio = (item: RepertorioItem) => {
    const already = musicas.some((m) => m.nome === item.nome && m.artista === item.artista);
    if (already) {
      toast({ title: "Música já adicionada", variant: "destructive" });
      return;
    }
    onMusicasChange([...musicas, { nome: item.nome, artista: item.artista, tom: item.tom, ordem: musicas.length }]);
    setShowModal(false);
  };

  const addNovaMusica = async () => {
    if (!novaMusica.nome.trim()) return;
    // Add to repertório
    if (congresso && user) {
      await supabase.from("repertorio").insert({
        congresso_id: congresso.id,
        nome: novaMusica.nome,
        artista: novaMusica.artista || null,
        tom: novaMusica.tom || null,
        created_by: user.id,
      });
    }
    onMusicasChange([...musicas, { nome: novaMusica.nome, artista: novaMusica.artista || null, tom: novaMusica.tom || null, ordem: musicas.length }]);
    setNovaMusica({ nome: "", artista: "", tom: "" });
    setShowNovaMusica(false);
    setShowModal(false);
    toast({ title: "Música adicionada ao repertório e à escala!" });
  };

  const removeMusica = (index: number) => {
    onMusicasChange(musicas.filter((_, i) => i !== index).map((m, i) => ({ ...m, ordem: i })));
  };

  const filtered = repertorio.filter(
    (r) =>
      r.nome.toLowerCase().includes(search.toLowerCase()) ||
      (r.artista?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <div className="space-y-4">
      <Button onClick={openModal} className="rounded-lg">
        <Plus className="w-4 h-4 mr-1" /> Adicionar música
      </Button>

      {musicas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-40 h-40 rounded-full bg-accent flex items-center justify-center mb-6">
            <Music className="w-16 h-16 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Para adicionar uma música, toque no botão:</p>
          <p className="text-sm text-muted-foreground">( + Adicionar música )</p>
        </div>
      ) : (
        <div className="space-y-2">
          {musicas.map((m, i) => (
            <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
              <span className="text-xs text-muted-foreground font-bold w-6 text-center">{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{m.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {[m.artista, m.tom && `Tom: ${m.tom}`].filter(Boolean).join(" • ") || "Sem detalhes"}
                </p>
              </div>
              <button onClick={() => removeMusica(i)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Adicionar música</DialogTitle>
            <DialogDescription>Selecione do repertório ou cadastre uma nova</DialogDescription>
          </DialogHeader>

          {!showNovaMusica ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar no repertório..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 max-h-60">
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma música encontrada</p>
                ) : (
                  filtered.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addFromRepertorio(item)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
                    >
                      <Music className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {[item.artista, item.tom && `Tom: ${item.tom}`].filter(Boolean).join(" • ")}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <Button variant="outline" onClick={() => setShowNovaMusica(true)} className="w-full">
                <Plus className="w-4 h-4 mr-1" /> Cadastrar nova música
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <Input placeholder="Nome da música *" value={novaMusica.nome} onChange={(e) => setNovaMusica({ ...novaMusica, nome: e.target.value })} />
              <Input placeholder="Artista" value={novaMusica.artista} onChange={(e) => setNovaMusica({ ...novaMusica, artista: e.target.value })} />
              <Input placeholder="Tom (ex: C, D, Em)" value={novaMusica.tom} onChange={(e) => setNovaMusica({ ...novaMusica, tom: e.target.value })} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowNovaMusica(false)} className="flex-1">Voltar</Button>
                <Button onClick={addNovaMusica} className="flex-1" disabled={!novaMusica.nome.trim()}>Adicionar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EscalaMusicasTab;
