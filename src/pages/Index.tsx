import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import AdminDashboard from "./AdminDashboard";
import AIAssistantTab from "./AIAssistantTab";
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
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [aiAssistantState, setAiAssistantState] = useState<{
    focusTopic?: string;
    errorRate?: number;
    initialMessage?: string;
  }>({});

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

  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
      // Se for ai-assistant e houver state, salvar
      if (tabParam === 'ai-assistant' && location.state) {
        const { focusTopic, errorRate, initialMessage } = location.state as any;
        if (focusTopic || errorRate !== undefined || initialMessage) {
          setAiAssistantState({ focusTopic, errorRate, initialMessage });
        }
      }
    }
  }, [location.search, location.state]);

  // Construir initialMessage a partir de focusTopic/errorRate ou usar diretamente
  const computedInitialMessage = useMemo(() => {
    if (aiAssistantState.initialMessage) {
      return aiAssistantState.initialMessage;
    }
    if (aiAssistantState.focusTopic && aiAssistantState.errorRate !== undefined) {
      return `Preciso estudar sobre "${aiAssistantState.focusTopic}". Tive ${aiAssistantState.errorRate.toFixed(0)}% de erro nesse tópico nos meus quizzes. Pode me explicar de forma clara esse conceito e dar exemplos práticos para eu entender melhor?`;
    }
    return undefined;
  }, [aiAssistantState]);

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
      case "ai-assistant":
        return <AIAssistantTab initialMessage={computedInitialMessage} />;
      case "achievements":
        return <Achievements />;
      case "profile":
        return <Profile />;
      case "admin":
        return <AdminDashboard />;
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
          <div className="mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl">
              Study Sync
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg md:text-xl max-w-2xl mx-auto px-2">
              A plataforma completa para organizar seus estudos, colaborar com colegas e acompanhar seu progresso acadêmico.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground shadow-medium hover:shadow-glow transition-all"
                onClick={handleGetStarted}
              >
                <GraduationCap className="mr-2 h-5 w-5" />
                {user ? "Ir para Minhas Turmas" : "Começar Agora"}
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Saiba Mais
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-background/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              Tudo que você precisa para estudar melhor
            </h2>
            <p className="mt-3 text-base text-muted-foreground max-w-xl mx-auto px-2">
              Ferramentas integradas para organizar, colaborar e evoluir nos seus estudos
            </p>
          </div>
          
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 px-2">
            <Card className="group border-l-4 border-primary">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-primary p-2 rounded-lg">
                    <Users className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg">Turmas Colaborativas</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm">
                  Crie e participe de turmas, compartilhe materiais e colabore com seus colegas em tempo real.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group border-l-4 border-success">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-success p-2 rounded-lg">
                    <BookOpen className="h-5 w-5 text-success-foreground" />
                  </div>
                  <CardTitle className="text-lg">Materiais Organizados</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm">
                  Organize todos os seus materiais de estudo em um só lugar, com fácil acesso e compartilhamento.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group border-l-4 border-streak">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-streak p-2 rounded-lg">
                    <CalendarIcon className="h-5 w-5 text-streak-foreground" />
                  </div>
                  <CardTitle className="text-lg">Agenda Inteligente</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm">
                  Acompanhe prazos, provas e atividades com nossa agenda inteligente que sincroniza todas as turmas.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group border-l-4 border-xp">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-xp p-2 rounded-lg">
                    <Target className="h-5 w-5 text-xp-foreground" />
                  </div>
                  <CardTitle className="text-lg">Metas e Progresso</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm">
                  Defina metas de estudo e acompanhe seu progresso com métricas detalhadas e insights personalizados.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group border-l-4 border-primary">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-primary p-2 rounded-lg">
                    <Trophy className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg">Sistema de Conquistas</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm">
                  Ganhe pontos e conquistas enquanto estuda, mantendo a motivação alta com nosso sistema gamificado.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group border-l-4 border-accent">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg">
                    <Zap className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg">Notificações Inteligentes</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm">
                  Receba lembretes personalizados sobre prazos, novas atividades e atualizações importantes das turmas.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl mb-12">
              Resultados que inspiram
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 px-2">
            <Card className="p-6 text-center shadow-soft border-l-4 border-success">
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">98%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Satisfação dos usuários</div>
            </Card>
            <Card className="p-6 text-center shadow-soft border-l-4 border-primary">
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">25k+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Estudantes ativos</div>
            </Card>
            <Card className="p-6 text-center shadow-soft border-l-4 border-accent">
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">1.5M+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Materiais compartilhados</div>
            </Card>
            <Card className="p-6 text-center shadow-soft border-l-4 border-xp">
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Instituições parceiras</div>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-primary py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl">
            Pronto para revolucionar seus estudos?
          </h2>
          <p className="mt-3 text-base text-primary-foreground/90 max-w-xl mx-auto px-2">
            Junte-se a milhares de estudantes que já transformaram sua forma de estudar
          </p>
          <div className="mt-6">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={handleGetStarted}
              className="w-full sm:w-auto"
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