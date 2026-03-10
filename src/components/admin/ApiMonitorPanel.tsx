import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Wifi, WifiOff, Newspaper, BarChart3, Globe } from "lucide-react";

const API_BASE = "https://vomljutpqbthrfpsdlki.supabase.co/functions/v1/api-noticias";

interface ApiStatus {
  online: boolean;
  publishedCount: number;
  allCount: number;
  stats: any;
  loading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

const CITIES = [
  { label: "Sangão", param: "sangao" },
  { label: "Jaguaruna", param: "jaguaruna" },
  { label: "Treze de Maio", param: "treze+de+maio" },
  { label: "Morro da Fumaça", param: "morro+da+fumaca" },
];

const ApiMonitorPanel = () => {
  const [status, setStatus] = useState<ApiStatus>({
    online: false,
    publishedCount: 0,
    allCount: 0,
    stats: null,
    loading: true,
    error: null,
    lastChecked: null,
  });
  const [cityCounts, setCityCounts] = useState<Record<string, number>>({});

  const checkApi = async () => {
    setStatus((s) => ({ ...s, loading: true, error: null }));
    try {
      const [pubRes, allRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/published`),
        fetch(`${API_BASE}/all`),
        fetch(`${API_BASE}/stats`),
      ]);

      const pubData = await pubRes.json();
      const allData = await allRes.json();
      const statsData = await statsRes.json();

      // City counts in parallel
      const cityResults = await Promise.all(
        CITIES.map(async (c) => {
          try {
            const r = await fetch(`${API_BASE}/published?city=${c.param}`);
            const d = await r.json();
            return { param: c.param, count: d.count ?? d.data?.length ?? 0 };
          } catch {
            return { param: c.param, count: 0 };
          }
        })
      );
      const counts: Record<string, number> = {};
      cityResults.forEach((r) => (counts[r.param] = r.count));
      setCityCounts(counts);

      setStatus({
        online: pubRes.ok,
        publishedCount: pubData.count ?? pubData.data?.length ?? 0,
        allCount: allData.count ?? allData.data?.length ?? 0,
        stats: statsData.data ?? statsData,
        loading: false,
        error: null,
        lastChecked: new Date(),
      });
    } catch (err: any) {
      setStatus((s) => ({
        ...s,
        online: false,
        loading: false,
        error: err.message,
        lastChecked: new Date(),
      }));
    }
  };

  useEffect(() => {
    checkApi();
  }, []);

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base">API Externa — Distribuição de Notícias</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitoramento em tempo real da API de notícias
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.online ? "default" : "destructive"} className="gap-1.5">
            {status.online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {status.online ? "Online" : "Offline"}
          </Badge>
          <Button size="sm" variant="outline" onClick={checkApi} disabled={status.loading} className="h-8 gap-1.5">
            {status.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.error && (
          <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
            Erro: {status.error}
          </div>
        )}

        {/* Main stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-muted rounded-lg p-3 text-center">
            <Newspaper className="h-4 w-4 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold">{status.loading ? "—" : status.publishedCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Publicadas</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <BarChart3 className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{status.loading ? "—" : status.allCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <Globe className="h-4 w-4 mx-auto mb-1 text-secondary" />
            <p className="text-2xl font-bold">JSON</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Formato</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <Wifi className="h-4 w-4 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold">REST</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Protocolo</p>
          </div>
        </div>

        {/* City breakdown */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Notícias por Cidade (Parceiros)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {CITIES.map((city) => (
              <div key={city.param} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-sm font-medium">{city.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {status.loading ? "…" : cityCounts[city.param] ?? 0}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Endpoints */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Endpoints</h4>
          <div className="space-y-1.5 text-xs font-mono">
            {[
              { method: "GET", path: "/published", desc: "Notícias publicadas" },
              { method: "GET", path: "/published?city=...", desc: "Filtrar por cidade" },
              { method: "GET", path: "/all", desc: "Todas as notícias" },
              { method: "GET", path: "/stats", desc: "Estatísticas" },
            ].map((ep) => (
              <div key={ep.path} className="flex items-center gap-2 bg-muted/50 rounded px-3 py-1.5">
                <Badge variant="outline" className="text-[10px] font-bold text-green-700 border-green-300 px-1.5">
                  {ep.method}
                </Badge>
                <span className="text-foreground">{ep.path}</span>
                <span className="text-muted-foreground ml-auto hidden sm:inline">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {status.lastChecked && (
          <p className="text-[10px] text-muted-foreground text-right">
            Última verificação: {status.lastChecked.toLocaleTimeString("pt-BR")}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiMonitorPanel;
