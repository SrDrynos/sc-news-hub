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
        API REST que distribui notícias em JSON para sites parceiros, filtradas por cidade.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
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
    </div>
  );
};

export default PartnersPage;
