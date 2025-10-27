import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast, toast } from "@/hooks/use-toast";
import { CalendarDays, BookOpen, Users, Trophy, Flame, Zap, Target, Clock, Calendar, Award, Trash2 } from "lucide-react";
import { User } from "@supabase/supabase-js";
import ReportErrorButton from "@/components/ReportErrorButton";

interface DashboardProps {
  onTabChange?: (tab: string) => void;
}

const Dashboard = ({ onTabChange }: DashboardProps) => {
  useToast();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  interface Goal {
    id: string;
    title: string;
    completed: boolean;
    description?: string;
    user_id: string;
    created_at: string;
    updated_at: string;
  }

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
      toast({
        title: "Erro ao carregar metas",
        description: "Não foi possível carregar suas metas.",
        variant: "destructive"
      });
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
        title: "🗑️ Meta removida",
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
        prev.map((goal) => 
          goal.id === id 
            ? { ...goal, completed: !goal.completed }
            : goal
        )
      );
    } catch (error: any) {
      console.error("Error updating goal:", error);
      toast({
        title: "Erro ao atualizar meta",
        description: "Não foi possível atualizar a meta.",
        variant: "destructive"
      });
    }
  };

  const currentXP = profile?.experience_points || 0;
  const currentLevel = profile?.current_level || 1;
  const nextLevelXP = profile?.next_level_xp || 100;
  const streakDays = profile?.streak_days || 0;
  const progressPercentage = nextLevelXP > 0 ? (currentXP / nextLevelXP) * 100 : 0;

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-accent/5 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with greeting - Gestalt: Proximity principle */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              {(() => {
                const profileName = profile?.username;
                const fullName = user?.user_metadata?.full_name;
                const firstName = fullName ? fullName.split(' ')[0] : null;
                const fallbackName = profileName || firstName || user?.email?.split('@')[0];
                return fallbackName ? `Olá, ${fallbackName}!` : 'Olá';
              })()} <span className="text-primary">👋</span>
            </h1>
            <p className="text-muted-foreground text-lg">Vamos continuar sua jornada de estudos</p>
          </div>
          
          {/* Gestalt: Proximity - Gamification metrics grouped together */}
          <Card className="p-6 bg-gradient-to-r from-streak/10 to-xp/10 shadow-medium border-l-4 border-primary">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-streak">
                  <Flame className="w-6 h-6 text-streak-foreground animate-bounce-subtle" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{streakDays}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Dias de sequência</div>
                </div>
              </div>
              
              <div className="h-12 w-px bg-border" />
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-xp">
                  <Zap className="w-6 h-6 text-xp-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{currentXP} XP</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Nível {currentLevel}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* XP Progress Bar - Gestalt: Closure principle with clear boundaries */}
        <Card className="p-6 shadow-medium border-l-4 border-xp">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-xp" />
                <h3 className="text-xl font-semibold text-foreground">Progresso para o próximo nível</h3>
              </div>
              <Badge variant="outline" className="bg-xp/10 text-xp border-xp">
                {nextLevelXP - currentXP} XP restantes
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-4" />
            <div className="flex justify-between text-sm font-medium">
              <span className="text-muted-foreground">Nível {currentLevel}</span>
              <span className="text-primary">Nível {currentLevel + 1}</span>
            </div>
          </div>
        </Card>

        {/* Gestalt: Symmetry - Balanced 3-column grid with consistent spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Goals - Gestalt: Similarity with consistent styling */}
          <Card className="p-6 shadow-medium border-l-4 border-primary">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Metas de Hoje</h3>
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-3 pr-4">
                {goals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sem metas para hoje</p>
                    <p className="text-xs mt-1">Adicione uma nova meta para começar!</p>
                  </div>
                ) : (
                  goals.map((goal) => (
                    <div key={goal.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <button
                        onClick={() => toggleGoalCompletion(goal.id)}
                        className={`w-4 h-4 rounded-full transition-smooth cursor-pointer hover:scale-110 ${
                          goal.completed ? 'bg-success' : 'bg-muted hover:bg-muted/80'
                        }`}
                        aria-label={goal.completed ? 'Marcar como não concluída' : 'Marcar como concluída'}
                        title={goal.completed ? 'Marcar como não concluída' : 'Marcar como concluída'}
                      />
                       <span className={`text-sm flex-1 ${goal.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {goal.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto"
                        onClick={() => removeGoal(goal.id)}
                        aria-label={`Remover meta ${goal.title}`}
                        title="Remover meta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Upcoming Deadlines - Gestalt: Similarity with consistent styling */}
          <Card className="p-6 shadow-medium border-l-4 border-warning">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <h3 className="text-lg font-semibold">Próximos Prazos</h3>
            </div>
            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum prazo próximo</p>
                </div>
              ) : (
                upcomingDeadlines.map((deadline, index) => (
                <div key={index} className="p-3 rounded-lg bg-muted/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{deadline.subject}</span>
                    <Badge 
                      variant={deadline.urgent ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {deadline.daysLeft} dias
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{deadline.task}</p>
                </div>
              )))}
            </div>
          </Card>

          {/* Recent Activity - Gestalt: Similarity with consistent styling */}
          <Card className="p-6 shadow-medium border-l-4 border-success">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-success/10">
                <Trophy className="w-5 h-5 text-success" />
              </div>
              <h3 className="text-lg font-semibold">Atividade Recente</h3>
            </div>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma atividade recente</p>
                </div>
              ) : (
                recentActivity.map((activity, index) => (
                <div key={index} className="p-3 rounded-lg bg-muted/30 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{activity.action}</span>
                    <Badge variant="outline" className="bg-success-light text-success text-xs">
                      {activity.points}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.subject}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              )))}
            </div>
          </Card>
        </div>

        {/* Quick Actions - Gestalt: Proximity and Symmetry in action grid */}
        <Card className="p-6 shadow-medium">
          <h3 className="text-xl font-semibold mb-6">Ações Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button 
              variant="gamified" 
              className="h-20 flex-col gap-2"
              onClick={() => onTabChange?.("classes")}
            >
              <Users className="w-6 h-6" />
              <span className="text-sm">Criar Turma</span>
            </Button>
            <Button 
              variant="success" 
              className="h-20 flex-col gap-2"
              onClick={() => onTabChange?.("materials")}
            >
              <BookOpen className="w-6 h-6" />
              <span className="text-sm">Upload Material</span>
            </Button>
            <Button 
              variant="secondary" 
              className="h-20 flex-col gap-2"
              onClick={() => onTabChange?.("calendar")}
            >
              <CalendarDays className="w-6 h-6" />
              <span className="text-sm">Agendar Estudo</span>
            </Button>
            <Button 
              variant="xp" 
              className="h-20 flex-col gap-2"
              onClick={() => onTabChange?.("achievements")}
            >
              <Trophy className="w-6 h-6" />
              <span className="text-sm">Ver Conquistas</span>
            </Button>
            <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
              <DialogTrigger asChild>
                <Button variant="streak" className="h-20 flex-col gap-2">
                  <Target className="w-6 h-6" />
                  <span className="text-sm">Adicionar Meta</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Meta</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="goal-title">Título da Meta</Label>
                    <Input
                      id="goal-title"
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      placeholder="Ex: Revisar Cálculo I"
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
                            title: "✅ Meta Adicionada!",
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
                          title: "⚠️ Campo obrigatório",
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
            <Button 
              variant="gamified" 
              className="h-20 flex-col gap-2"
              onClick={() => onTabChange?.("calendar")}
            >
              <Calendar className="w-6 h-6" />
              <span className="text-sm">Ver Calendário</span>
            </Button>
          </div>
        </Card>
      </div>
      
      {/* Report Error Button */}
      <div className="flex justify-center mt-8">
        <ReportErrorButton area="Dashboard" />
      </div>
    </div>
  );
};

export default Dashboard;