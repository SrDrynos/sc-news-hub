import { useMemo } from "react";
import { auditArticle, type AuditError } from "@/lib/editorialAudit";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface AuditPanelProps {
  article: {
    title?: string;
    excerpt?: string;
    content?: string;
    image_url?: string;
    image_caption?: string;
    source_url?: string;
    source_name?: string;
    category_id?: string;
    city?: string;
  };
}

const RULE_LABELS: Record<number, string> = {
  1: "Sem caracteres corrompidos",
  2: 'Sigla "SC" por extenso',
  3: "Campos obrigatórios preenchidos",
  4: "Subtítulo até 300 palavras",
  5: "Corpo com mín. 300 palavras",
  6: "Categoria selecionada",
  7: "Cidade informada",
};

const ALL_RULES = [1, 2, 3, 4, 5, 6, 7];

const AuditPanel = ({ article }: AuditPanelProps) => {
  const result = useMemo(() => auditArticle(article), [article]);

  const errorsByRule = useMemo(() => {
    const map = new Map<number, AuditError[]>();
    for (const err of result.errors) {
      if (!map.has(err.rule)) map.set(err.rule, []);
      map.get(err.rule)!.push(err);
    }
    return map;
  }, [result.errors]);

  const passedCount = ALL_RULES.filter((r) => !errorsByRule.has(r)).length;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {result.approved ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
          Auditoria Editorial
        </h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          result.approved
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        }`}>
          {passedCount}/{ALL_RULES.length} regras
        </span>
      </div>

      <ul className="space-y-1.5">
        {ALL_RULES.map((rule) => {
          const errors = errorsByRule.get(rule);
          const passed = !errors;

          return (
            <li key={rule} className="text-xs flex items-start gap-2">
              {passed ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
              )}
              <div>
                <span className={passed ? "text-muted-foreground" : "text-foreground font-medium"}>
                  {RULE_LABELS[rule]}
                </span>
                {errors && (
                  <ul className="mt-0.5 space-y-0.5">
                    {errors.map((e, i) => (
                      <li key={i} className="text-destructive/80">{e.message}</li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AuditPanel;
