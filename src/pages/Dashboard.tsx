// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast, toast } from "@/hooks/use-toast";
import { 
  Flame, 
  Sparkles, 
  Target, 
  Clock, 
  List, 
  Users, 
  Upload, 
  Calendar, 
  Trophy, 
  CalendarDays, 
  ArrowUpRight, 
  MoreHorizontal, 
  Check, 
  Trash2, 
  FileText, 
  AlertCircle, 
  BookOpen 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import ReportErrorButton from "@/components/ReportErrorButton";

interface DashboardProps {
  onTabChange?: (tab: string) => void;
}

interface Goal {
  id: string;
  title: string;
  completed: boolean;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const Dashboard = ({ onTabChange }: DashboardProps) => {
  useToast();
  const navigate = useNavigate();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchProfile();
      fetchDeadlines();
      fetchRecentActivity();
      fetchRecommendations();
    }
  }, [user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
    }
    setLoading(false);
  };

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data: goalsData, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals(goalsData || []);
    } catch (error: any) {
      console.error("Error fetching goals:", error);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(profileData);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchDeadlines = async () => {
    if (!user) return;
    
    try {
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select('*, classes(name)')
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(5);

      if (error) throw error;

      const deadlines = assignments?.map(a => {
        const daysLeft = Math.ceil((new Date(a.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return {
          subject: a.classes?.name || 'Sem turma',
          task: a.title,
          daysLeft: daysLeft,
          urgent: daysLeft <= 3,
          id: a.id
        };
      }) || [];

      setUpcomingDeadlines(deadlines);
    } catch (error) {
      console.error('Error fetching deadlines:', error);
    }
  };

  const fetchRecentActivity = async () => {
    if (!user) return;
    
    try {
      const { data: activities, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const activityList = activities?.map(a => {
        const timeAgo = formatTimeAgo(new Date(a.created_at));
        const metadata = a.metadata as { subject?: string } | null;
        return {
          action: a.description,
          subject: metadata?.subject || '',
          points: a.points_earned > 0 ? `+${a.points_earned} XP` : '',
          time: timeAgo
        };
      }) || [];

      setRecentActivity(activityList);
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Agora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min atrás`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} dia${Math.floor(seconds / 86400) > 1 ? 's' : ''} atrás`;
    return date.toLocaleDateString();
  };

  const fetchRecommendations = async () => {
    if (!user) return;
    
    try {
      const recs: any[] = [];

      // 1. Buscar top erros em quizzes
      const { data: wrongAnswers } = await supabase
        .from('quiz_question_results')
        .select(`
          question_text,
          quiz_sessions!inner(user_id)
        `)
        .eq('quiz_sessions.user_id', user.id)
        .eq('is_correct', false)
        .limit(3);

      if (wrongAnswers && wrongAnswers.length > 0) {
        wrongAnswers.forEach((answer, index) => {
          if (index < 2) {
            recs.push({
              category: 'REVISAR DIFICULDADE',
              icon: FileText,
              title: 'Revisar dificuldade',
              description: answer.question_text,
              action: 'Estudar com IA',
              link: 'ai-assistant',
              prompt: `Gostaria de ajuda para entender a seguinte questão que errei no quiz: "${answer.question_text}". Pode me explicar os conceitos envolvidos de forma clara?`,
              priority: 1
            });
          }
        });
      }

      // 2. Buscar materiais da turma
      const { data: classMemberships } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('user_id', user.id);

      if (classMemberships && classMemberships.length > 0) {
        const classIds = classMemberships.map(m => m.class_id);
        
        const { data: materials } = await supabase
          .from('materials')
          .select('id, title, class_id')
          .in('class_id', classIds)
          .eq('status', 'approved')
          .limit(2);

        if (materials && materials.length > 0) {
          materials.forEach((material) => {
            recs.push({
              category: 'MATERIAL DISPONÍVEL',
              icon: BookOpen,
              title: 'Material disponível',
              description: material.title,
              action: 'Ver material',
              link: 'materials',
              materialId: material.id,
              priority: 2
            });
          });
        }
      }

      // Se ainda não tiver 3 recomendações reais, preencher com guias práticos do StudySync
      if (recs.length === 0) {
        recs.push({
          category: 'REVISAR DIFICULDADE',
          icon: FileText,
          title: 'Revisar dificuldade',
          description: 'Qual foi a principal função do Projeto Integrador segundo o plano de ensino?',
          action: 'Estudar com IA',
          link: 'ai-assistant',
          prompt: 'Pode me ajudar a revisar o conceito do Projeto Integrador segundo as diretrizes acadêmicas?',
          priority: 1
        });
        recs.push({
          category: 'REVISAR DIFICULDADE',
          icon: FileText,
          title: 'Revisar dificuldade',
          description: 'Que competência foi destacada como fortalecida pelo papel de pesquisa e extensão?',
          action: 'Estudar com IA',
          link: 'ai-assistant',
          prompt: 'Pode me explicar detalhadamente sobre as competências de pesquisa e extensão universitária?',
          priority: 2
        });
        recs.push({
          category: 'MATERIAL DISPONÍVEL',
          icon: BookOpen,
          title: 'Material disponível',
          description: 'Introdução aos Estudos e Métodos Ativos de Aprendizagem',
          action: 'Ver material',
          link: 'materials',
          priority: 3
        });
      }

      recs.sort((a, b) => a.priority - b.priority);
      setRecommendations(recs.slice(0, 3));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const removeGoal = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setGoals((prev) => prev.filter((g) => g.id !== id));
      toast({
        title: "Meta removida",
        description: "A meta foi removida com sucesso.",
      });
    } catch (error: any) {
      console.error("Error removing goal:", error);
      toast({
        title: "Erro ao remover meta",
        description: "Não foi possível remover a meta.",
        variant: "destructive"
      });
    }
  };

  const toggleGoalCompletion = async (id: string) => {
    if (!user) return;

    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    try {
      const { error } = await supabase
        .from("goals")
        .update({ completed: !goal.completed })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setGoals((prev) => 
        prev.map((g) => 
          g.id === id 
            ? { ...g, completed: !g.completed }
            : g
        )
      );
    } catch (error: any) {
      console.error("Error updating goal:", error);
    }
  };

  const handleRecClick = (rec: any) => {
    if (rec.link === 'ai-assistant') {
      if (rec.prompt) {
        navigate('/?tab=ai-assistant', {
          state: { initialMessage: rec.prompt, materialId: rec.materialId }
        });
      }
      onTabChange?.('ai-assistant');
    } else if (rec.link === 'materials') {
      onTabChange?.('materials');
    } else if (rec.link.startsWith('/')) {
      navigate(rec.link);
    } else {
      onTabChange?.(rec.link);
    }
  };

  const currentXP = profile?.experience_points ?? 1050;
  const currentLevel = profile?.current_level ?? 7;
  const nextLevelXP = profile?.next_level_xp ?? 1100;
  const streakDays = profile?.streak_days ?? 1;
  const progressPercentage = nextLevelXP > 0 ? (currentXP / nextLevelXP) * 100 : 70;

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date()).toUpperCase();

  const fallbackName = profile?.username || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || "testealunovictor";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground text-sm">
        Carregando...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header with uppercase date, greeting & Top-Right Stats Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1 select-none">
            {formattedDate}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <span>Olá, {fallbackName}</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Vamos continuar sua jornada de estudos.
          </p>
        </div>

        {/* Header Stats Badge */}
        <div className="flex items-center self-start sm:self-auto border border-border/60 rounded-xl bg-card shadow-none px-4 py-2.5 divide-x divide-border/60">
          <div className="flex items-center gap-2.5 pr-4">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500/20 shrink-0" />
            <div>
              <div className="text-base sm:text-lg font-bold leading-none text-foreground">
                {streakDays}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                {streakDays === 1 ? 'Dia de sequência' : 'Dias de sequência'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pl-4">
            <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
            <div>
              <div className="text-base sm:text-lg font-bold leading-none text-foreground">
                {currentXP} XP
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                Nível {currentLevel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Level Progress Section */}
      <Card className="p-4 sm:p-5 border border-border/60 rounded-xl shadow-none bg-card">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-xs sm:text-sm font-semibold text-foreground">
                Progresso para o próximo nível
              </span>
            </div>
            <span className="text-[11px] sm:text-xs text-muted-foreground font-medium border border-border/70 rounded-full px-2.5 py-0.5">
              {Math.max(0, nextLevelXP - currentXP)} XP restantes
            </span>
          </div>
          
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, progressPercentage))}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
            <span>Nível {currentLevel}</span>
            <span>Nível {currentLevel + 1}</span>
          </div>
        </div>
      </Card>

      {/* 3. "O que estudar agora?" Card */}
      <Card className="p-4 sm:p-5 border border-border/60 rounded-xl shadow-none bg-card">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-foreground">O que estudar agora?</h3>
          </div>
          <button
            onClick={() => onTabChange?.("materials")}
            className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 transition-colors"
          >
            <span>Ver tudo</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {recommendations.map((rec, index) => {
            const Icon = rec.icon || FileText;
            return (
              <div
                key={index}
                className="p-3 sm:p-3.5 rounded-xl border border-border/60 bg-card hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40 transition-colors flex items-center justify-between gap-3 sm:gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 block mb-0.5">
                      {rec.category || rec.title}
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate max-w-xl">
                      {rec.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 h-8 text-xs font-medium rounded-lg border-border/70 text-muted-foreground hover:text-foreground gap-1 px-3"
                  onClick={() => handleRecClick(rec)}
                >
                  <span>{rec.action}</span>
                  <span className="text-muted-foreground">&gt;</span>
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 4. Three-Column Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Metas de hoje */}
        <Card className="p-4 sm:p-5 border border-border/60 rounded-xl shadow-none bg-card flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Metas de hoje</h3>
              </div>
              <button
                onClick={() => setIsGoalModalOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                title="Adicionar meta"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="py-6 text-center">
                <div className="w-10 h-10 rounded-full border border-border/80 flex items-center justify-center mx-auto mb-2 text-muted-foreground/60">
                  <Target className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-foreground">Sem metas para hoje</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Adicione uma nova meta para começar</p>
              </div>
            ) : (
              <ScrollArea className="h-36 pr-2">
                <div className="space-y-2">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/40 border border-border/50 text-xs"
                    >
                      <button
                        onClick={() => toggleGoalCompletion(goal.id)}
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                          goal.completed
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-neutral-300 hover:border-neutral-400"
                        }`}
                      >
                        {goal.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </button>
                      <span
                        className={`flex-1 truncate ${
                          goal.completed ? "text-muted-foreground line-through" : "text-foreground font-medium"
                        }`}
                      >
                        {goal.title}
                      </span>
                      <button
                        onClick={() => removeGoal(goal.id)}
                        className="text-muted-foreground hover:text-destructive p-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </Card>

        {/* Card 2: Próximos prazos (amber accent top border) */}
        <Card className="p-4 sm:p-5 border border-border/60 border-t-2 border-t-amber-500 rounded-xl shadow-none bg-card flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Próximos prazos</h3>
              </div>
              <button
                onClick={() => onTabChange?.("calendar")}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                title="Ver calendário"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <div className="py-6 text-center">
                <div className="w-10 h-10 rounded-full border border-border/80 flex items-center justify-center mx-auto mb-2 text-muted-foreground/60">
                  <Clock className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-foreground">Nenhum prazo próximo</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Você está em dia</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.slice(0, 3).map((deadline, index) => (
                  <div
                    key={index}
                    className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/40 border border-border/50 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{deadline.subject}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{deadline.task}</p>
                    </div>
                    <Badge
                      variant={deadline.urgent ? "destructive" : "secondary"}
                      className="text-[10px] px-1.5 py-0 h-5 shrink-0"
                    >
                      {deadline.daysLeft}d
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Card 3: Atividade recente (emerald accent top border) */}
        <Card className="p-4 sm:p-5 border border-border/60 border-t-2 border-t-emerald-500 rounded-xl shadow-none bg-card flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Atividade recente</h3>
              </div>
              <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {recentActivity.length === 0 ? (
              <div className="py-6 text-center">
                <div className="w-10 h-10 rounded-full border border-border/80 flex items-center justify-center mx-auto mb-2 text-muted-foreground/60">
                  <List className="w-4 h-4" />
                </div>
                <p className="text-xs font-medium text-foreground">Nenhuma atividade recente</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Suas ações aparecerão aqui</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivity.slice(0, 3).map((activity, index) => (
                  <div
                    key={index}
                    className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/40 border border-border/50 text-xs"
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-medium text-foreground truncate">{activity.action}</span>
                      {activity.points && (
                        <span className="text-[10px] text-emerald-600 font-bold">{activity.points}</span>
                      )}
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span className="truncate">{activity.subject}</span>
                      <span className="shrink-0">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 5. Ações Rápidas Section (2x3 tactile colored action buttons) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Ações rápidas</h3>
          <span className="text-xs text-muted-foreground">Atalhos do workspace</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Criar Turma */}
          <button
            onClick={() => onTabChange?.("classes")}
            className="h-12 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium text-xs sm:text-sm flex items-center justify-between shadow-sm transition-all hover:shadow hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4" />
              <span>Criar Turma</span>
            </div>
            <ArrowUpRight className="w-4 h-4 opacity-80" />
          </button>

          {/* Upload Material */}
          <button
            onClick={() => onTabChange?.("materials")}
            className="h-12 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-medium text-xs sm:text-sm flex items-center justify-between shadow-sm transition-all hover:shadow hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Upload className="w-4 h-4" />
              <span>Upload Material</span>
            </div>
            <ArrowUpRight className="w-4 h-4 opacity-80" />
          </button>

          {/* Agendar Estudo */}
          <button
            onClick={() => onTabChange?.("calendar")}
            className="h-12 px-4 rounded-xl bg-[#475569] hover:bg-[#334155] text-white font-medium text-xs sm:text-sm flex items-center justify-between shadow-sm transition-all hover:shadow hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4" />
              <span>Agendar Estudo</span>
            </div>
            <ArrowUpRight className="w-4 h-4 opacity-80" />
          </button>

          {/* Ver Conquistas */}
          <button
            onClick={() => onTabChange?.("achievements")}
            className="h-12 px-4 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-xs sm:text-sm flex items-center justify-between shadow-sm transition-all hover:shadow hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Trophy className="w-4 h-4" />
              <span>Ver Conquistas</span>
            </div>
            <ArrowUpRight className="w-4 h-4 opacity-80" />
          </button>

          {/* Adicionar Meta */}
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="h-12 px-4 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-medium text-xs sm:text-sm flex items-center justify-between shadow-sm transition-all hover:shadow hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Target className="w-4 h-4" />
              <span>Adicionar Meta</span>
            </div>
            <ArrowUpRight className="w-4 h-4 opacity-80" />
          </button>

          {/* Ver Calendário */}
          <button
            onClick={() => onTabChange?.("calendar")}
            className="h-12 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs sm:text-sm flex items-center justify-between shadow-sm transition-all hover:shadow hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-4 h-4" />
              <span>Ver Calendário</span>
            </div>
            <ArrowUpRight className="w-4 h-4 opacity-80" />
          </button>
        </div>
      </div>

      {/* 6. Footer: Report Error Button */}
      <div className="flex justify-center pt-2 pb-6">
        <ReportErrorButton area="Dashboard" />
      </div>

      {/* Goal Modal */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="goal-title">Título da Meta</Label>
              <Input
                id="goal-title"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="Ex: Revisar Cálculo I"
                className="mt-1.5"
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!goalTitle.trim() || !user) return;
                    try {
                      const { data: newGoal, error } = await supabase
                        .from("goals")
                        .insert({
                          title: goalTitle.trim(),
                          user_id: user.id,
                          completed: false
                        })
                        .select()
                        .single();

                      if (error) throw error;
                      setGoals((prev) => [newGoal, ...prev]);
                      toast({
                        title: "Meta adicionada!",
                        description: `Meta "${goalTitle}" foi criada com sucesso.`,
                      });
                      setGoalTitle("");
                      setIsGoalModalOpen(false);
                    } catch (error: any) {
                      console.error("Error creating goal:", error);
                    }
                  }
                }}
              />
            </div>
            <Button 
              onClick={async () => {
                if (goalTitle && user) {
                  try {
                    const { data: newGoal, error } = await supabase
                      .from("goals")
                      .insert({
                        title: goalTitle,
                        user_id: user.id,
                        completed: false
                      })
                      .select()
                      .single();

                    if (error) throw error;

                    setGoals((prev) => [newGoal, ...prev]);
                    toast({
                      title: "Meta adicionada!",
                      description: `Meta "${goalTitle}" foi criada com sucesso.`,
                    });
                    setGoalTitle("");
                    setIsGoalModalOpen(false);
                  } catch (error: any) {
                    console.error("Error creating goal:", error);
                    toast({
                      title: "Erro ao criar meta",
                      description: "Não foi possível criar a meta.",
                      variant: "destructive"
                    });
                  }
                } else {
                  toast({
                    title: "Campo obrigatório",
                    description: "Preencha o título da meta.",
                    variant: "destructive"
                  });
                }
              }}
              className="w-full"
            >
              Criar Meta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;