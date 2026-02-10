import { ExternalLink } from "lucide-react";

interface ArticleSourceProps {
  sourceName: string | null;
  sourceUrl: string | null;
}

const ArticleSource = ({ sourceName, sourceUrl }: ArticleSourceProps) => {
  if (!sourceName) return null;

  return (
    <div className="bg-muted/60 rounded-lg p-5 text-sm text-muted-foreground border border-border">
      <p>
        Fonte:{" "}
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-secondary hover:underline font-medium inline-flex items-center gap-1"
          >
            {sourceName} <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="font-medium text-foreground">{sourceName}</span>
        )}
      </p>
    </div>
  );
};

export default ArticleSource;
