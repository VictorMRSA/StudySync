import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { User } from "@supabase/supabase-js";
import Dashboard from "./Dashboard";
import Classes from "./Classes";
import Calendar from "./Calendar";
import Materials from "./Materials";
import Achievements from "./Achievements";
import Profile from "./Profile";
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Calendar as CalendarIcon, 
  Trophy,
  Target,
  Zap,
  Star
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (user) {
      // Redirect to classes page if user is logged in
      window.location.href = "/classes";
    } else {
      // Redirect to auth page if not logged in
      navigate("/auth");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onTabChange={setActiveTab} />;
      case "classes":
        return <Classes />;
      case "calendar":
        return <Calendar />;
      case "materials":
        return <Materials />;
      case "achievements":
        return <Achievements />;
      case "profile":
        return <Profile />;
      default:
        return <Dashboard onTabChange={setActiveTab} />;
    }
  };

  // If user is logged in, show the app interface
  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Main content with proper spacing for navigation */}
        <div className="lg:ml-64 pt-16 lg:pt-0 pb-16 lg:pb-0">
          {renderContent()}
        </div>
      </div>
    );
  }

  // If user is not logged in, show landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-6xl lg:text-7xl">
              Study Sync
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl lg:text-2xl max-w-3xl mx-auto">
              A plataforma completa para organizar seus estudos, colaborar com colegas e acompanhar seu progresso acadêmico de forma inteligente.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground shadow-medium hover:shadow-glow transition-all"
                onClick={handleGetStarted}
              >
                <GraduationCap className="mr-2 h-5 w-5" />
                {user ? "Ir para Minhas Turmas" : "Começar Agora"}
              </Button>
              <Button variant="outline" size="lg">
                Saiba Mais
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              Tudo que você precisa para estudar melhor
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Ferramentas integradas para organizar, colaborar e evoluir nos seus estudos
            </p>
          </div>
          
          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-primary p-2 rounded-lg">
                    <Users className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle>Turmas Colaborativas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Crie e participe de turmas, compartilhe materiais e colabore com seus colegas em tempo real.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-success p-2 rounded-lg">
                    <BookOpen className="h-6 w-6 text-success-foreground" />
                  </div>
                  <CardTitle>Materiais Organizados</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Organize todos os seus materiais de estudo em um só lugar, com fácil acesso e compartilhamento.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-streak p-2 rounded-lg">
                    <CalendarIcon className="h-6 w-6 text-streak-foreground" />
                  </div>
                  <CardTitle>Agenda Inteligente</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Acompanhe prazos, provas e atividades com nossa agenda inteligente que sincroniza todas as turmas.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-xp p-2 rounded-lg">
                    <Target className="h-6 w-6 text-xp-foreground" />
                  </div>
                  <CardTitle>Metas e Progresso</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Defina metas de estudo e acompanhe seu progresso com métricas detalhadas e insights personalizados.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-gamified p-2 rounded-lg">
                    <Trophy className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle>Sistema de Conquistas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Ganhe pontos e conquistas enquanto estuda, mantendo a motivação alta com nosso sistema gamificado.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg">
                    <Zap className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle>Notificações Inteligentes</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Receba lembretes personalizados sobre prazos, novas atividades e atualizações importantes das turmas.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl mb-16">
              Resultados que inspiram
            </h2>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <div className="text-muted-foreground">Satisfação dos usuários</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">25k+</div>
              <div className="text-muted-foreground">Estudantes ativos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">1.5M+</div>
              <div className="text-muted-foreground">Materiais compartilhados</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Instituições parceiras</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Pronto para revolucionar seus estudos?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Junte-se a milhares de estudantes que já transformaram sua forma de estudar
          </p>
          <div className="mt-8">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={handleGetStarted}
            >
              <Star className="mr-2 h-5 w-5" />
              Começar Gratuitamente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;