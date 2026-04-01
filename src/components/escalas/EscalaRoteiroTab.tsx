import { useState, useEffect } from "react";
import { Plus, Clock, List, Trash2, Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCongresso } from "@/hooks/useCongresso";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface RoteiroItem {
  id?: string;
  titulo: string;
  descricao: string;
  hora: string;
  ordem: number;
}

interface Modelo {
  id: string;
  nome: string;
  itens: RoteiroItem[];
}

interface Props {
  escalaId: string | null;
  roteiro: RoteiroItem[];
  onRoteiroChange: (items: RoteiroItem[]) => void;
}

const EscalaRoteiroTab = ({ escalaId, roteiro, onRoteiroChange }: Props) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showModelos, setShowModelos] = useState(false);
  const [showSaveModelo, setShowSaveModelo] = useState(false);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [novoItem, setNovoItem] = useState({ titulo: "", descricao: "", hora: "" });
  const [modeloNome, setModeloNome] = useState("");
  const { congresso } = useCongresso();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (escalaId && roteiro.length === 0) {
      supabase
        .from("escala_roteiro")
        .select("*")
        .eq("escala_id", escalaId)
        .order("ordem")
        .then(({ data }) => {
          if (data) onRoteiroChange(data.map((d) => ({ id: d.id, titulo: d.titulo, descricao: d.descricao || "", hora: d.hora || "", ordem: d.ordem })));
        });
    }
  }, [escalaId]);

  const addItem = () => {
    if (!novoItem.titulo.trim()) return;
    onRoteiroChange([...roteiro, { ...novoItem, ordem: roteiro.length }]);
    setNovoItem({ titulo: "", descricao: "", hora: "" });
    setShowAddForm(false);
  };

  const removeItem = (index: number) => {
    onRoteiroChange(roteiro.filter((_, i) => i !== index).map((item, i) => ({ ...item, ordem: i })));
  };

  const fetchModelos = async () => {
    if (!congresso) return;
    const { data } = await supabase
      .from("roteiro_modelos")
      .select("*")
      .eq("congresso_id", congresso.id)
      .order("nome");
    if (data) {
      setModelos(data.map((d) => ({
        id: d.id,
        nome: d.nome,
        itens: (d.itens as any[]) || [],
      })));
    }
  };

  const openModelos = () => {
    fetchModelos();
    setShowModelos(true);
  };

  const applyModelo = (modelo: Modelo) => {
    onRoteiroChange(modelo.itens.map((item, i) => ({ ...item, ordem: i, id: undefined })));
    setShowModelos(false);
    toast({ title: `Modelo "${modelo.nome}" aplicado!` });
  };

  const deleteModelo = async (id: string) => {
    await supabase.from("roteiro_modelos").delete().eq("id", id);
    fetchModelos();
  };

  const saveAsModelo = async () => {
    if (!modeloNome.trim() || !congresso || !user) return;
    const { error } = await supabase.from("roteiro_modelos").insert({
      congresso_id: congresso.id,
      nome: modeloNome,
      itens: roteiro.map(({ titulo, descricao, hora, ordem }) => ({ titulo, descricao, hora, ordem })) as any,
      created_by: user.id,
    });
    if (error) {
      toast({ title: "Erro ao salvar modelo", variant: "destructive" });
    } else {
      toast({ title: "Modelo salvo!" });
      setModeloNome("");
      setShowSaveModelo(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setShowAddForm(true)} variant="outline" className="rounded-lg">
          <Plus className="w-4 h-4 mr-1" /> Evento
        </Button>
        <Button onClick={openModelos} variant="outline" className="rounded-lg">
          <List className="w-4 h-4 mr-1" /> Modelos
        </Button>
        {roteiro.length > 0 && (
          <Button onClick={() => setShowSaveModelo(true)} variant="outline" className="rounded-lg">
            <Save className="w-4 h-4 mr-1" /> Salvar como modelo
          </Button>
        )}
      </div>

      {roteiro.length === 0 && !showAddForm ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-40 h-40 rounded-full bg-accent flex items-center justify-center mb-6">
            <Clock className="w-16 h-16 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhum item adicionado ao roteiro.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {roteiro.map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-card border border-border rounded-xl p-3">
              {item.hora && (
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded min-w-[50px] text-center">
                  {item.hora}
                </span>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.titulo}</p>
                {item.descricao && <p className="text-xs text-muted-foreground">{item.descricao}</p>}
              </div>
              <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <Input placeholder="Título do evento *" value={novoItem.titulo} onChange={(e) => setNovoItem({ ...novoItem, titulo: e.target.value })} />
          <Input placeholder="Descrição (opcional)" value={novoItem.descricao} onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })} />
          <Input type="time" placeholder="Horário" value={novoItem.hora} onChange={(e) => setNovoItem({ ...novoItem, hora: e.target.value })} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">Cancelar</Button>
            <Button onClick={addItem} className="flex-1" disabled={!novoItem.titulo.trim()}>Adicionar</Button>
          </div>
        </div>
      )}

      {/* Modelos Dialog */}
      <Dialog open={showModelos} onOpenChange={setShowModelos}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modelos de Roteiro</DialogTitle>
            <DialogDescription>Selecione um modelo para aplicar ao roteiro</DialogDescription>
          </DialogHeader>
          {modelos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum modelo salvo ainda.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {modelos.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/20">
                  <button onClick={() => applyModelo(m)} className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> {m.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.itens.length} itens</p>
                  </button>
                  <button onClick={() => deleteModelo(m.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Save as Modelo Dialog */}
      <Dialog open={showSaveModelo} onOpenChange={setShowSaveModelo}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Salvar como modelo</DialogTitle>
            <DialogDescription>Dê um nome para este modelo de roteiro</DialogDescription>
          </DialogHeader>
          <Input placeholder="Nome do modelo" value={modeloNome} onChange={(e) => setModeloNome(e.target.value)} />
          <Button onClick={saveAsModelo} disabled={!modeloNome.trim()} className="w-full">Salvar</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EscalaRoteiroTab;
