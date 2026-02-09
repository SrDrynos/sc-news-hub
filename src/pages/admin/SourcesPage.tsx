import { useState } from "react";
import { useNewsSources } from "@/hooks/useArticles";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Play, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const SourcesPage = () => {
  const { data: sources = [], isLoading } = useNewsSources();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [newSource, setNewSource] = useState({ name: "", url: "", trust_score: 5 });

  const handleAdd = async () => {
    const { error } = await supabase.from("news_sources").insert({
      name: newSource.name,
      url: newSource.url,
      trust_score: newSource.trust_score,
    } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Fonte adicionada!" });
      setOpen(false);
      setNewSource({ name: "", url: "", trust_score: 5 });
      qc.invalidateQueries({ queryKey: ["news_sources"] });
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("news_sources").update({ active: !active } as any).eq("id", id);
    qc.invalidateQueries({ queryKey: ["news_sources"] });
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    await supabase.from("news_sources").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["news_sources"] });
    toast({ title: "Fonte removida" });
  };

  const handleScrapeAll = async () => {
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-news");
      if (error) throw error;
      toast({ title: "Scraping concluído!", description: `${data?.articlesProcessed || 0} notícias processadas` });
      qc.invalidateQueries({ queryKey: ["articles"] });
    } catch (err: any) {
      toast({ title: "Erro no scraping", description: err.message, variant: "destructive" });
    } finally {
      setScraping(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-heading font-bold">Fontes de Notícias</h1>
        <div className="flex gap-2">
          <Button onClick={handleScrapeAll} disabled={scraping} variant="secondary">
            {scraping ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            {scraping ? "Buscando..." : "Buscar Notícias"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Adicionar Fonte</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Fonte</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Nome da fonte"
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                />
                <Input
                  placeholder="URL do site (ex: https://portal.com.br)"
                  value={newSource.url}
                  onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                />
                <div>
                  <label className="text-sm font-medium mb-1 block">Nível de confiança (0-10)</label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={newSource.trust_score}
                    onChange={(e) => setNewSource({ ...newSource, trust_score: Number(e.target.value) })}
                  />
                </div>
                <Button onClick={handleAdd} className="w-full">Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div className="space-y-3">
          {(sources as any[]).map((source) => (
            <Card key={source.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{source.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{source.url}</p>
                </div>
                <span className="text-xs bg-muted px-2 py-1 rounded">Confiança: {source.trust_score}/10</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{source.active ? "Ativa" : "Inativa"}</span>
                  <Switch checked={source.active} onCheckedChange={() => toggleActive(source.id, source.active)} />
                </div>
                {isAdmin && (
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(source.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {sources.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhuma fonte cadastrada. Adicione fontes para começar a buscar notícias.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default SourcesPage;
