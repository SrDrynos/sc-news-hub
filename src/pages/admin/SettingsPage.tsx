import { useState, useRef } from "react";
import { useSystemSettings, useUpdateSetting } from "@/hooks/useArticles";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

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

// --- Main Page ---
const SettingsPage = () => {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSetting();
  const { toast } = useToast();

  if (isLoading) return <p>Carregando...</p>;

  const branding = (settings?.branding as any) || { logo_light_url: "", logo_dark_url: "" };
  const analytics = (settings?.analytics as any) || { ga4_id: "", gtm_id: "" };
  const monetization = (settings?.monetization as any) || { adsense_publisher_id: "", ads_txt: "" };
  const scoringWeights = settings?.scoring_weights;

  const saveBranding = async (update: Partial<typeof branding>) => {
    const newVal = { ...branding, ...update };
    await updateSetting.mutateAsync({ key: "branding", value: newVal });
    toast({ title: "Branding salvo!" });
  };

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
        {/* ========== BRANDING ========== */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" /> Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload do logo principal do site. Versões light e dark.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <LogoUploader
                label="Logo Light (fundo claro)"
                currentUrl={branding.logo_light_url || ""}
                onUploaded={(url) => saveBranding({ logo_light_url: url })}
              />
              <LogoUploader
                label="Logo Dark (fundo escuro)"
                currentUrl={branding.logo_dark_url || ""}
                onUploaded={(url) => saveBranding({ logo_dark_url: url })}
              />
            </div>
          </CardContent>
        </Card>

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
