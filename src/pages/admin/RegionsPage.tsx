import { useState } from "react";
import { useRegions } from "@/hooks/useArticles";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

const RegionsPage = () => {
  const { data: regions = [], isLoading } = useRegions();
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");

  const handleAdd = async () => {
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
    const kw = keywords.split(",").map((k) => k.trim()).filter(Boolean);
    const { error } = await supabase.from("regions").insert({ name, slug, keywords: kw } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Região adicionada!" });
      setOpen(false);
      setName("");
      setKeywords("");
      qc.invalidateQueries({ queryKey: ["regions"] });
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    await supabase.from("regions").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["regions"] });
    toast({ title: "Região removida" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-heading font-bold">Regiões</h1>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nova Região</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Região</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
                <Input placeholder="Palavras-chave (separadas por vírgula)" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
                <Button onClick={handleAdd} className="w-full">Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? <p>Carregando...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(regions as any[]).map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-bold">{r.name}</h3>
                  {isAdmin && (
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">/{r.slug}</p>
                {r.keywords && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(r.keywords as string[]).map((kw: string) => (
                      <span key={kw} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{kw}</span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RegionsPage;
