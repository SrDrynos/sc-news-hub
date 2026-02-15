import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertTriangle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CityCoverage {
  region_id: string;
  name: string;
  slug: string;
  count_24h: number;
  count_7d: number;
  latest: string | null;
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
  const [loading, setLoading] = useState(true);
  const [totalPublished, setTotalPublished] = useState(0);
  const [noRegion, setNoRegion] = useState(0);

  const fetchCoverage = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch all regions
      const { data: regions } = await supabase.from("regions").select("id, name, slug");
      if (!regions) { setLoading(false); return; }

      // Fetch articles from last 7 days with region
      const { data: articles } = await supabase
        .from("articles")
        .select("region_id, published_at, status")
        .eq("status", "published")
        .gte("published_at", since7d);

      // Count articles without region in last 24h
      const { count: noRegCount } = await supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .is("region_id", null)
        .gte("published_at", since24h);

      setNoRegion(noRegCount || 0);

      const allArticles = articles || [];
      setTotalPublished(allArticles.filter(a => a.published_at && a.published_at >= since24h).length);

      const coverageMap: CityCoverage[] = regions.map(r => {
        const regionArticles = allArticles.filter(a => a.region_id === r.id);
        const last24h = regionArticles.filter(a => a.published_at && a.published_at >= since24h);
        const latest = regionArticles.sort((a, b) =>
          (b.published_at || "").localeCompare(a.published_at || "")
        )[0]?.published_at || null;

        return {
          region_id: r.id,
          name: r.name,
          slug: r.slug,
          count_24h: last24h.length,
          count_7d: regionArticles.length,
          latest,
        };
      });

      // Sort: cities with 0 articles first, then by name
      coverageMap.sort((a, b) => {
        if (a.count_24h === 0 && b.count_24h > 0) return -1;
        if (a.count_24h > 0 && b.count_24h === 0) return 1;
        return a.name.localeCompare(b.name);
      });

      setCoverage(coverageMap);
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

      {/* City grid */}
      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {coverage.map(city => (
            <Card key={city.region_id} className={city.count_24h === 0 ? "border-red-300 dark:border-red-800" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-sm">{city.name}</h3>
                  {city.count_24h === 0 ? (
                    <Badge variant="destructive" className="text-[10px] px-1.5">SEM COBERTURA</Badge>
                  ) : city.count_24h <= 2 ? (
                    <Badge variant="secondary" className="text-[10px] px-1.5 bg-amber-100 text-amber-800">{city.count_24h} notícia{city.count_24h > 1 ? "s" : ""}</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-1.5 bg-green-100 text-green-800">{city.count_24h} notícias</Badge>
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
