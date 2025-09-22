import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bug, Send } from "lucide-react";
import { toast } from "sonner";

interface ReportErrorButtonProps {
  area?: string;
  className?: string;
}

export const ReportErrorButton = ({ area = "Geral", className = "" }: ReportErrorButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [errorDescription, setErrorDescription] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate error report submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would send this to your error reporting service
      console.log("Error Report:", {
        area,
        description: errorDescription,
        email: userEmail,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });

      toast.success("Erro reportado com sucesso! Obrigado pelo feedback.");
      setIsOpen(false);
      setErrorDescription("");
      setUserEmail("");
    } catch (error) {
      toast.error("Erro ao enviar report. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`text-muted-foreground hover:text-foreground ${className}`}
        >
          <Bug className="w-4 h-4 mr-2" />
          Reportar Erro
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-destructive" />
            Reportar Erro
          </DialogTitle>
          <DialogDescription>
            Encontrou um problema na área "{area}"? Nos ajude a melhorar relatando o erro.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Seu Email (opcional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição do Erro *</Label>
            <Textarea
              id="description"
              placeholder="Descreva o que aconteceu, o que você esperava que acontecesse, e quais passos levaram ao erro..."
              value={errorDescription}
              onChange={(e) => setErrorDescription(e.target.value)}
              required
              rows={4}
            />
          </div>
          
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Informações Técnicas</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Área:</strong> {area}</p>
                <p><strong>URL:</strong> {window.location.href}</p>
                <p><strong>Navegador:</strong> {navigator.userAgent.split(' ').slice(-2).join(' ')}</p>
                <p><strong>Data:</strong> {new Date().toLocaleString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !errorDescription.trim()}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Report
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportErrorButton;