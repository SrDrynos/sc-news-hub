import { useSystemSettings, useUpdateSetting } from "@/hooks/useArticles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

const SettingsPage = () => {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSetting();
  const { toast } = useToast();
  const [minScore, setMinScore] = useState(7.5);

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

  if (isLoading) return <p>Carregando...</p>;

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold mb-6">Configurações</h1>

      <div className="space-y-6">
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
    </div>
  );
};

export default SettingsPage;
