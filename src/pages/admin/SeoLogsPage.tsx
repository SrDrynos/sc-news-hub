import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Trash2, RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type SeoLog = {
  id: string;
  type: string;
  action: string;
  url: string | null;
  message: string;
  technical: string | null;
  created_at: string;
};

const typeColors: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-800",
  ERROR: "bg-red-100 text-red-800",
  WARNING: "bg-amber-100 text-amber-800",
};

const typeIcons: Record<string, typeof CheckCircle> = {
  SUCCESS: CheckCircle,
  ERROR: XCircle,
  WARNING: AlertTriangle,
};

const SeoLogsPage = () => {
  const [filterType, setFilterType] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["seo-logs", filterType, filterAction],
    queryFn: async () => {
      let query = supabase
        .from("seo_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filterType !== "all") {
        query = query.eq("type", filterType);
      }
      if (filterAction !== "all") {
        query = query.eq("action", filterAction);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as SeoLog[];
    },
  });

  const clearLogs = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("seo_logs" as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-logs"] });
      toast({ title: "Logs limpos com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao limpar logs", variant: "destructive" });
    },
  });

  const successCount = logs.filter((l) => l.type === "SUCCESS").length;
  const errorCount = logs.filter((l) => l.type === "ERROR").length;
  const warningCount = logs.filter((l) => l.type === "WARNING").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Logs SEO</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitoramento de indexação Google, sitemap e validações
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => clearLogs.mutate()}>
            <Trash2 className="h-4 w-4 mr-1" /> Limpar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{successCount}</p>
              <p className="text-xs text-muted-foreground">Sucessos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{errorCount}</p>
              <p className="text-xs text-muted-foreground">Erros</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{warningCount}</p>
              <p className="text-xs text-muted-foreground">Avisos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="SUCCESS">Sucesso</SelectItem>
            <SelectItem value="ERROR">Erro</SelectItem>
            <SelectItem value="WARNING">Aviso</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            <SelectItem value="INDEXING_API">Indexação Google</SelectItem>
            <SelectItem value="BATCH">Batch Indexing</SelectItem>
            <SelectItem value="SITEMAP">Sitemap</SelectItem>
            <SelectItem value="VALIDATION">Validação</SelectItem>
            <SelectItem value="PING">Ping</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Registros ({logs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum log encontrado.</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.map((log) => {
                const Icon = typeIcons[log.type] || AlertTriangle;
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${
                      log.type === "SUCCESS" ? "text-green-500" :
                      log.type === "ERROR" ? "text-red-500" : "text-amber-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={typeColors[log.type]}>
                          {log.type}
                        </Badge>
                        <Badge variant="secondary">{log.action}</Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(log.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{log.message}</p>
                      {log.url && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          URL: {log.url}
                        </p>
                      )}
                      {log.technical && (
                        <details className="mt-1">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            Detalhes técnicos
                          </summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap">
                            {log.technical}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SeoLogsPage;
