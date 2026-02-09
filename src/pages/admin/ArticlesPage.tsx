import { useState } from "react";
import { useAllArticles, useUpdateArticle, useDeleteArticle, useCategories, useRegions } from "@/hooks/useArticles";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Eye, CheckCircle, XCircle } from "lucide-react";
import type { Article } from "@/hooks/useArticles";

const ArticlesPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [editArticle, setEditArticle] = useState<Article | null>(null);
  const { data: articles = [], isLoading } = useAllArticles(statusFilter || undefined);
  const { data: categories = [] } = useCategories();
  const { data: regions = [] } = useRegions();
  const updateArticle = useUpdateArticle();
  const deleteArticle = useDeleteArticle();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const handlePublish = async (article: Article) => {
    await updateArticle.mutateAsync({
      id: article.id,
      status: "published" as any,
      published_at: new Date().toISOString(),
    });
    toast({ title: "Artigo publicado!" });
  };

  const handleRecycle = async (article: Article) => {
    await updateArticle.mutateAsync({ id: article.id, status: "recycled" as any });
    toast({ title: "Enviado para reciclagem" });
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    await deleteArticle.mutateAsync(id);
    toast({ title: "Artigo excluído" });
  };

  const handleSaveEdit = async () => {
    if (!editArticle) return;
    await updateArticle.mutateAsync({
      id: editArticle.id,
      title: editArticle.title,
      content: editArticle.content,
      excerpt: editArticle.excerpt,
      image_url: editArticle.image_url,
      category_id: editArticle.category_id,
      region_id: editArticle.region_id,
      author: editArticle.author,
    });
    setEditArticle(null);
    toast({ title: "Artigo atualizado!" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-heading font-bold">Artigos</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="published">Publicados</SelectItem>
            <SelectItem value="draft">Rascunhos</SelectItem>
            <SelectItem value="recycled">Reciclagem</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum artigo encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="flex items-center gap-4 p-4">
                {article.image_url && (
                  <img src={article.image_url} alt="" className="w-16 h-16 rounded object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{article.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {article.source_name || "Sem fonte"} • Nota: {Number(article.score).toFixed(1)} • {article.categories?.name || "Sem categoria"}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                  article.status === "published" ? "bg-green-100 text-green-700"
                    : article.status === "recycled" ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {article.status === "published" ? "Publicado" : article.status === "recycled" ? "Reciclagem" : "Rascunho"}
                </span>
                <div className="flex gap-1 flex-shrink-0">
                  {article.status !== "published" && (
                    <Button size="sm" variant="ghost" onClick={() => handlePublish(article)} title="Publicar">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                  {article.status === "published" && (
                    <Button size="sm" variant="ghost" onClick={() => handleRecycle(article)} title="Reciclar">
                      <XCircle className="h-4 w-4 text-amber-600" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setEditArticle({ ...article })} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {isAdmin && (
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(article.id)} title="Excluir">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editArticle} onOpenChange={() => setEditArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Artigo</DialogTitle>
          </DialogHeader>
          {editArticle && (
            <div className="space-y-4">
              <Input
                placeholder="Título"
                value={editArticle.title}
                onChange={(e) => setEditArticle({ ...editArticle, title: e.target.value })}
              />
              <Input
                placeholder="URL da imagem"
                value={editArticle.image_url || ""}
                onChange={(e) => setEditArticle({ ...editArticle, image_url: e.target.value })}
              />
              <Textarea
                placeholder="Resumo"
                value={editArticle.excerpt || ""}
                onChange={(e) => setEditArticle({ ...editArticle, excerpt: e.target.value })}
                rows={3}
              />
              <Textarea
                placeholder="Conteúdo"
                value={editArticle.content || ""}
                onChange={(e) => setEditArticle({ ...editArticle, content: e.target.value })}
                rows={10}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={editArticle.category_id || ""}
                  onValueChange={(v) => setEditArticle({ ...editArticle, category_id: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={editArticle.region_id || ""}
                  onValueChange={(v) => setEditArticle({ ...editArticle, region_id: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Região" /></SelectTrigger>
                  <SelectContent>
                    {regions.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Autor"
                value={editArticle.author || ""}
                onChange={(e) => setEditArticle({ ...editArticle, author: e.target.value })}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditArticle(null)}>Cancelar</Button>
                <Button onClick={handleSaveEdit}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArticlesPage;
