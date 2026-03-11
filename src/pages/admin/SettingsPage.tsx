import { useState, useRef, useEffect } from "react";
import { useSystemSettings, useUpdateSetting } from "@/hooks/useArticles";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, CheckCircle2, XCircle, AlertCircle, Globe, RefreshCw, Loader2 } from "lucide-react";

// --- Logo Upload Sub-component ---
const LogoUploader = ({
  label,
  currentUrl,
  onUploaded,
}: {
  label: string;
  currentUrl: string;
  onUploaded: (url: string) => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Selecione um arquivo de imagem", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `logo-${label.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("site-assets").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(fileName);
      onUploaded(urlData.publicUrl);
      toast({ title: "Logo enviado!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          placeholder="URL do logo"
          value={currentUrl}
          onChange={(e) => onUploaded(e.target.value)}
          className="flex-1"
        />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="gap-1 shrink-0"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Enviando..." : "Upload"}
        </Button>
      </div>
      {currentUrl && (
        <div className="bg-muted rounded p-3 flex items-center justify-center">
          <img
            src={currentUrl}
            alt={label}
            className="max-h-16 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
    </div>
  );
};

// --- Validation helpers ---
function validateGaId(id: string): "valid" | "invalid" | "empty" {
  if (!id.trim()) return "empty";
  return /^G-[A-Z0-9]{4,}$/i.test(id.trim()) ? "valid" : "invalid";
}

function validateGtmId(id: string): "valid" | "invalid" | "empty" {
  if (!id.trim()) return "empty";
  return /^GTM-[A-Z0-9]{4,}$/i.test(id.trim()) ? "valid" : "invalid";
}

function validateAdsenseId(id: string): "valid" | "invalid" | "empty" {
  if (!id.trim()) return "empty";
  return /^(ca-)?pub-\d{10,}$/i.test(id.trim()) ? "valid" : "invalid";
}

function validateAdsTxt(txt: string): "valid" | "invalid" | "empty" {
  if (!txt.trim()) return "empty";
  const lines = txt.trim().split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"));
  const valid = lines.every((l) => l.split(",").length >= 3);
  return valid ? "valid" : "invalid";
}

const StatusBadge = ({ status }: { status: "valid" | "invalid" | "empty" }) => {
  if (status === "empty") return <Badge variant="outline" className="gap-1 text-muted-foreground"><AlertCircle className="h-3 w-3" />Não configurado</Badge>;
  if (status === "valid") return <Badge variant="outline" className="gap-1 text-green-600 border-green-300"><CheckCircle2 className="h-3 w-3" />Válido</Badge>;
  return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Inválido</Badge>;
};

// --- Google Indexing Monitor ---
const GoogleIndexingPanel = () => {
  const [stats, setStats] = useState<{ indexed: number; remaining: number; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const { toast } = useToast();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("is_admin");
      if (!data) return;
      
      const { count: indexed } = await supabase
        .from("articles")
        .select("*", { count: "exact", head: true })
        .eq("status", "published")
        .not("google_indexed_at", "is", null);
      
      const { count: total } = await supabase
        .from("articles")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");
      
      setStats({
        indexed: indexed || 0,
        remaining: (total || 0) - (indexed || 0),
        total: total || 0,
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const runBatch = async () => {
    setBatchRunning(true);
    try {
      const res = await supabase.functions.invoke("batch-indexing", {
        body: { source: "admin-manual" },
      });
      if (res.error) throw res.error;
      const data = res.data as any;
      toast({
        title: "Lote concluído!",
        description: `${data.indexed || 0} indexados, ${data.errors || 0} erros`,
      });
      await fetchStats();
    } catch (err: any) {
      toast({ title: "Erro ao executar lote", description: err.message, variant: "destructive" });
    } finally {
      setBatchRunning(false);
    }
  };

  const pct = stats ? (stats.total > 0 ? Math.round((stats.indexed / stats.total) * 100) : 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" /> Google Indexing API
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Monitoramento da indexação automática no Google. Novas notícias são indexadas instantaneamente. Um cron diário (4h) envia lotes de até 200 URLs.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando estatísticas...
          </div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso da indexação</span>
              <span className="font-mono font-bold">{pct}%</span>
            </div>
            <Progress value={pct} className="h-3" />
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-primary">{stats.indexed}</p>
                <p className="text-xs text-muted-foreground">Indexados</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold text-orange-500">{stats.remaining}</p>
                <p className="text-xs text-muted-foreground">Restantes</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total publicados</p>
              </div>
            </div>

            {stats.remaining > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-dashed">
                <div className="text-sm">
                  <p className="font-medium">Previsão: ~{Math.ceil(stats.remaining / 200)} dia(s) restantes</p>
                  <p className="text-muted-foreground text-xs">Cron envia 200/dia automaticamente às 4h (BRT)</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runBatch}
                  disabled={batchRunning}
                  className="gap-1"
                >
                  {batchRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {batchRunning ? "Enviando..." : "Enviar lote agora"}
                </Button>
              </div>
            )}

            {stats.remaining === 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Todas as notícias estão indexadas no Google!
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={fetchStats} disabled={loading} className="gap-1">
              <RefreshCw className="h-3 w-3" /> Atualizar dados
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

// --- Main Page ---
const SettingsPage = () => {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSetting();
  const { toast } = useToast();

  if (isLoading) return <p>Carregando...</p>;

  const analytics = (settings?.analytics as any) || { ga4_id: "", gtm_id: "" };
  const monetization = (settings?.monetization as any) || { adsense_publisher_id: "", ads_txt: "" };
  const monetization = (settings?.monetization as any) || { adsense_publisher_id: "", ads_txt: "" };


  const saveAnalytics = async (update: Partial<typeof analytics>) => {
    const newVal = { ...analytics, ...update };
    await updateSetting.mutateAsync({ key: "analytics", value: newVal });
    toast({ title: "Analytics salvo!" });
  };

  const saveMonetization = async (update: Partial<typeof monetization>) => {
    const newVal = { ...monetization, ...update };
    await updateSetting.mutateAsync({ key: "monetization", value: newVal });
    toast({ title: "Monetização salva!" });
  };


  return (
    <div>
      <h1 className="text-3xl font-heading font-bold mb-6">Configurações</h1>

      <div className="space-y-6">
        {/* ========== ANALYTICS ========== */}
        <Card>
          <CardHeader>
            <CardTitle>Tráfego &amp; Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure o rastreamento do Google Analytics 4 e Google Tag Manager.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Google Analytics 4 (GA4)</Label>
                  <StatusBadge status={validateGaId(analytics.ga4_id || "")} />
                </div>
                <Input
                  placeholder="G-XXXXXXXXXX"
                  value={analytics.ga4_id || ""}
                  onChange={(e) => saveAnalytics({ ga4_id: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground">Formato: G-XXXXXXXXXX</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Google Tag Manager (GTM)</Label>
                  <StatusBadge status={validateGtmId(analytics.gtm_id || "")} />
                </div>
                <Input
                  placeholder="GTM-XXXXXXX"
                  value={analytics.gtm_id || ""}
                  onChange={(e) => saveAnalytics({ gtm_id: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground">Formato: GTM-XXXXXXX</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========== GOOGLE INDEXING ========== */}
        <GoogleIndexingPanel />

        {/* ========== MONETIZAÇÃO ========== */}
        <Card>
          <CardHeader>
            <CardTitle>Monetização (AdSense)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure o Google AdSense para exibição de anúncios.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Publisher ID</Label>
                <StatusBadge status={validateAdsenseId(monetization.adsense_publisher_id || "")} />
              </div>
              <Input
                placeholder="ca-pub-XXXXXXXXXX ou pub-XXXXXXXXXX"
                value={monetization.adsense_publisher_id || ""}
                onChange={(e) => saveMonetization({ adsense_publisher_id: e.target.value })}
              />
              <p className="text-[10px] text-muted-foreground">Formato: ca-pub-XXXXXXXXXX</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Conteúdo ads.txt</Label>
                <StatusBadge status={validateAdsTxt(monetization.ads_txt || "")} />
              </div>
              <Textarea
                placeholder={"google.com, pub-XXXXXXXXXX, DIRECT, f08c47fec0942fa0"}
                value={monetization.ads_txt || ""}
                onChange={(e) => saveMonetization({ ads_txt: e.target.value })}
                rows={4}
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Cada linha: domínio, ID do publisher, tipo (DIRECT/RESELLER), ID da conta. Linhas com # são comentários.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ========== AD MANAGER (GPT) ========== */}
        <Card>
          <CardHeader>
            <CardTitle>Google Ad Manager (GPT)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure os blocos de anúncio do Google Ad Manager. Deixe vazio para usar a rede de testes do Google.
            </p>
            <div className="space-y-4">
              {AD_POSITIONS.map(({ key, label, defaultSize }) => {
                const slot = adSlots[key] || {};
                return (
                  <div key={key} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-[10px] text-muted-foreground">Tamanho padrão: {defaultSize}</p>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={slot.enabled !== false}
                          onChange={(e) => saveAdSlot(key, { enabled: e.target.checked })}
                          className="rounded"
                        />
                        Ativo
                      </label>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Caminho do bloco de anúncios</Label>
                        <Input
                          placeholder="/network-code/ad-unit-code"
                          value={slot.path || ""}
                          onChange={(e) => saveAdSlot(key, { path: e.target.value })}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tamanho [largura, altura]</Label>
                        <Input
                          placeholder={defaultSize}
                          value={slot.size ? `${slot.size[0]}x${slot.size[1]}` : ""}
                          onChange={(e) => {
                            const parts = e.target.value.split("x").map(Number);
                            if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
                              saveAdSlot(key, { size: parts });
                            }
                          }}
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ========== PESOS DE PONTUAÇÃO (existente) ========== */}
        {scoringWeights && (
          <Card>
            <CardHeader>
              <CardTitle>Pesos de Pontuação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure os pesos para cálculo automático da nota de cada notícia.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(scoringWeights).map(([key, value]) => (
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
                        const newWeights = { ...scoringWeights, [key]: Number(e.target.value) };
                        await updateSetting.mutateAsync({ key: "scoring_weights", value: newWeights });
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
