import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SimpleNavigation } from '@/components/SimpleNavigation';
import { useGamification } from '@/hooks/useGamification';
import { toast } from '@/hooks/use-toast';
import { MapPin, CheckCircle, Target, Clock } from 'lucide-react';

interface DailyGoal {
  id: string;
  goal_type: string;
  completed: boolean;
}

const GOAL_TYPES = [
  { type: 'study_15min', label: 'Estudar por 15 minutos', icon: Clock },
  { type: 'complete_quiz', label: 'Completar 1 quiz', icon: Target },
  { type: 'add_material', label: 'Adicionar 1 material', icon: MapPin },
];

export default function Journey() {
  const { awardBadge } = useGamification();
  const [loading, setLoading] = useState(true);
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([]);
  const [currentMarco, setCurrentMarco] = useState(0);

  useEffect(() => {
    loadJourney();
  }, []);

  const loadJourney = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Carregar metas de hoje
      const { data: goals } = await supabase
        .from('daily_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('goal_date', today);

      if (!goals || goals.length === 0) {
        // Criar metas do dia
        const newGoals = GOAL_TYPES.map(g => ({
          user_id: user.id,
          goal_type: g.type,
          goal_date: today
        }));

        const { data: created } = await supabase
          .from('daily_goals')
          .insert(newGoals)
          .select();

        setDailyGoals(created || []);
      } else {
        setDailyGoals(goals);
      }

      // Calcular marco atual (total de metas completadas)
      const { count } = await supabase
        .from('daily_goals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true);

      setCurrentMarco(count || 0);

      // Verificar badges
      if (count === 10) {
        await awardBadge('Explorador');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading journey:', error);
      setLoading(false);
    }
  };

  const completeGoal = async (goalId: string) => {
    try {
      await supabase
        .from('daily_goals')
        .update({ completed: true })
        .eq('id', goalId);

      setDailyGoals(prev => prev.map(g => 
        g.id === goalId ? { ...g, completed: true } : g
      ));

      setCurrentMarco(prev => prev + 1);
      
      toast({
        title: '✅ Meta concluída!',
        description: 'Continue assim para avançar na jornada!',
      });
    } catch (error) {
      console.error('Error completing goal:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SimpleNavigation />
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <p className="text-muted-foreground">Carregando jornada...</p>
        </div>
      </div>
    );
  }

  const completedToday = dailyGoals.filter(g => g.completed).length;
  const progressToday = (completedToday / 3) * 100;
  const progressTotal = (currentMarco / 30) * 100;

  return (
    <div className="min-h-screen bg-background">
      <SimpleNavigation />
      
      <div className="container mx-auto p-6 max-w-5xl">
        <h1 className="text-4xl font-bold mb-8">Minha Jornada do Conhecimento</h1>

        {/* Metas Diárias */}
        <Card className="border-l-4 border-primary shadow-soft p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Metas de Hoje</h2>
          <Progress value={progressToday} className="mb-6" />
          
          <div className="grid gap-4">
            {dailyGoals.map((goal, index) => {
              const goalType = GOAL_TYPES[index];
              const Icon = goalType.icon;

              return (
                <div
                  key={goal.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg ${
                    goal.completed ? 'bg-success/10 border-success' : 'border-muted'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${goal.completed ? 'text-success' : 'text-muted-foreground'}`} />
                  <span className="flex-1 font-medium">{goalType.label}</span>
                  {goal.completed ? (
                    <CheckCircle className="h-6 w-6 text-success" />
                  ) : (
                    <Button size="sm" onClick={() => completeGoal(goal.id)}>
                      Marcar como Concluída
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Trilha de 30 Marcos */}
        <Card className="border-l-4 border-accent shadow-soft p-6">
          <h2 className="text-2xl font-bold mb-4">Trilha do Conhecimento</h2>
          <div className="flex items-center gap-4 mb-6">
            <MapPin className="h-6 w-6 text-accent" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                Marco {currentMarco} de 30
              </p>
              <Progress value={progressTotal} />
            </div>
          </div>

          <div className="grid grid-cols-10 gap-3">
            {Array.from({ length: 30 }, (_, i) => i + 1).map(marco => {
              const isReached = marco <= currentMarco;
              const isCurrent = marco === currentMarco + 1;
              const isMilestone = marco === 7 || marco === 15 || marco === 30;

              return (
                <div
                  key={marco}
                  className={`aspect-square flex items-center justify-center rounded-full border-2 font-bold transition-all ${
                    isReached
                      ? 'bg-primary text-primary-foreground border-primary shadow-medium'
                      : isCurrent
                      ? 'border-primary text-primary animate-pulse'
                      : 'border-muted text-muted-foreground'
                  } ${isMilestone ? 'ring-4 ring-warning/30' : ''}`}
                >
                  {isReached ? '✓' : marco}
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-bold mb-2">📍 Marcos Especiais:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Marco 7: Desbloqueie um badge especial!</li>
              <li>Marco 15: Desbloqueie outro badge!</li>
              <li>Marco 30: Desbloqueie o badge final da jornada!</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
