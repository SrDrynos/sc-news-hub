import { useState } from "react";
import { Mail, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: email.toLowerCase() } as any);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Você já está inscrito!", description: "Este e-mail já está na nossa lista." });
      } else {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    } else {
      setSubscribed(true);
    }
    setLoading(false);
  };

  return (
    <section className="bg-foreground text-background py-16">
      <div className="container">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-6">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3">
            Fique por dentro
          </h2>
          <p className="text-background/60 mb-8 text-sm">
            Receba as notícias mais importantes de Santa Catarina diretamente no seu e-mail.
          </p>

          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-emerald-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium text-sm">Inscrição realizada com sucesso!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Seu melhor e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-background/10 border-background/20 text-background placeholder:text-background/40 focus:border-secondary"
                required
              />
              <Button type="submit" className="bg-secondary hover:bg-secondary/90 text-white px-6" disabled={loading}>
                {loading ? "..." : <><span>Inscrever</span><ArrowRight className="h-4 w-4 ml-1" /></>}
              </Button>
            </form>
          )}

          <p className="text-xs text-background/30 mt-6">
            Ao se inscrever, você concorda com nossa{" "}
            <a href="/privacidade" className="underline hover:text-background/50">Política de Privacidade</a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
