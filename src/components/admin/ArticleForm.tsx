import { useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";
import AuditPanel from "./AuditPanel";
import CityAutocomplete from "./CityAutocomplete";
import { Badge } from "@/components/ui/badge";

interface ArticleFormProps {
  data: any;
  onChange: (d: any) => void;
  onSave: () => void;
  saveLabel: string;
  extraActions?: React.ReactNode;
  categories: any[];
}

function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countChars(text: string): number {
  if (!text) return 0;
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
}

const ArticleForm = ({ data, onChange, onSave, saveLabel, extraActions, categories }: ArticleFormProps) => {
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const wordCount = useMemo(() => countChars(data.content || ""), [data.content]);
  const excerptWords = useMemo(() => countWords(data.excerpt || ""), [data.excerpt]);
  const metaLen = (data.meta_description || "").length;
  const tags: string[] = data.tags || [];

  const excerptCountColor = excerptWords > 50 ? "text-red-600" : excerptWords >= 10 ? "text-green-600" : "text-amber-600";
  const metaColor = metaLen === 0 ? "text-muted-foreground" : metaLen < 150 ? "text-amber-600" : metaLen > 160 ? "text-red-600" : "text-green-600";

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || tags.length >= 7 || tags.includes(t)) return;
    onChange({ ...data, tags: [...tags, t] });
    setTagInput("");
  };

  const removeTag = (idx: number) => {
    onChange({ ...data, tags: tags.filter((_, i) => i !== idx) });
  };

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

      {/* Subtítulo */}
      <div>
        <Label>Subtítulo <span className="text-muted-foreground text-xs">(aparece abaixo do título na página)</span></Label>
        <Input placeholder="Subtítulo descritivo da notícia" value={data.subtitle || ""} onChange={(e) => onChange({ ...data, subtitle: e.target.value })} />
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

      {/* Resumo informativo */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>Subtítulo * <span className="text-muted-foreground text-xs">(máx. 50 palavras)</span></Label>
          <span className={`text-xs font-medium ${excerptCountColor}`}>
            {excerptWords} palavras {excerptWords > 50 ? "(máx. 50)" : excerptWords < 10 ? "(mín. 10)" : "✓"}
          </span>
        </div>
        <Textarea placeholder="Resumo objetivo e jornalístico da notícia (máx. 50 palavras)" value={data.excerpt || ""} onChange={(e) => onChange({ ...data, excerpt: e.target.value })} rows={3} />
      </div>

      {/* Corpo do artigo */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>Corpo do artigo * <span className="text-muted-foreground text-xs">(mín. 500 caracteres)</span></Label>
          <span className={`text-xs font-medium ${wordCount < 500 ? "text-red-600" : "text-green-600"}`}>{wordCount} caracteres {wordCount < 500 ? "(mín. 500)" : "✓"}</span>
        </div>
        <Textarea
          placeholder="Texto completo do artigo (mínimo 500 caracteres)"
          value={data.content || ""}
          onChange={(e) => onChange({ ...data, content: e.target.value })}
          rows={8}
        />
      </div>

      {/* Imagem Upload */}
      <div>
        <Label>Imagem da notícia *</Label>
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <Input placeholder="URL da imagem (ou faça upload)" value={data.image_url || ""} onChange={(e) => onChange({ ...data, image_url: e.target.value })} />
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
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

      {/* Categoria */}
      <div>
        <Label>Categoria da notícia * <span className="text-destructive text-xs">obrigatório</span></Label>
        <Select value={data.category_id || ""} onValueChange={(v) => onChange({ ...data, category_id: v })}>
          <SelectTrigger className={!data.category_id ? "border-destructive" : ""}><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
          <SelectContent>
            {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
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

      {/* Cidade */}
      <div>
        <Label>Cidade * <span className="text-destructive text-xs">obrigatório</span> <span className="text-muted-foreground text-xs">(onde a notícia aconteceu)</span></Label>
        <CityAutocomplete value={data.city || ""} onChange={(v) => onChange({ ...data, city: v })} className={!data.city ? "border-destructive" : ""} />
      </div>

      {/* Tags / Keywords SEO */}
      <div>
        <Label>Tags/Keywords * <span className="text-destructive text-xs">obrigatório</span> <span className={`text-xs ${tags.length === 7 ? "text-green-600" : "text-amber-600"}`}>({tags.length}/7)</span></Label>
        <div className="flex gap-2">
          <Input
            placeholder="Digite uma keyword e pressione Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            disabled={tags.length >= 7}
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={tags.length >= 7 || !tagInput.trim()} className="shrink-0">
            Adicionar
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {tag}
                <button type="button" onClick={() => removeTag(i)} className="ml-0.5 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">
          Exatamente 7 keywords relevantes para SEO. Inclua cidade(s) e termos estratégicos.
        </p>
      </div>

      {/* Auditoria Editorial */}
      <AuditPanel article={data} />

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {extraActions}
        <Button onClick={onSave}>{saveLabel}</Button>
      </div>
    </div>
  );
};

export default ArticleForm;