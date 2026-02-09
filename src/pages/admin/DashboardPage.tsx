import { useAllArticles, useNewsSources, useSystemSettings, useUpdateSetting } from "@/hooks/useArticles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Newspaper, Recycle, Globe, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const DashboardPage = () => {
  const { isAdmin } = useAuth();
  const { data: articles = [] } = useAllArticles();
  const { data: sources = [] } = useNewsSources();
  const { data: settings } = useSystemSettings();
  const updateSetting = useUpdateSetting();
  const { toast } = useToast();

  const published = articles.filter((a) => a.status === "published").length;
  const drafts = articles.filter((a) => a.status === "draft").length;
  const recycled = articles.filter((a) => a.status === "recycled").length;
  const activeSources = (sources || []).filter((s: any) => s.active).length;

  const autoPublishEnabled = settings?.auto_publish?.enabled ?? false;

  const toggleAutoPublish = async () => {
    if (!isAdmin) return;
    try {
      await updateSetting.mutateAsync({
        key: "auto_publish",
        value: { ...settings?.auto_publish, enabled: !autoPublishEnabled },
      });
      toast({ title: !autoPublishEnabled ? "Publicação automática LIGADA" : "Publicação automática DESLIGADA" });
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold mb-8">Dashboard</h1>

      {/* Master Switch */}
      {isAdmin && (
        <Card className="mb-8 border-2 border-secondary">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              {autoPublishEnabled ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-amber-500" />
              )}
              <div>
                <h2 className="text-lg font-heading font-bold">Chave Mestra - Publicação Automática</h2>
                <p className="text-sm text-muted-foreground">
                  {autoPublishEnabled
                    ? `Notícias com nota ≥ ${settings?.auto_publish?.min_score || 7.5} são publicadas automaticamente`
                    : "Todas as notícias vão para a área de reciclagem para revisão manual"}
                </p>
              </div>
            </div>
            <Switch checked={autoPublishEnabled} onCheckedChange={toggleAutoPublish} />
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publicadas</CardTitle>
            <Newspaper className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
            <Newspaper className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drafts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reciclagem</CardTitle>
            <Recycle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recycled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fontes Ativas</CardTitle>
            <Globe className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSources}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Articles */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Artigos</CardTitle>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum artigo encontrado. Adicione fontes e execute o scraping para começar.
            </p>
          ) : (
            <div className="space-y-3">
              {articles.slice(0, 10).map((article) => (
                <div key={article.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium truncate">{article.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {article.source_name || "Sem fonte"} • Nota: {Number(article.score).toFixed(1)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    article.status === "published"
                      ? "bg-green-100 text-green-700"
                      : article.status === "recycled"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {article.status === "published" ? "Publicado" : article.status === "recycled" ? "Reciclagem" : "Rascunho"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
