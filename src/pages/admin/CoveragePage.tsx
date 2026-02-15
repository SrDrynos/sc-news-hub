import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertTriangle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CityCoverage {
  region_id: string;
  name: string;
  slug: string;
  count_24h: number;
  count_7d: number;
  latest: string | null;
}

interface DailyData {
  regionId: string;
  cityName: string;
  days: { date: string; label: string; count: number }[];
}

const TARGET_CITIES = [
  "Florianópolis", "Joinville", "Blumenau", "Balneário Camboriú", "Itajaí",
  "São José", "Criciúma", "Chapecó", "Jaraguá do Sul", "Brusque",
  "Tubarão", "Lages", "Itapema", "Palhoça", "Araranguá",
  "Sombrio", "Içara", "Balneário Rincão",
  "Sangão", "Morro da Fumaça", "Treze de Maio", "Jaguaruna",
];

const CoveragePage = () => {
  const [coverage, setCoverage] = useState<CityCoverage[]>([]);
  const [heatmapData, setHeatmapData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPublished, setTotalPublished] = useState(0);
  const [noRegion, setNoRegion] = useState(0);

  const fetchCoverage = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: regions } = await supabase.from("regions").select("id, name, slug");
      if (!regions) { setLoading(false); return; }

      const { data: articles } = await supabase
        .from("articles")
        .select("region_id, published_at, status")
        .eq("status", "published")
        .gte("published_at", since7d);

      const { count: noRegCount } = await supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .is("region_id", null)
        .gte("published_at", since24h);

      setNoRegion(noRegCount || 0);

      const allArticles = articles || [];
      setTotalPublished(allArticles.filter(a => a.published_at && a.published_at >= since24h).length);

      // Build 7-day buckets
      const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const days: { date: string; label: string; start: Date; end: Date }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        days.push({
          date: `${d.getDate()}/${d.getMonth() + 1}`,
          label: dayLabels[d.getDay()],
          start: d,
          end,
        });
      }

      const coverageMap: CityCoverage[] = [];
      const heatmap: DailyData[] = [];

      for (const r of regions) {
        const regionArticles = allArticles.filter(a => a.region_id === r.id);
        const last24h = regionArticles.filter(a => a.published_at && a.published_at >= since24h);
        const latest = [...regionArticles].sort((a, b) =>
          (b.published_at || "").localeCompare(a.published_at || "")
        )[0]?.published_at || null;

        coverageMap.push({
          region_id: r.id, name: r.name, slug: r.slug,
          count_24h: last24h.length, count_7d: regionArticles.length, latest,
        });

        heatmap.push({
          regionId: r.id,
          cityName: r.name,
          days: days.map(day => ({
            date: day.date,
            label: day.label,
            count: regionArticles.filter(a => {
              if (!a.published_at) return false;
              const t = new Date(a.published_at).getTime();
              return t >= day.start.getTime() && t <= day.end.getTime();
            }).length,
          })),
        });
      }

      coverageMap.sort((a, b) => {
        if (a.count_24h === 0 && b.count_24h > 0) return -1;
        if (a.count_24h > 0 && b.count_24h === 0) return 1;
        return a.name.localeCompare(b.name);
      });

      // Sort heatmap by total desc
      heatmap.sort((a, b) => {
        const totalA = a.days.reduce((s, d) => s + d.count, 0);
        const totalB = b.days.reduce((s, d) => s + d.count, 0);
        return totalB - totalA;
      });

      setCoverage(coverageMap);
      setHeatmapData(heatmap);
    } catch (err) {
      console.error("Error fetching coverage:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoverage(); }, []);

  const citiesWithNews = coverage.filter(c => c.count_24h > 0).length;
  const citiesWithout = coverage.filter(c => c.count_24h === 0).length;

  const getTimeSince = (dateStr: string | null) => {
    if (!dateStr) return "Nunca";
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "< 1h atrás";
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  const maxCount = useMemo(() => {
    let m = 1;
    for (const row of heatmapData) {
      for (const d of row.days) { if (d.count > m) m = d.count; }
    }
    return m;
  }, [heatmapData]);

  const getCellColor = (count: number) => {
    if (count === 0) return "bg-muted";
    const intensity = Math.min(count / maxCount, 1);
    if (intensity <= 0.25) return "bg-emerald-200 dark:bg-emerald-900/40";
    if (intensity <= 0.5) return "bg-emerald-400 dark:bg-emerald-700/60";
    if (intensity <= 0.75) return "bg-emerald-500 dark:bg-emerald-600";
    return "bg-emerald-700 dark:bg-emerald-500";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Cobertura por Cidade</h1>
          <p className="text-muted-foreground mt-1">Monitoramento de notícias nas últimas 24 horas</p>
        </div>
        <Button variant="outline" onClick={fetchCoverage} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{citiesWithNews}</p>
                <p className="text-xs text-muted-foreground">Cidades com notícias</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{citiesWithout}</p>
                <p className="text-xs text-muted-foreground">Cidades sem notícias (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPublished}</p>
                <p className="text-xs text-muted-foreground">Total publicadas (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{noRegion}</p>
                <p className="text-xs text-muted-foreground">Sem cidade atribuída</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      {!loading && heatmapData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Heatmap — Últimos 7 dias</CardTitle>
            <CardDescription>Intensidade de publicações por cidade e dia</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header row */}
              <div className="flex items-center gap-1 mb-1">
                <div className="w-36 shrink-0" />
                {heatmapData[0]?.days.map((d, i) => (
                  <div key={i} className="flex-1 text-center">
                    <p className="text-[10px] font-medium text-muted-foreground">{d.label}</p>
                    <p className="text-[10px] text-muted-foreground">{d.date}</p>
                  </div>
                ))}
                <div className="w-12 shrink-0 text-center text-[10px] font-medium text-muted-foreground">Total</div>
              </div>
              {/* Data rows */}
              {heatmapData.map(row => {
                const total = row.days.reduce((s, d) => s + d.count, 0);
                return (
                  <div key={row.regionId} className="flex items-center gap-1 mb-0.5">
                    <div className="w-36 shrink-0 text-xs font-medium truncate pr-2">{row.cityName}</div>
                    {row.days.map((d, i) => (
                      <Tooltip key={i}>
                        <TooltipTrigger asChild>
                          <div className={`flex-1 h-7 rounded-sm flex items-center justify-center text-[10px] font-medium transition-colors cursor-default ${getCellColor(d.count)} ${d.count > 0 ? "text-white" : "text-muted-foreground"}`}>
                            {d.count > 0 ? d.count : ""}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{row.cityName}</p>
                          <p>{d.label} {d.date}: {d.count} notícia{d.count !== 1 ? "s" : ""}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    <div className="w-12 shrink-0 text-center text-xs font-bold">{total}</div>
                  </div>
                );
              })}
              {/* Legend */}
              <div className="flex items-center gap-2 mt-4 text-[10px] text-muted-foreground">
                <span>Menos</span>
                <div className="h-4 w-4 rounded-sm bg-muted" />
                <div className="h-4 w-4 rounded-sm bg-emerald-200 dark:bg-emerald-900/40" />
                <div className="h-4 w-4 rounded-sm bg-emerald-400 dark:bg-emerald-700/60" />
                <div className="h-4 w-4 rounded-sm bg-emerald-500 dark:bg-emerald-600" />
                <div className="h-4 w-4 rounded-sm bg-emerald-700 dark:bg-emerald-500" />
                <span>Mais</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* City grid */}
      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {coverage.map(city => (
            <Card key={city.region_id} className={city.count_24h === 0 ? "border-destructive" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-sm">{city.name}</h3>
                  {city.count_24h === 0 ? (
                    <Badge variant="destructive" className="text-[10px] px-1.5">SEM COBERTURA</Badge>
                  ) : city.count_24h <= 2 ? (
                    <Badge variant="secondary" className="text-[10px] px-1.5">{city.count_24h} notícia{city.count_24h > 1 ? "s" : ""}</Badge>
                  ) : (
                    <Badge variant="default" className="text-[10px] px-1.5">{city.count_24h} notícias</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>Últimos 7 dias: {city.count_7d} notícias</p>
                  <p>Última publicação: {getTimeSince(city.latest)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoveragePage;
