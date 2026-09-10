// @ts-nocheck
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import ReportErrorButton from "@/components/ReportErrorButton";
import { supabase } from "@/integrations/supabase/client";
import {
  Trophy,
  Flame,
  Zap,
  BookOpen,
  Users,
  Target,
  TrendingUp,
  Crown,
  Star,
  Lock,
  CheckCircle,
  Clock,
  Medal,
  Sparkles,
  GraduationCap,
  FileText,
} from "lucide-react";

const iconMap: Record<string, any> = {
  Users, Flame, Trophy, Crown, FileText, BookOpen, Star, Sparkles, Zap,
  GraduationCap, Target, Medal,
};

const categoryIconMap: Record<string, any> = {
  social: Users,
  streak: Flame,
  materials: BookOpen,
  study: Target,
  level: Crown,
  special: Sparkles,
};

const difficultyLabel: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
  legendary: "Lendário",
};

const difficultyColors: Record<string, string> = {
  easy: "text-success bg-success/10 border-success/20",
  medium: "text-warning bg-warning/10 border-warning/20",
  hard: "text-destructive bg-destructive/10 border-destructive/20",
  legendary: "text-accent bg-accent/10 border-accent/20",
};

interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  difficulty: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
  // from user_achievements join
  current_progress: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

const Achievements = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all achievement definitions
      const { data: defs, error: defsError } = await supabase
        .from("achievements")
        .select("*")
        .order("difficulty", { ascending: true });

      if (defsError) throw defsError;

      // Fetch this user's progress
      const { data: userProgress, error: progressError } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id);

      if (progressError) throw progressError;

      // Merge definitions with user progress
      const merged: Achievement[] = (defs || []).map((def) => {
        const progress = (userProgress || []).find(
          (p) => p.achievement_id === def.id
        );
        return {
          ...def,
          current_progress: progress?.current_progress ?? 0,
          unlocked: progress?.unlocked ?? false,
          unlocked_at: progress?.unlocked_at ?? null,
        };
      });

      setAchievements(merged);
    } catch (err) {
      console.error("Erro ao carregar conquistas:", err);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercent = (a: Achievement) => {
    if (a.unlocked) return 100;
    if (a.requirement_value === 0) return 0;
    return Math.min(
      Math.round((a.current_progress / a.requirement_value) * 100),
      99
    );
  };

  const getRequirementLabel = (a: Achievement) => {
    if (a.requirement_type === "streak")
      return `${a.current_progress}/${a.requirement_value} dias`;
    if (a.requirement_type === "milestone")
      return `Nível ${a.current_progress}/${a.requirement_value}`;
    return `${a.current_progress}/${a.requirement_value}`;
  };

  const categories = [
    { id: "all", name: "Todas", icon: Trophy },
    { id: "social", name: "Social", icon: Users },
    { id: "streak", name: "Sequências", icon: Flame },
    { id: "materials", name: "Materiais", icon: BookOpen },
    { id: "study", name: "Estudo", icon: Target },
    { id: "level", name: "Nível", icon: Crown },
    { id: "special", name: "Especiais", icon: Sparkles },
  ];

  const filtered = achievements.filter(
    (a) => selectedCategory === "all" || a.category === selectedCategory
  );

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter((a) => a.unlocked).length,
    totalXP: achievements
      .filter((a) => a.unlocked)
      .reduce((sum, a) => sum + a.xp_reward, 0),
    inProgress: achievements.filter(
      (a) => !a.unlocked && a.current_progress > 0
    ).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-accent/5 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground flex items-center justify-center gap-3">
            <Trophy className="w-10 h-10 text-warning" />
            Conquistas
          </h1>
          <p className="text-base text-muted-foreground">
            Acompanhe seu progresso e desbloqueie novas conquistas
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 shadow-soft border-l-4 border-primary">
            <div className="space-y-2 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-gradient-primary flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {loading ? <Skeleton className="h-8 w-10 mx-auto" /> : stats.unlocked}
              </div>
              <p className="text-sm text-muted-foreground">Desbloqueadas</p>
            </div>
          </Card>

          <Card className="p-4 shadow-soft border-l-4 border-xp">
            <div className="space-y-2 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-r from-accent to-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {loading ? <Skeleton className="h-8 w-12 mx-auto" /> : stats.totalXP}
              </div>
              <p className="text-sm text-muted-foreground">XP Total</p>
            </div>
          </Card>

          <Card className="p-4 shadow-soft border-l-4 border-warning">
            <div className="space-y-2 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-r from-warning to-success flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {loading ? <Skeleton className="h-8 w-8 mx-auto" /> : stats.inProgress}
              </div>
              <p className="text-sm text-muted-foreground">Em Progresso</p>
            </div>
          </Card>

          <Card className="p-4 shadow-soft border-l-4 border-success">
            <div className="space-y-2 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-r from-success to-accent flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {loading ? (
                  <Skeleton className="h-8 w-12 mx-auto" />
                ) : stats.total > 0 ? (
                  `${Math.round((stats.unlocked / stats.total) * 100)}%`
                ) : (
                  "0%"
                )}
              </div>
              <p className="text-sm text-muted-foreground">Completo</p>
            </div>
          </Card>
        </div>

        {/* Progress overview */}
        <Card className="p-6 shadow-medium">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Progresso Geral</h3>
              <Badge variant="outline" className="bg-success-light text-success">
                {stats.unlocked} de {stats.total}
              </Badge>
            </div>
            <Progress
              value={stats.total > 0 ? (stats.unlocked / stats.total) * 100 : 0}
              className="h-3"
            />
            <p className="text-sm text-muted-foreground text-center">
              Continue desbloqueando conquistas para ganhar mais XP e subir de nível!
            </p>
          </div>
        </Card>

        {/* Category filters */}
        <Card className="p-4 shadow-medium border-l-4 border-muted">
          <div className="flex flex-wrap gap-3">
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

        {/* Achievements grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6 space-y-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma conquista nesta categoria.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((achievement) => {
              const percent = getProgressPercent(achievement);
              const IconComponent =
                iconMap[achievement.icon] || Trophy;

              const borderColor = achievement.unlocked
                ? "border-success"
                : percent > 50
                ? "border-warning"
                : "border-muted";

              return (
                <Card
                  key={achievement.id}
                  className={`p-6 shadow-soft transition-smooth border-l-4 ${borderColor} ${
                    achievement.unlocked
                      ? "bg-gradient-to-br from-success/5 to-accent/5"
                      : ""
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            achievement.unlocked
                              ? "bg-success/10"
                              : "bg-muted/30 grayscale opacity-60"
                          }`}
                        >
                          <IconComponent className="w-6 h-6 text-foreground" />
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${difficultyColors[achievement.difficulty]}`}
                        >
                          {difficultyLabel[achievement.difficulty] ?? achievement.difficulty}
                        </Badge>
                      </div>
                      {achievement.unlocked ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="space-y-1">
                      <h3
                        className={`font-semibold ${
                          achievement.unlocked
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {achievement.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                    </div>

                    {/* Progress / Unlocked */}
                    {achievement.unlocked ? (
                      <Badge
                        variant="outline"
                        className="bg-success-light text-success text-xs"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Desbloqueado em{" "}
                        {achievement.unlocked_at
                          ? new Date(achievement.unlocked_at).toLocaleDateString(
                              "pt-BR"
                            )
                          : "—"}
                      </Badge>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Progresso
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {percent}%
                          </span>
                        </div>
                        <Progress value={percent} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {getRequirementLabel(achievement)}
                        </p>
                      </div>
                    )}

                    {/* Reward */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-accent" />
                        <span className="text-sm font-medium text-foreground">
                          +{achievement.xp_reward} XP
                        </span>
                      </div>
                      {!achievement.unlocked && achievement.current_progress > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-warning-light text-warning text-xs"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Em progresso
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Motivational */}
        <Card className="p-6 shadow-medium bg-gradient-to-r from-accent/5 to-primary/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Medal className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">
                Continue conquistando! 🎉
              </h3>
              <p className="text-muted-foreground">
                Cada conquista desbloqueada te dá mais XP e te aproxima de novos
                níveis. Continue estudando!
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-center mt-8">
        <ReportErrorButton area="Conquistas" />
      </div>
    </div>
  );
};

export default Achievements;