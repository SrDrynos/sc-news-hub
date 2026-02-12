import { useSystemSettings, useUpdateSetting } from "@/hooks/useArticles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSetting();
  const { toast } = useToast();

  if (isLoading) return <p>Carregando...</p>;

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold mb-6">Configurações</h1>

      <div className="space-y-6">
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
    </div>
  );
};

export default SettingsPage;
