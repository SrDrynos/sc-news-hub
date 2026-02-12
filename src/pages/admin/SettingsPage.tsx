import { useSystemSettings, useUpdateSetting } from "@/hooks/useArticles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Key, PlugZap, Unplug, Plus, Pencil, Trash2, Rss, Globe } from "lucide-react";

interface ApiSource {
  label: string;
  type: "api" | "rss";
  url?: string;
  enabled: boolean;
}

type ApiSources = Record<string, ApiSource>;

const emptySource: Omit<ApiSource, "enabled"> & { id: string } = {
  id: "",
  label: "",
  type: "api",
  url: "",
};

const SettingsPage = () => {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSetting();
  const { toast } = useToast();
  const [minScore, setMinScore] = useState(7.5);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptySource);

  useEffect(() => {
    if (settings?.auto_publish) {
      setMinScore(settings.auto_publish.min_score || 7.5);
    }
  }, [settings]);

  const handleSaveMinScore = async () => {
    await updateSetting.mutateAsync({
      key: "auto_publish",
      value: { ...settings?.auto_publish, min_score: minScore },
    });
    toast({ title: "Nota mínima atualizada!" });
  };

  const apiKeys = (settings?.api_keys || {}) as ApiSources;

  const handleToggleApi = async (apiId: string, enabled: boolean) => {
    const updated = { ...apiKeys, [apiId]: { ...apiKeys[apiId], enabled } };
    await updateSetting.mutateAsync({ key: "api_keys", value: updated });
    toast({
      title: enabled ? "Fonte ativada" : "Fonte desativada",
      description: `${apiKeys[apiId]?.label || apiId} foi ${enabled ? "ativada" : "desativada"}.`,
    });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptySource);
    setShowForm(true);
  };

  const openEdit = (id: string) => {
    const src = apiKeys[id];
    setEditingId(id);
    setForm({ id, label: src.label, type: src.type, url: src.url || "" });
    setShowForm(true);
  };

  const handleSave = async () => {
    const id = editingId || form.id.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!id || !form.label.trim()) {
      toast({ title: "Preencha o nome e identificador", variant: "destructive" });
      return;
    }
    const updated: ApiSources = {
      ...apiKeys,
      [id]: { label: form.label, type: form.type, url: form.url || undefined, enabled: apiKeys[id]?.enabled ?? false },
    };
    await updateSetting.mutateAsync({ key: "api_keys", value: updated });
    toast({ title: editingId ? "Fonte atualizada!" : "Fonte adicionada!" });
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    const { [id]: _, ...rest } = apiKeys;
    await updateSetting.mutateAsync({ key: "api_keys", value: rest });
    toast({ title: "Fonte excluída permanentemente" });
  };

  if (isLoading) return <p>Carregando...</p>;

  const sources = Object.entries(apiKeys);

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold mb-6">Configurações</h1>

      <div className="space-y-6">
        {/* Gerenciamento de Fontes */}
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
              <Button onClick={openCreate} size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Adicionar Fonte
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sources.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma fonte configurada. Clique em "Adicionar Fonte" para começar.
              </p>
            ) : (
              <div className="space-y-3">
                {sources.map(([id, src]) => (
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
                      <Button size="icon" variant="ghost" onClick={() => openEdit(id)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(id)} title="Excluir permanentemente">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Switch
                        checked={src.enabled}
                        onCheckedChange={(checked) => handleToggleApi(id, checked)}
                      />
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
                <Input
                  type="number"
                  min={0}
                  max={10}
                  step={0.5}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                />
              </div>
              <Button onClick={handleSaveMinScore}>Salvar</Button>
            </div>
          </CardContent>
        </Card>

        {/* Pesos de Pontuação */}
        <Card>
          <CardHeader>
            <CardTitle>Pesos de Pontuação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure os pesos para cálculo automático da nota de cada notícia.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {settings?.scoring_weights && Object.entries(settings.scoring_weights).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <label className="text-sm flex-1 capitalize">{key.replace(/_/g, " ")}</label>
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    step={0.5}
                    value={Number(value)}
                    className="w-20"
                    onChange={async (e) => {
                      const newWeights = { ...settings.scoring_weights, [key]: Number(e.target.value) };
                      await updateSetting.mutateAsync({ key: "scoring_weights", value: newWeights });
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Adicionar/Editar */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Fonte" : "Adicionar Fonte"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingId && (
              <div>
                <Label>Identificador (único, sem espaços)</Label>
                <Input
                  placeholder="ex: newsapi, g1_rss, folha_api"
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                />
              </div>
            )}
            <div>
              <Label>Nome da fonte</Label>
              <Input
                placeholder="Ex: NewsAPI, G1 RSS, Folha de SP"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "api" | "rss" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api">
                    <span className="flex items-center gap-2"><Globe className="h-4 w-4" /> API</span>
                  </SelectItem>
                  <SelectItem value="rss">
                    <span className="flex items-center gap-2"><Rss className="h-4 w-4" /> RSS Feed</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL {form.type === "rss" ? "do Feed RSS" : "da API"}</Label>
              <Input
                placeholder={form.type === "rss" ? "https://site.com/feed.xml" : "https://api.example.com"}
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{editingId ? "Salvar" : "Adicionar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;