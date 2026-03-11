import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Eye, Clock, MapPin, MousePointerClick,
  TrendingUp, RefreshCw, Loader2, BarChart3, Monitor, Smartphone, Globe
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from "recharts";

interface AnalyticsData {
  overview: {
    activeUsers: number;
    totalPageViews: number;
    avgSessionDuration: string;
    bounceRate: string;
    newUsers: number;
    sessions: number;
  };
  topPages: { page: string; views: number }[];
  topCities: { city: string; users: number }[];
  deviceBreakdown: { device: string; sessions: number }[];
  dailyTraffic: { date: string; users: number; pageViews: number }[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
];

const DashboardPage = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"7" | "14" | "30">("7");
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("ga4-analytics", {
        body: { days: Number(period) },
      });
      if (fnError) throw fnError;
      if (!result?.success) throw new Error(result?.error || "Erro desconhecido");
      setData(result.data);
    } catch (err: any) {
      const msg = err?.message || "Erro ao carregar analytics";
      setError(msg);
      if (msg.includes("not configured") || msg.includes("GOOGLE")) {
        setError("Credenciais do Google Analytics não configuradas. Configure a Service Account nas secrets do projeto.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const formatDuration = (seconds: string) => {
    const s = Math.round(Number(seconds));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden">
            {(["7", "14", "30"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === p
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {p}d
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading} className="gap-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando dados do Google Analytics...
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard icon={Users} label="Usuários Ativos" value={data.overview.activeUsers.toLocaleString("pt-BR")} />
            <StatCard icon={Eye} label="Visualizações" value={data.overview.totalPageViews.toLocaleString("pt-BR")} />
            <StatCard icon={TrendingUp} label="Sessões" value={data.overview.sessions.toLocaleString("pt-BR")} />
            <StatCard icon={Users} label="Novos Usuários" value={data.overview.newUsers.toLocaleString("pt-BR")} />
            <StatCard icon={Clock} label="Tempo Médio" value={formatDuration(data.overview.avgSessionDuration)} />
            <StatCard icon={MousePointerClick} label="Taxa Rejeição" value={`${Number(data.overview.bounceRate).toFixed(1)}%`} />
          </div>

          {/* Daily Traffic Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Tráfego Diário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.dailyTraffic}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line type="monotone" dataKey="users" name="Usuários" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="pageViews" name="Visualizações" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Páginas Mais Visitadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topPages.slice(0, 10).map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1 mr-2 text-muted-foreground" title={p.page}>
                        {p.page === "/" ? "Página Inicial" : p.page}
                      </span>
                      <Badge variant="outline" className="shrink-0">{p.views.toLocaleString("pt-BR")}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Cities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Cidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topCities.slice(0, 10).map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1 mr-2">{c.city || "Desconhecida"}</span>
                      <Badge variant="outline">{c.users.toLocaleString("pt-BR")}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Devices */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Monitor className="h-4 w-4" /> Dispositivos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.deviceBreakdown}
                      dataKey="sessions"
                      nameKey="device"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ device, percent }) => `${device} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.deviceBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </CardContent>
  </Card>
);

export default DashboardPage;
