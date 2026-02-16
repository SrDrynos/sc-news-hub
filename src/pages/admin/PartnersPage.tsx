import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/partner-api`;

const PARTNERS = [
  { id: "sangao-sc", city: "Sangão" },
  { id: "morro-da-fumaca-sc", city: "Morro da Fumaça" },
  { id: "treze-de-maio-sc", city: "Treze de Maio" },
  { id: "jaguaruna-sc", city: "Jaguaruna" },
];

const FIELDS = [
  { name: "id", desc: "UUID do artigo" },
  { name: "sub_chapeu", desc: "1 palavra (categoria)" },
  { name: "title", desc: "Título completo" },
  { name: "subtitle", desc: "Até 25 palavras" },
  { name: "excerpt", desc: "Resumo curto" },
  { name: "content", desc: "Até 300 palavras" },
  { name: "image_url", desc: "URL da imagem" },
  { name: "image_credit", desc: "Crédito da imagem" },
  { name: "source_name", desc: "Nome da fonte" },
  { name: "source_url", desc: "Link da matéria original" },
  { name: "published_at", desc: "Data de publicação" },
  { name: "keywords", desc: "Array de palavras-chave" },
  { name: "category", desc: "Categoria da notícia" },
];

const PartnersPage = () => {
  const { toast } = useToast();

  const copy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "URL copiada!" });
  };

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold mb-2">API de Parceiros</h1>
      <p className="text-muted-foreground mb-6">
        API REST que distribui notícias em JSON para sites parceiros, filtradas por cidade. Nenhum campo obrigatório retorna null.
      </p>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {PARTNERS.map((p) => {
          const url = `${BASE}?partner=${p.id}`;
          return (
            <Card key={p.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.city}</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">{p.id}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <code className="block text-xs bg-muted p-2 rounded mb-3 break-all">{url}</code>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => copy(url)}>
                    <Copy className="h-3.5 w-3.5" /> Copiar
                  </Button>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1">
                      <ExternalLink className="h-3.5 w-3.5" /> Testar
                    </Button>
                  </a>
                </div>
                <p className="text-[10px] text-muted-foreground mt-3">
                  Parâmetros opcionais: <code>category</code> (slug), <code>limit</code> (1-100)
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estrutura do JSON</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1">
            {FIELDS.map((f) => (
              <div key={f.name} className="flex items-center gap-2 text-xs">
                <code className="bg-muted px-1.5 py-0.5 rounded font-mono min-w-[120px]">{f.name}</code>
                <span className="text-muted-foreground">{f.desc}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-muted/60 rounded text-xs text-muted-foreground border border-border">
            <strong>Aviso obrigatório:</strong> O Melhor News é um agregador de notícias. Este conteúdo é apenas um resumo informativo. A matéria completa e a responsabilidade editorial são da fonte original.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnersPage;
