import { useCategories } from "@/hooks/useArticles";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen } from "lucide-react";

const FIXED_CATEGORIES = [
  "Crime",
  "Economia",
  "Política",
  "Internacional",
  "Saúde",
  "Ciência",
  "Esportes",
  "Entretenimento",
  "Cultura",
  "Lifestyle",
];

const CategoriesPage = () => {
  const { data: categories = [] } = useCategories();

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold mb-2">Categorias</h1>
      <p className="text-sm text-muted-foreground mb-6">
        As categorias mais pesquisadas no portal.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {FIXED_CATEGORIES.map((name) => {
          const dbCat = (categories as any[]).find(
            (c) => c.name.toLowerCase() === name.toLowerCase()
          );
          return (
            <Card key={name} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-sm">{name}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CategoriesPage;
