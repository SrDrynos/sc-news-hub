import { useCategories, useRegions } from "@/hooks/useArticles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rss, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rss-feed`;

const RssPage = () => {
  const { data: categories = [] } = useCategories();
  const { data: regions = [] } = useRegions();
  const { toast } = useToast();

  const copy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "URL copiada!" });
  };

  const RssLink = ({ label, url }: { label: string; url: string }) => (
    <div className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <Rss className="h-4 w-4 text-orange-500 shrink-0" />
        <span className="text-sm truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Badge variant="outline" className="text-[10px] cursor-pointer">Abrir</Badge>
        </a>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(url)}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold mb-6">Feeds RSS</h1>
      <p className="text-muted-foreground mb-6">
        Os feeds RSS são gerados automaticamente e atualizados a cada 3 minutos (cache).
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Global */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Feed Global</CardTitle></CardHeader>
          <CardContent>
            <RssLink label="Todas as notícias" url={BASE} />
          </CardContent>
        </Card>

        {/* Per Category */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Por Categoria</CardTitle></CardHeader>
          <CardContent>
            {(categories as any[]).map((c) => (
              <RssLink key={c.id} label={c.name} url={`${BASE}?type=category&slug=${c.slug}`} />
            ))}
          </CardContent>
        </Card>

        {/* Per City */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Por Cidade</CardTitle></CardHeader>
          <CardContent>
            {(regions as any[]).map((r) => (
              <RssLink key={r.id} label={r.name} url={`${BASE}?type=city&slug=${r.slug}`} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RssPage;
