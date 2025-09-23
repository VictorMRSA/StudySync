import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bug, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ReportErrorButtonProps {
  area?: string;
  className?: string;
}

export const ReportErrorButton = ({ area = "Geral", className = "" }: ReportErrorButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [errorDescription, setErrorDescription] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Auto-fill user email and check authentication when component loads
  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Auth error:', error);
          setIsAuthenticated(false);
          return;
        }
        
        if (user?.email && user?.id) {
          setUserEmail(user.email);
          setUserId(user.id);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
        setIsAuthenticated(false);
      }
    };
    
    getUserData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);

    try {
      // Re-verify authentication before submitting
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user?.id) {
        toast.error("Sessão expirada. Faça login novamente.");
        setIsAuthenticated(false);
        return;
      }
      // Update state with current authenticated user
      setUserId(user.id);
      setUserEmail(user.email ?? '');
      setIsAuthenticated(true);

      // Collect technical details
      const technicalDetails = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };

      // Save to database with proper user validation
      const { error } = await supabase
        .from('error_reports')
        .insert({
          user_id: user.id,
          user_email: (user.email || '').trim().toLowerCase(),
          area,
          description: errorDescription,
          technical_details: technicalDetails,
          status: 'novo'
        });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      toast.success("Erro reportado com sucesso! Obrigado pelo feedback.");
      setIsOpen(false);
      setErrorDescription("");
    } catch (error: any) {
      console.error('Error sending report:', error);
      const msg = typeof error?.message === 'string' ? error.message : JSON.stringify(error);
      if (msg?.includes('row-level security') || msg?.includes('JWT') || msg?.includes('auth')) {
        toast.error("Erro de autenticação. Faça login novamente.");
      } else {
        toast.error(`Erro ao enviar report: ${msg}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  // Show login required message if user is not authenticated
  if (!isAuthenticated) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`text-muted-foreground hover:text-foreground text-xs sm:text-sm ${className}`}
        >
          <Bug className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Reportar Erro</span>
          <span className="xs:hidden">Erro</span>
          </Button>
        </DialogTrigger>
        
        <DialogContent className="w-[95vw] max-w-sm mx-2 sm:max-w-md sm:mx-4 lg:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-destructive" />
              Login Necessário
            </DialogTitle>
            <DialogDescription>
              Você precisa estar logado para reportar erros. Isso garante a segurança e autenticidade dos reports.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Fechar
            </Button>
            <Button onClick={() => window.location.href = '/auth'}>
              Fazer Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`text-muted-foreground hover:text-foreground text-xs sm:text-sm ${className}`}
        >
          <Bug className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Reportar Erro</span>
          <span className="xs:hidden">Erro</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-[95vw] max-w-sm mx-2 sm:max-w-md sm:mx-4 lg:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-destructive" />
            Reportar Erro
          </DialogTitle>
          <DialogDescription>
            Encontrou um problema na área "{area}"? Nos ajude a melhorar relatando o erro.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Seu Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={userEmail}
              disabled={true}
              className="bg-muted"
              required
            />
            <p className="text-xs text-muted-foreground">
              Email do usuário autenticado (não pode ser alterado)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição do Erro *</Label>
            <Textarea
              id="description"
              placeholder="Descreva o que aconteceu, o que você esperava que acontecesse, e quais passos levaram ao erro..."
              value={errorDescription}
              onChange={(e) => setErrorDescription(e.target.value)}
              required
              rows={3}
              className="min-h-[80px] sm:min-h-[100px] text-sm"
            />
          </div>
          
          <Card className="bg-muted/50">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm">Informações Técnicas</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Área:</strong> {area}</p>
                <p className="break-all"><strong>URL:</strong> {window.location.href}</p>
                <p className="break-words"><strong>Navegador:</strong> {navigator.userAgent.split(' ').slice(-2).join(' ')}</p>
                <p><strong>Data:</strong> {new Date().toLocaleString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !errorDescription.trim()} className="w-full sm:w-auto">
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