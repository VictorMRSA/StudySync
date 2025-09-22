import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportErrorButton from "@/components/ReportErrorButton";
import { 
  Trophy, 
  Flame, 
  Zap, 
  BookOpen, 
  Users, 
  Calendar,
  Award,
  Target,
  TrendingUp,
  Crown,
  Star,
  Lock,
  CheckCircle,
  Clock,
  Medal,
  Sparkles
} from "lucide-react";

const Achievements = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const achievements = [
    {
      id: 1,
      title: "Primeira Turma",
      description: "Criou sua primeira turma de estudos",
      icon: "🎯",
      category: "social",
      difficulty: "easy",
      xpReward: 100,
      unlocked: true,
      unlockedDate: "2024-01-15",
      progress: 100,
      type: "milestone"
    },
    {
      id: 2,
      title: "Sequência de Fogo",
      description: "Manteve 7 dias consecutivos de estudo",
      icon: "🔥",
      category: "streak",
      difficulty: "medium",
      xpReward: 200,
      unlocked: true,
      unlockedDate: "2024-01-12",
      progress: 100,
      type: "streak"
    },
    {
      id: 3,
      title: "Colaborador Ativo",
      description: "Compartilhou 10+ materiais de estudo",
      icon: "📚",
      category: "materials",
      difficulty: "medium",
      xpReward: 250,
      unlocked: true,
      unlockedDate: "2024-01-10",
      progress: 100,
      type: "progress"
    },
    {
      id: 4,
      title: "Mentor da Turma",
      description: "Ajudou 5+ colegas com dúvidas",
      icon: "👨‍🏫",
      category: "social",
      difficulty: "hard",
      xpReward: 300,
      unlocked: false,
      progress: 60,
      type: "progress",
      requirement: "3/5 colegas ajudados"
    },
    {
      id: 5,
      title: "Especialista",
      description: "Alcance o nível 10 no sistema",
      icon: "⭐",
      category: "level",
      difficulty: "hard",
      xpReward: 500,
      unlocked: false,
      progress: 30,
      type: "milestone",
      requirement: "Nível 5/10"
    },
    {
      id: 6,
      title: "Maratonista",
      description: "30 dias consecutivos de estudo",
      icon: "🏃‍♂️",
      category: "streak",
      difficulty: "legendary",
      xpReward: 750,
      unlocked: false,
      progress: 23,
      type: "streak",
      requirement: "7/30 dias"
    },
    {
      id: 7,
      title: "Colecionador",
      description: "Baixou 50+ materiais diferentes",
      icon: "📂",
      category: "materials",
      difficulty: "medium",
      xpReward: 200,
      unlocked: false,
      progress: 76,
      type: "progress",
      requirement: "38/50 materiais"
    },
    {
      id: 8,
      title: "Líder Estudantil",
      description: "Criou 3+ turmas ativas",
      icon: "👑",
      category: "social",
      difficulty: "hard",
      xpReward: 400,
      unlocked: false,
      progress: 33,
      type: "progress",
      requirement: "1/3 turmas"
    },
    {
      id: 9,
      title: "Dedicado",
      description: "Estudou por 100+ horas totais",
      icon: "⏰",
      category: "study",
      difficulty: "hard",
      xpReward: 300,
      unlocked: false,
      progress: 84,
      type: "progress",
      requirement: "84/100 horas"
    },
    {
      id: 10,
      title: "Lenda do Study Sync",
      description: "Desbloqueou todas as outras conquistas",
      icon: "🏆",
      category: "special",
      difficulty: "legendary",
      xpReward: 1000,
      unlocked: false,
      progress: 30,
      type: "special",
      requirement: "3/10 conquistas"
    }
  ];

  const categories = [
    { id: "all", name: "Todas", icon: Trophy },
    { id: "social", name: "Social", icon: Users },
    { id: "streak", name: "Sequências", icon: Flame },
    { id: "materials", name: "Materiais", icon: BookOpen },
    { id: "study", name: "Estudo", icon: Target },
    { id: "level", name: "Nível", icon: Crown },
    { id: "special", name: "Especiais", icon: Sparkles }
  ];

  const difficultyColors = {
    easy: "text-success bg-success/10 border-success/20",
    medium: "text-warning bg-warning/10 border-warning/20",
    hard: "text-destructive bg-destructive/10 border-destructive/20",
    legendary: "text-accent bg-accent/10 border-accent/20"
  };

  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === "all" || achievement.category === selectedCategory
  );

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter(a => a.unlocked).length,
    totalXP: achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0),
    inProgress: achievements.filter(a => !a.unlocked && a.progress > 0).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-accent/5 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
              <Trophy className="w-8 h-8 text-warning" />
              Conquistas
            </h1>
            <p className="text-muted-foreground">Acompanhe seu progresso e desbloqueie novas conquistas</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 shadow-soft">
            <div className="space-y-2 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-gradient-primary flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.unlocked}</div>
              <p className="text-sm text-muted-foreground">Desbloqueadas</p>
            </div>
          </Card>
          
          <Card className="p-4 shadow-soft">
            <div className="space-y-2 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-r from-accent to-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.totalXP}</div>
              <p className="text-sm text-muted-foreground">XP Total</p>
            </div>
          </Card>
          
          <Card className="p-4 shadow-soft">
            <div className="space-y-2 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-r from-warning to-success flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.inProgress}</div>
              <p className="text-sm text-muted-foreground">Em Progresso</p>
            </div>
          </Card>
          
          <Card className="p-4 shadow-soft">
            <div className="space-y-2 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-r from-success to-accent flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {Math.round((stats.unlocked / stats.total) * 100)}%
              </div>
              <p className="text-sm text-muted-foreground">Completo</p>
            </div>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card className="p-6 shadow-medium">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Progresso Geral</h3>
              <Badge variant="outline" className="bg-success-light text-success">
                {stats.unlocked} de {stats.total}
              </Badge>
            </div>
            <Progress value={(stats.unlocked / stats.total) * 100} className="h-3" />
            <p className="text-sm text-muted-foreground text-center">
              Continue desbloqueando conquistas para ganhar mais XP e subir de nível!
            </p>
          </div>
        </Card>

        {/* Category Filters */}
        <Card className="p-4 shadow-medium">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "gamified" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="transition-smooth"
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </Card>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => (
            <Card 
              key={achievement.id} 
              className={`p-6 shadow-medium transition-smooth ${
                achievement.unlocked 
                  ? "bg-gradient-to-br from-success/5 to-accent/5 border-success/20 shadow-soft" 
                  : "hover:shadow-large"
              }`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl ${achievement.unlocked ? "" : "grayscale opacity-50"}`}>
                      {achievement.icon}
                    </div>
                    <div className="space-y-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${difficultyColors[achievement.difficulty]}`}
                      >
                        {achievement.difficulty === "easy" && "Fácil"}
                        {achievement.difficulty === "medium" && "Médio"}
                        {achievement.difficulty === "hard" && "Difícil"}
                        {achievement.difficulty === "legendary" && "Lendário"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {achievement.unlocked ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className={`font-semibold ${achievement.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                    {achievement.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </div>

                {/* Progress */}
                {achievement.unlocked ? (
                  <div className="space-y-2">
                    <Badge variant="outline" className="bg-success-light text-success text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Desbloqueado em {new Date(achievement.unlockedDate).toLocaleDateString('pt-BR')}
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Progresso</span>
                      <span className="text-sm font-medium text-foreground">{achievement.progress}%</span>
                    </div>
                    <Progress value={achievement.progress} className="h-2" />
                    {achievement.requirement && (
                      <p className="text-xs text-muted-foreground">{achievement.requirement}</p>
                    )}
                  </div>
                )}

                {/* Reward */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium text-foreground">+{achievement.xpReward} XP</span>
                    </div>
                  </div>
                  
                  {!achievement.unlocked && achievement.progress > 0 && (
                    <Badge variant="outline" className="bg-warning-light text-warning text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      Em progresso
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Motivational Card */}
        <Card className="p-6 shadow-medium bg-gradient-to-r from-accent/5 to-primary/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Medal className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">Continue conquistando! 🎉</h3>
              <p className="text-muted-foreground">
                Cada conquista desbloqueada te dá mais XP e te aproxima de novos níveis. Continue estudando!
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Report Error Button */}
      <div className="flex justify-center mt-8">
        <ReportErrorButton area="Conquistas" />
      </div>
    </div>
  );
};

export default Achievements;