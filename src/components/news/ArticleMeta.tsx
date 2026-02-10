import { Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ArticleMetaProps {
  publishedAt: string | null;
  readingTime: number;
  categoryName: string;
  categorySlug: string;
}

const ArticleMeta = ({ publishedAt, readingTime, categoryName, categorySlug }: ArticleMetaProps) => {
  const formatDate = (date: string) => {
    const d = new Date(date);
    const dayOfWeek = format(d, "EEEE", { locale: ptBR });
    const capitalized = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    const rest = format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    return `${capitalized}, ${rest}`;
  };

  const formatTime = (date: string) => {
    return format(new Date(date), "HH:mm", { locale: ptBR });
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground border-y border-border py-4 mb-6">
      <span className="flex items-center gap-1.5 font-semibold text-foreground">
        <User className="h-4 w-4 text-secondary" />
        Redação Melhor News
      </span>
      <span className="text-border">•</span>
      {publishedAt && (
        <>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(publishedAt)}
          </span>
          <span className="text-border">•</span>
          <span>{formatTime(publishedAt)}</span>
          <span className="text-border">•</span>
        </>
      )}
      <span className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        {readingTime} min de leitura
      </span>
    </div>
  );
};

export default ArticleMeta;
