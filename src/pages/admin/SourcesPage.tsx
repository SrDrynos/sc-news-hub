import { useState, useEffect } from "react";
import { useNewsSources, useSystemSettings, useUpdateSetting } from "@/hooks/useArticles";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Play, Loader2, Key, PlugZap, Unplug, Pencil, Rss, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ApiSource {
  label: string;
  type: "api" | "rss";
  url?: string;
  enabled: boolean;
}
type ApiSources = Record<string, ApiSource>;

const emptyApiSource: Omit<ApiSource, "enabled"> & { id: string } = {
  id: "",
  label: "",
  type: "api",
  url: "",
};

const SourcesPage = () => {
  const { data: sources = [], isLoading } = useNewsSources();
  const { data: settings, isLoading: settingsLoading } = useSystemSettings();
  const updateSetting = useUpdateSetting();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [newSource, setNewSource] = useState({ name: "", url: "", trust_score: 5 });
  const [editSource, setEditSource] = useState<any>(null);

  // API/RSS management state
  const [showApiForm, setShowApiForm] = useState(false);
  const [editingApiId, setEditingApiId] = useState<string | null>(null);
  const [apiForm, setApiForm] = useState(emptyApiSource);
  const [minScore, setMinScore] = useState(7.5);

  useEffect(() => {
    if (settings?.auto_publish) {
      setMinScore(settings.auto_publish.min_score || 7.5);
    }
  }, [settings]);

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

  const handleEditSave = async () => {
    if (!editSource) return;
    const { error } = await supabase.from("news_sources").update({
      name: editSource.name,
      url: editSource.url,
      rss_url: editSource.rss_url,
      trust_score: editSource.trust_score,
    } as any).eq("id", editSource.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Fonte atualizada!" });
      setEditSource(null);
      qc.invalidateQueries({ queryKey: ["news_sources"] });
    }
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

  // API/RSS handlers
  const apiKeys = (settings?.api_keys || {}) as ApiSources;
  const apiSources = Object.entries(apiKeys);

  const handleToggleApi = async (apiId: string, enabled: boolean) => {
    const updated = { ...apiKeys, [apiId]: { ...apiKeys[apiId], enabled } };
    await updateSetting.mutateAsync({ key: "api_keys", value: updated });
    toast({ title: enabled ? "Fonte ativada" : "Fonte desativada" });
  };

  const openApiCreate = () => {
    setEditingApiId(null);
    setApiForm(emptyApiSource);
    setShowApiForm(true);
  };

  const openApiEdit = (id: string) => {
    const src = apiKeys[id];
    setEditingApiId(id);
    setApiForm({ id, label: src.label, type: src.type, url: src.url || "" });
    setShowApiForm(true);
  };

  const handleApiSave = async () => {
    const id = editingApiId || apiForm.id.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!id || !apiForm.label.trim()) {
      toast({ title: "Preencha o nome e identificador", variant: "destructive" });
      return;
    }
    const updated: ApiSources = {
      ...apiKeys,
      [id]: { label: apiForm.label, type: apiForm.type, url: apiForm.url || undefined, enabled: apiKeys[id]?.enabled ?? false },
    };
    await updateSetting.mutateAsync({ key: "api_keys", value: updated });
    toast({ title: editingApiId ? "Fonte atualizada!" : "Fonte adicionada!" });
    setShowApiForm(false);
  };

  const handleApiDelete = async (id: string) => {
    const { [id]: _, ...rest } = apiKeys;
    await updateSetting.mutateAsync({ key: "api_keys", value: rest });
    toast({ title: "Fonte excluída permanentemente" });
  };

  const handleSaveMinScore = async () => {
    await updateSetting.mutateAsync({
      key: "auto_publish",
      value: { ...settings?.auto_publish, min_score: minScore },
    });
    toast({ title: "Nota mínima atualizada!" });
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
                <Input placeholder="Nome da fonte" value={newSource.name} onChange={(e) => setNewSource({ ...newSource, name: e.target.value })} />
                <Input placeholder="URL do site (ex: https://portal.com.br)" value={newSource.url} onChange={(e) => setNewSource({ ...newSource, url: e.target.value })} />
                <div>
                  <label className="text-sm font-medium mb-1 block">Nível de confiança (0-10)</label>
                  <Input type="number" min={0} max={10} value={newSource.trust_score} onChange={(e) => setNewSource({ ...newSource, trust_score: Number(e.target.value) })} />
                </div>
                <Button onClick={handleAdd} className="w-full">Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sources list */}
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
                <Button size="sm" variant="ghost" onClick={() => setEditSource({ ...source })} title="Editar">
                  <Pencil className="h-4 w-4" />
                </Button>
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

      {/* Gerenciamento de APIs e RSS */}
      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Gerenciamento de APIs e RSS
                </CardTitle>
                <CardDescription className="mt-1">
                  Adicione, edite, ative/desative ou exclua fontes de dados (APIs e feeds RSS).
                </CardDescription>
              </div>
              <Button onClick={openApiCreate} size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Adicionar Fonte
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {apiSources.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma fonte configurada. Clique em "Adicionar Fonte" para começar.
              </p>
            ) : (
              <div className="space-y-3">
                {apiSources.map(([id, src]) => (
                  <div key={id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-3 min-w-0">
                      {src.enabled ? (
                        <PlugZap className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Unplug className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{src.label}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            src.type === "rss" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {src.type === "rss" ? "RSS" : "API"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {src.enabled ? "Ativa — buscando notícias" : "Desativada — não será utilizada"}
                          {src.url && ` • ${src.url}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <Button size="icon" variant="ghost" onClick={() => openApiEdit(id)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleApiDelete(id)} title="Excluir permanentemente">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Switch checked={src.enabled} onCheckedChange={(checked) => handleToggleApi(id, checked)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Publicação Automática */}
        <Card>
          <CardHeader>
            <CardTitle>Publicação Automática</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Chave Mestra</p>
                <p className="text-sm text-muted-foreground">Ativa/desativa publicação automática de notícias com nota alta</p>
              </div>
              <Switch
                checked={settings?.auto_publish?.enabled ?? false}
                onCheckedChange={async (checked) => {
                  await updateSetting.mutateAsync({
                    key: "auto_publish",
                    value: { ...settings?.auto_publish, enabled: checked },
                  });
                  toast({ title: checked ? "Publicação automática LIGADA" : "Publicação automática DESLIGADA" });
                }}
              />
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Nota mínima para publicação</label>
                <Input type="number" min={0} max={10} step={0.5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} />
              </div>
              <Button onClick={handleSaveMinScore}>Salvar</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Adicionar/Editar API */}
      <Dialog open={showApiForm} onOpenChange={setShowApiForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingApiId ? "Editar Fonte" : "Adicionar Fonte"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingApiId && (
              <div>
                <Label>Identificador (único, sem espaços)</Label>
                <Input placeholder="ex: newsapi, g1_rss, folha_api" value={apiForm.id} onChange={(e) => setApiForm({ ...apiForm, id: e.target.value })} />
              </div>
            )}
            <div>
              <Label>Nome da fonte</Label>
              <Input placeholder="Ex: NewsAPI, G1 RSS, Folha de SP" value={apiForm.label} onChange={(e) => setApiForm({ ...apiForm, label: e.target.value })} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={apiForm.type} onValueChange={(v) => setApiForm({ ...apiForm, type: v as "api" | "rss" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="api"><span className="flex items-center gap-2"><Globe className="h-4 w-4" /> API</span></SelectItem>
                  <SelectItem value="rss"><span className="flex items-center gap-2"><Rss className="h-4 w-4" /> RSS Feed</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL {apiForm.type === "rss" ? "do Feed RSS" : "da API"}</Label>
              <Input placeholder={apiForm.type === "rss" ? "https://site.com/feed.xml" : "https://api.example.com"} value={apiForm.url} onChange={(e) => setApiForm({ ...apiForm, url: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowApiForm(false)}>Cancelar</Button>
              <Button onClick={handleApiSave}>{editingApiId ? "Salvar" : "Adicionar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog Editar Fonte RSS */}
      <Dialog open={!!editSource} onOpenChange={() => setEditSource(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Fonte</DialogTitle>
          </DialogHeader>
          {editSource && (
            <div className="space-y-4">
              <div>
                <Label>Nome da fonte</Label>
                <Input value={editSource.name} onChange={(e) => setEditSource({ ...editSource, name: e.target.value })} />
              </div>
              <div>
                <Label>URL do site</Label>
                <Input value={editSource.url} onChange={(e) => setEditSource({ ...editSource, url: e.target.value })} />
              </div>
              <div>
                <Label>URL do RSS Feed</Label>
                <Input placeholder="https://site.com/feed" value={editSource.rss_url || ""} onChange={(e) => setEditSource({ ...editSource, rss_url: e.target.value })} />
              </div>
              <div>
                <Label>Nível de confiança (0-10)</Label>
                <Input type="number" min={0} max={10} value={editSource.trust_score} onChange={(e) => setEditSource({ ...editSource, trust_score: Number(e.target.value) })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditSource(null)}>Cancelar</Button>
                <Button onClick={handleEditSave}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SourcesPage;
