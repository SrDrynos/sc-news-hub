import { useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon } from "lucide-react";

interface ArticleFormProps {
  data: any;
  onChange: (d: any) => void;
  onSave: () => void;
  saveLabel: string;
  extraActions?: React.ReactNode;
  categories: any[];
  regions: any[];
}

function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const ArticleForm = ({ data, onChange, onSave, saveLabel, extraActions, categories, regions }: ArticleFormProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const wordCount = useMemo(() => countWords(data.content || ""), [data.content]);
  const excerptWords = useMemo(() => countWords(data.excerpt || ""), [data.excerpt]);
  const metaLen = (data.meta_description || "").length;

  const wordCountColor = wordCount < 150 ? "text-red-600" : wordCount > 300 ? "text-red-600" : "text-green-600";
  const excerptCountColor = excerptWords > 100 ? "text-red-600" : "text-green-600";
  const metaColor = metaLen === 0 ? "text-muted-foreground" : metaLen < 150 ? "text-amber-600" : metaLen > 160 ? "text-red-600" : "text-green-600";

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Selecione um arquivo de imagem", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("article-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("article-images")
        .getPublicUrl(filePath);

      onChange({ ...data, image_url: urlData.publicUrl });
      toast({ title: "Imagem enviada com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar imagem", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Título */}
      <div>
        <Label>Título * <span className="text-muted-foreground text-xs">(SEO: claro e objetivo)</span></Label>
        <Input placeholder="Título otimizado para SEO" value={data.title} onChange={(e) => onChange({ ...data, title: e.target.value })} />
      </div>

      {/* Meta Description */}
      <div>
        <Label>Meta Description <span className={`text-xs ${metaColor}`}>({metaLen}/160)</span></Label>
        <Textarea
          placeholder="Resumo de 150-160 caracteres para SEO e Google..."
          value={data.meta_description || ""}
          onChange={(e) => onChange({ ...data, meta_description: e.target.value })}
          rows={2}
          maxLength={200}
        />
      </div>

      {/* Subtítulo */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>Subtítulo (linha fina) *</Label>
          <span className={`text-xs font-medium ${excerptCountColor}`}>
            {excerptWords} palavras {excerptWords > 100 ? "(máx. 100)" : "✓"}
          </span>
        </div>
        <Textarea placeholder="Resumo explicativo da notícia (não repita o título)" value={data.excerpt || ""} onChange={(e) => onChange({ ...data, excerpt: e.target.value })} rows={2} />
      </div>

      {/* Conteúdo */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>Conteúdo *</Label>
          <span className={`text-xs font-medium ${wordCountColor}`}>
            {wordCount} palavras {wordCount < 150 ? "(mín. 150)" : wordCount > 300 ? "(máx. 300)" : "✓"}
          </span>
        </div>
        <Textarea
          placeholder={"Corpo da notícia em parágrafos...\n\nUse <h2> e <h3> para subtítulos, <p> para parágrafos."}
          value={data.content || ""}
          onChange={(e) => onChange({ ...data, content: e.target.value })}
          rows={14}
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Dica: Use tags HTML — &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt; — para estruturar o texto.
        </p>
      </div>

      {/* Imagem Upload */}
      <div>
        <Label>Imagem da notícia *</Label>
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <Input placeholder="URL da imagem (ou faça upload)" value={data.image_url || ""} onChange={(e) => onChange({ ...data, image_url: e.target.value })} />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-1 shrink-0">
            <Upload className="h-4 w-4" />
            {uploading ? "Enviando..." : "Upload"}
          </Button>
        </div>
        {data.image_url && (
          <div className="mt-2 relative">
            <img src={data.image_url} alt="Preview" className="w-full max-h-48 object-cover rounded border bg-muted" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        )}
      </div>

      {/* Legenda da imagem */}
      <div>
        <Label>Legenda da imagem <span className="text-muted-foreground text-xs">(crédito obrigatório)</span></Label>
        <Input placeholder="Ex: Foto: Divulgação / NSC Total" value={data.image_caption || ""} onChange={(e) => onChange({ ...data, image_caption: e.target.value })} />
      </div>

      {/* Categoria e Região */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Cidade (origem da notícia) * <span className="text-destructive text-xs">obrigatório</span></Label>
          <Select value={data.region_id || ""} onValueChange={(v) => onChange({ ...data, region_id: v })}>
            <SelectTrigger className={!data.region_id ? "border-destructive" : ""}><SelectValue placeholder="Selecione a cidade" /></SelectTrigger>
            <SelectContent>
              {regions.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Categoria * <span className="text-muted-foreground text-xs">(após cidade)</span></Label>
          <Select value={data.category_id || ""} onValueChange={(v) => onChange({ ...data, category_id: v })}>
            <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
            <SelectContent>
              {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Autor e Fonte */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Autor</Label>
          <Input placeholder="Redação Melhor News" value={data.author || ""} onChange={(e) => onChange({ ...data, author: e.target.value })} />
        </div>
        <div>
          <Label>Nome da fonte</Label>
          <Input placeholder="Ex: NSC Total" value={data.source_name || ""} onChange={(e) => onChange({ ...data, source_name: e.target.value })} />
        </div>
      </div>

      {/* URL da fonte */}
      <div>
        <Label>URL da fonte original</Label>
        <Input placeholder="https://..." value={data.source_url || ""} onChange={(e) => onChange({ ...data, source_url: e.target.value })} />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {extraActions}
        <Button onClick={onSave}>{saveLabel}</Button>
      </div>
    </div>
  );
};

export default ArticleForm;
