import { useState } from "react";
import { Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <section className="bg-primary text-primary-foreground py-12">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="h-8 w-8" />
          </div>
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
            Receba as principais notícias no seu e-mail
          </h2>
          <p className="text-primary-foreground/80 mb-6">
            Cadastre-se gratuitamente e receba diariamente um resumo com as notícias mais importantes de Santa Catarina.
          </p>

          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle className="h-6 w-6" />
              <span className="font-medium">Inscrição realizada com sucesso!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Seu melhor e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-primary-foreground text-foreground"
                required
              />
              <Button type="submit" variant="secondary" className="px-8">
                Inscrever-se
              </Button>
            </form>
          )}

          <p className="text-xs text-primary-foreground/60 mt-4">
            Ao se inscrever, você concorda com nossa{" "}
            <a href="/privacidade" className="underline hover:text-primary-foreground">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
