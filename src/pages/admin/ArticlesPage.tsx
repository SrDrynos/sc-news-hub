import { useState } from "react";
import { useAllArticles, useUpdateArticle, useDeleteArticle, useCategories, useRegions } from "@/hooks/useArticles";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, CheckCircle, XCircle, Plus } from "lucide-react";
import type { Article } from "@/hooks/useArticles";
import ArticleForm from "@/components/admin/ArticleForm";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 120);
}

const emptyArticle = {
  title: "",
  excerpt: "",
  content: "",
  image_url: "",
  image_caption: "",
  meta_description: "",
  category_id: "",
  region_id: "",
  author: "Redação Melhor News",
  source_name: "",
  source_url: "",
  status: "draft" as const,
};

const ArticlesPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [editArticle, setEditArticle] = useState<Article | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newArticle, setNewArticle] = useState(emptyArticle);
  const [creating, setCreating] = useState(false);

  const { data: articles = [], isLoading } = useAllArticles(statusFilter || undefined);
  const { data: categories = [] } = useCategories();
  const { data: regions = [] } = useRegions();
  const updateArticle = useUpdateArticle();
  const deleteArticle = useDeleteArticle();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

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
      source_name: editArticle.source_name,
      source_url: editArticle.source_url,
      meta_description: (editArticle as any).meta_description,
      image_caption: (editArticle as any).image_caption,
    } as any);
    setEditArticle(null);
    toast({ title: "Artigo atualizado!" });
  };

  const handleCreate = async (publishNow: boolean) => {
    if (!newArticle.title.trim()) {
      toast({ title: "Título é obrigatório", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const slug = generateSlug(newArticle.title);
      const { error } = await supabase.from("articles").insert({
        title: newArticle.title,
        slug,
        excerpt: newArticle.excerpt || null,
        content: newArticle.content || null,
        image_url: newArticle.image_url || null,
        image_caption: newArticle.image_caption || null,
        meta_description: newArticle.meta_description || null,
        category_id: newArticle.category_id || null,
        region_id: newArticle.region_id || null,
        author: newArticle.author || null,
        source_name: newArticle.source_name || null,
        source_url: newArticle.source_url || null,
        status: publishNow ? "published" : "draft",
        published_at: publishNow ? new Date().toISOString() : null,
        score: 8,
      } as any);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["articles"] });
      setShowCreate(false);
      setNewArticle(emptyArticle);
      toast({ title: publishNow ? "Notícia publicada!" : "Rascunho salvo!" });
    } catch (e: any) {
      toast({ title: "Erro ao criar notícia", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-heading font-bold">Artigos</h1>
        <div className="flex gap-3">
          <Button onClick={() => { setNewArticle(emptyArticle); setShowCreate(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Notícia
          </Button>
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
                <img
                  src={article.image_url || "/images/placeholder-news.jpg"}
                  alt={article.title}
                  className="w-16 h-16 rounded object-cover flex-shrink-0 bg-muted"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/images/placeholder-news.jpg"; }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{article.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {article.source_name || "Sem fonte"} • Nota: {Number(article.score).toFixed(1)} • {article.categories?.name || "Sem categoria"}
                  </p>
                  {article.source_url && (
                    <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline truncate block">
                      Fonte: {article.source_url}
                    </a>
                  )}
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

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Notícia</DialogTitle>
          </DialogHeader>
          <ArticleForm
            data={newArticle}
            onChange={setNewArticle}
            onSave={() => handleCreate(false)}
            saveLabel="Salvar Rascunho"
            categories={categories}
            regions={regions}
            extraActions={
              <>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button variant="secondary" onClick={() => handleCreate(true)} disabled={creating}>
                  Publicar Agora
                </Button>
              </>
            }
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editArticle} onOpenChange={() => setEditArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Artigo</DialogTitle>
          </DialogHeader>
          {editArticle && (
            <ArticleForm
              data={editArticle}
              onChange={setEditArticle}
              onSave={handleSaveEdit}
              saveLabel="Salvar"
              categories={categories}
              regions={regions}
              extraActions={<Button variant="outline" onClick={() => setEditArticle(null)}>Cancelar</Button>}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArticlesPage;
