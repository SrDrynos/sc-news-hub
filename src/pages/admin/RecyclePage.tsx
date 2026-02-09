import { useAllArticles, useUpdateArticle, useDeleteArticle } from "@/hooks/useArticles";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Trash2, Info } from "lucide-react";

const RecyclePage = () => {
  const { data: articles = [], isLoading } = useAllArticles("recycled");
  const updateArticle = useUpdateArticle();
  const deleteArticle = useDeleteArticle();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const handleApprove = async (id: string) => {
    await updateArticle.mutateAsync({
      id,
      status: "published" as any,
      published_at: new Date().toISOString(),
    });
    toast({ title: "Artigo aprovado e publicado!" });
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    await deleteArticle.mutateAsync(id);
    toast({ title: "Artigo excluído" });
  };

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold mb-2">Área de Reciclagem</h1>
      <p className="text-muted-foreground mb-6">
        Notícias com nota baixa ou publicação automática desligada aparecem aqui para revisão.
      </p>

      {isLoading ? (
        <p>Carregando...</p>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma notícia na reciclagem. 🎉
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {article.image_url && (
                    <img src={article.image_url} alt="" className="w-24 h-24 rounded object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold mb-1">{article.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{article.excerpt}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Fonte: {article.source_name || "Desconhecida"}</span>
                      <span>Nota: <strong>{Number(article.score).toFixed(1)}</strong></span>
                      {article.categories && <span>Categoria: {article.categories.name}</span>}
                    </div>
                    {article.score_criteria && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(article.score_criteria as Record<string, any>).map(([key, val]) => (
                          <span key={key} className="text-[10px] bg-muted px-2 py-0.5 rounded">
                            {key}: {String(val)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button size="sm" onClick={() => handleApprove(article.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    {isAdmin && (
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(article.id)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecyclePage;
