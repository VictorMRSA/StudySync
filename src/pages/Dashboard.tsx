import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, BookOpen, Users, Trophy, Flame, Zap, Target, Clock, Calendar, Award } from "lucide-react";

interface DashboardProps {
  onTabChange?: (tab: string) => void;
}

const Dashboard = ({ onTabChange }: DashboardProps) => {
  const { toast } = useToast();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const streakDays = 7;
  const currentXP = 1250;
  const nextLevelXP = 2000;
  const todayGoals = [
    { id: 1, text: "Revisar Cálculo I - Limites", completed: true },
    { id: 2, text: "Fazer exercícios de Álgebra", completed: false },
    { id: 3, text: "Estudar para prova de Física", completed: false },
  ];

  const upcomingDeadlines = [
    { subject: "Física I", task: "Prova", daysLeft: 3, urgent: true },
    { subject: "Cálculo I", task: "Lista de exercícios", daysLeft: 5, urgent: false },
    { subject: "Programação", task: "Projeto final", daysLeft: 12, urgent: false },
  ];

  const recentActivity = [
    { action: "Upload de material", subject: "Física I", points: "+50 XP", time: "2h atrás" },
    { action: "Meta concluída", subject: "Cálculo I", points: "+25 XP", time: "4h atrás" },
    { action: "Criou turma", subject: "Álgebra Linear", points: "+100 XP", time: "1 dia atrás" },
  ];

  const progressPercentage = (currentXP / nextLevelXP) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-accent/5 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with greeting and streak */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">
              Olá, <span className="text-primary">João!</span> 👋
            </h1>
            <p className="text-muted-foreground">Vamos continuar sua jornada de estudos</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Card className="p-4 bg-gradient-streak shadow-medium border-0">
              <div className="flex items-center gap-3 text-streak-foreground">
                <Flame className="w-6 h-6 animate-bounce-subtle" />
                <div>
                  <div className="text-lg font-bold">{streakDays} dias</div>
                  <div className="text-xs opacity-90">Sequência ativa</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-gradient-xp shadow-medium border-0">
              <div className="flex items-center gap-3 text-xp-foreground">
                <Zap className="w-6 h-6" />
                <div>
                  <div className="text-lg font-bold">{currentXP} XP</div>
                  <div className="text-xs opacity-90">Nível 5</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* XP Progress Bar */}
        <Card className="p-6 shadow-medium">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Progresso para o próximo nível</h3>
              <Badge variant="outline" className="bg-xp-light text-xp">
                {nextLevelXP - currentXP} XP restantes
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Nível 5</span>
              <span>Nível 6</span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Goals */}
          <Card className="p-6 shadow-medium">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Metas de Hoje</h3>
            </div>
            <div className="space-y-3">
              {todayGoals.map((goal) => (
                <div key={goal.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className={`w-4 h-4 rounded-full ${goal.completed ? 'bg-success' : 'bg-muted'} transition-smooth`} />
                  <span className={`text-sm ${goal.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {goal.text}
                  </span>
                </div>
              ))}
              <Button variant="gamified" size="sm" className="w-full mt-3">
                <Target className="w-4 h-4" />
                Adicionar Meta
              </Button>
            </div>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="p-6 shadow-medium">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-warning" />
              <h3 className="font-semibold">Próximos Prazos</h3>
            </div>
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline, index) => (
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
              ))}
              <Button variant="outline" size="sm" className="w-full mt-3">
                <CalendarDays className="w-4 h-4" />
                Ver Calendário
              </Button>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6 shadow-medium">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">Atividade Recente</h3>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
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
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 shadow-medium">
          <h3 className="font-semibold mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button 
              variant="gamified" 
              className="h-20 flex-col gap-2"
              onClick={() => toast({
                title: "🚧 Em Construção",
                description: "Esta funcionalidade está sendo desenvolvida!",
              })}
            >
              <Users className="w-6 h-6" />
              <span className="text-sm">Criar Turma</span>
            </Button>
            <Button 
              variant="success" 
              className="h-20 flex-col gap-2"
              onClick={() => toast({
                title: "🚧 Em Construção", 
                description: "Esta funcionalidade está sendo desenvolvida!",
              })}
            >
              <BookOpen className="w-6 h-6" />
              <span className="text-sm">Upload Material</span>
            </Button>
            <Button 
              variant="outline" 
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
                <Button variant="outline" className="h-20 flex-col gap-2">
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
                  <div>
                    <Label htmlFor="goal-description">Descrição</Label>
                    <Input
                      id="goal-description"
                      value={goalDescription}
                      onChange={(e) => setGoalDescription(e.target.value)}
                      placeholder="Ex: Resolver 5 exercícios hoje"
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      if (goalTitle && goalDescription) {
                        toast({
                          title: "✅ Meta Adicionada!",
                          description: `Meta "${goalTitle}" foi criada com sucesso.`,
                        });
                        setGoalTitle("");
                        setGoalDescription("");
                        setIsGoalModalOpen(false);
                      } else {
                        toast({
                          title: "⚠️ Campos obrigatórios",
                          description: "Preencha todos os campos para criar a meta.",
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
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => onTabChange?.("calendar")}
            >
              <Calendar className="w-6 h-6" />
              <span className="text-sm">Ver Calendário</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;