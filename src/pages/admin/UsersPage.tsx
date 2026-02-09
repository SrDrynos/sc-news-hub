import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface UserWithRole {
  user_id: string;
  display_name: string | null;
  roles: string[];
}

const UsersPage = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<string>("editor");

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");

    if (profiles) {
      const userMap: Record<string, UserWithRole> = {};
      for (const p of profiles) {
        userMap[p.user_id] = { user_id: p.user_id, display_name: p.display_name, roles: [] };
      }
      if (roles) {
        for (const r of roles) {
          if (userMap[r.user_id]) {
            userMap[r.user_id].roles.push(r.role);
          }
        }
      }
      setUsers(Object.values(userMap).filter((u) => u.roles.length > 0));
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddRole = async (userId: string, role: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role adicionada!" });
      fetchUsers();
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role removida" });
      fetchUsers();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-heading font-bold">Usuários</h1>
      </div>

      <p className="text-muted-foreground mb-6 text-sm">
        Para adicionar um novo membro da equipe: o usuário deve primeiro se cadastrar em /auth, 
        depois você pode atribuir a role aqui usando o ID de usuário.
      </p>

      {loading ? (
        <p>Carregando...</p>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum usuário com roles encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.user_id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <p className="font-medium">{user.display_name || "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground">{user.user_id}</p>
                </div>
                <div className="flex gap-2">
                  {user.roles.map((role) => (
                    <span key={role} className="flex items-center gap-1 text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                      {role}
                      <button onClick={() => handleRemoveRole(user.user_id, role)} className="hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <Select onValueChange={(v) => handleAddRole(user.user_id, v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="+ Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {["admin", "editor", "moderator"]
                      .filter((r) => !user.roles.includes(r))
                      .map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersPage;
