import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Trophy, 
  Flame, 
  Zap, 
  BookOpen, 
  Users, 
  Calendar,
  Award,
  Target,
  TrendingUp,
  Settings,
  Crown
} from "lucide-react";

const Profile = () => {
  const userStats = {
    name: "João Silva",
    email: "joao.silva@estudante.com",
    level: 5,
    currentXP: 1250,
    nextLevelXP: 2000,
    streak: 7,
    totalMaterials: 23,
    classesJoined: 6,
    studyHours: 84,
    joinDate: "Setembro 2024"
  };

  const achievements = [
    {
      id: 1,
      title: "Primeira Turma",
      description: "Criou sua primeira turma",
      icon: "🎯",
      unlocked: true,
      date: "15 Jan 2024"
    },
    {
      id: 2,
      title: "Sequência de Fogo",
      description: "Manteve 7 dias consecutivos de estudo",
      icon: "🔥",
      unlocked: true,
      date: "12 Jan 2024"
    },
    {
      id: 3,
      title: "Colaborador Ativo",
      description: "Compartilhou 10+ materiais",
      icon: "📚",
      unlocked: true,
      date: "10 Jan 2024"
    },
    {
      id: 4,
      title: "Mentor da Turma",
      description: "Ajudou 5+ colegas",
      icon: "👨‍🏫",
      unlocked: false,
      progress: 60
    },
    {
      id: 5,
      title: "Especialista",
      description: "Alcance o nível 10",
      icon: "⭐",
      unlocked: false,
      progress: 30
    },
    {
      id: 6,
      title: "Maratonista",
      description: "30 dias consecutivos",
      icon: "🏃‍♂️",
      unlocked: false,
      progress: 23
    }
  ];

  const studyStats = [
    { label: "Materiais Compartilhados", value: userStats.totalMaterials, icon: BookOpen, color: "text-primary" },
    { label: "Turmas Participando", value: userStats.classesJoined, icon: Users, color: "text-success" },
    { label: "Horas de Estudo", value: userStats.studyHours, icon: Calendar, color: "text-warning" },
    { label: "Sequência Atual", value: `${userStats.streak} dias`, icon: Flame, color: "text-streak" }
  ];

  const progressPercentage = (userStats.currentXP / userStats.nextLevelXP) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-accent/5 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
            <p className="text-muted-foreground">Acompanhe seu progresso e conquistas</p>
          </div>
          
          <Button variant="outline" size="lg">
            <Settings className="w-5 h-5" />
            Configurações
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1 p-6 shadow-medium">
            <div className="text-center space-y-4">
              <Avatar className="w-24 h-24 mx-auto">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                  {userStats.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">{userStats.name}</h2>
                <p className="text-sm text-muted-foreground">{userStats.email}</p>
                <Badge variant="outline" className="bg-primary-light text-primary">
                  Membro desde {userStats.joinDate}
                </Badge>
              </div>

              {/* Level and XP */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-center gap-2">
                  <Crown className="w-5 h-5 text-warning" />
                  <span className="text-lg font-semibold">Nível {userStats.level}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{userStats.currentXP} XP</span>
                    <span className="text-muted-foreground">{userStats.nextLevelXP} XP</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                  <p className="text-xs text-muted-foreground text-center">
                    {userStats.nextLevelXP - userStats.currentXP} XP para o próximo nível
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <Card className="lg:col-span-2 p-6 shadow-medium">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Estatísticas de Estudo
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {studyStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="p-4 rounded-lg bg-muted/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-3">Ações Rápidas</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="gamified" size="sm">
                  <Target className="w-4 h-4" />
                  Definir Meta
                </Button>
                <Button variant="success" size="sm">
                  <BookOpen className="w-4 h-4" />
                  Upload Material
                </Button>
                <Button variant="outline" size="sm">
                  <Users className="w-4 h-4" />
                  Convidar Amigos
                </Button>
                <Button variant="xp" size="sm">
                  <Award className="w-4 h-4" />
                  Ver Ranking
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Achievements */}
        <Card className="p-6 shadow-medium">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              Conquistas
            </h3>
            <Badge variant="outline" className="bg-success-light text-success">
              {achievements.filter(a => a.unlocked).length} de {achievements.length}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border transition-smooth ${
                  achievement.unlocked 
                    ? "bg-gradient-to-br from-success/10 to-accent/10 border-success/20 shadow-soft" 
                    : "bg-muted/30 border-muted"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`text-2xl ${achievement.unlocked ? "" : "grayscale opacity-50"}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className={`font-medium ${achievement.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                      {achievement.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    
                    {achievement.unlocked ? (
                      <Badge variant="outline" className="bg-success-light text-success text-xs">
                        Desbloqueado em {achievement.date}
                      </Badge>
                    ) : (
                      <div className="space-y-1">
                        <Progress value={achievement.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Progresso: {achievement.progress}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity Summary */}
        <Card className="p-6 shadow-medium bg-gradient-to-r from-accent/5 to-primary/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">Continue assim! 🎉</h3>
              <p className="text-muted-foreground">
                Você está no seu melhor momento! Mantenha a sequência e alcance novos patamares.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;