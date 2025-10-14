import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleNavigation } from '@/components/SimpleNavigation';
import { useGamification } from '@/hooks/useGamification';
import { toast } from '@/hooks/use-toast';
import { Play, Pause, RotateCcw, Sprout } from 'lucide-react';

const PLANT_STAGES = [
  { stage: 1, emoji: '🌱', label: 'Semente' },
  { stage: 2, emoji: '🌿', label: 'Broto' },
  { stage: 3, emoji: '🪴', label: 'Muda' },
  { stage: 4, emoji: '🌳', label: 'Árvore' },
  { stage: 5, emoji: '🌲', label: 'Árvore Gigante' },
];

export default function FocusMode() {
  const { addExperience, awardBadge } = useGamification();
  
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [plantStage, setPlantStage] = useState(1);
  const [completedSessions, setCompletedSessions] = useState(0);

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning]);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('focus_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true);

      setCompletedSessions(count || 0);
      
      // Calcular estágio da planta (a cada 5 sessões)
      const stage = Math.min(Math.floor((count || 0) / 5) + 1, 5);
      setPlantStage(stage);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const startSession = () => {
    setTimeLeft(duration * 60);
    setIsRunning(true);
  };

  const pauseSession = () => {
    setIsRunning(false);
  };

  const resetSession = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
  };

  const completeSession = async () => {
    setIsRunning(false);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('focus_sessions').insert({
        user_id: user.id,
        duration_minutes: duration,
        completed: true,
        plant_stage: plantStage
      });

      await addExperience(30, `Sessão de foco de ${duration} minutos!`);

      const newCompleted = completedSessions + 1;
      setCompletedSessions(newCompleted);

      // Atualizar estágio da planta
      if (newCompleted % 5 === 0) {
        const newStage = Math.min(Math.floor(newCompleted / 5) + 1, 5);
        setPlantStage(newStage);
        
        toast({
          title: '🌱 Sua planta cresceu!',
          description: `Agora ela está no estágio ${newStage}!`,
        });
      }

      if (newCompleted === 5) {
        await awardBadge('Concentrado');
      }

      toast({
        title: '✅ Sessão de foco concluída!',
        description: '+30 XP ganhos!',
      });
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentPlant = PLANT_STAGES.find(p => p.stage === plantStage) || PLANT_STAGES[0];
  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <div className="min-h-screen bg-background">
      <SimpleNavigation />
      
      <div className="container mx-auto p-6 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Modo Foco</h1>

        <Card className="border-l-4 border-success shadow-soft p-8 mb-6">
          <div className="text-center mb-8">
            <div className="text-9xl mb-4 animate-pulse">
              {currentPlant.emoji}
            </div>
            <p className="text-xl font-bold text-success mb-2">{currentPlant.label}</p>
            <p className="text-sm text-muted-foreground">
              {completedSessions} sessões completadas
            </p>
          </div>

          {!isRunning && timeLeft === duration * 60 && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Duração da Sessão</label>
              <div className="flex gap-3 justify-center">
                {[25, 45, 60].map(mins => (
                  <Button
                    key={mins}
                    variant={duration === mins ? 'default' : 'outline'}
                    onClick={() => {
                      setDuration(mins);
                      setTimeLeft(mins * 60);
                    }}
                  >
                    {mins} min
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="text-center mb-6">
            <div className="text-7xl font-bold text-primary mb-4">
              {formatTime(timeLeft)}
            </div>
            <div className="w-full bg-muted rounded-full h-3 mb-4">
              <div 
                className="bg-success h-3 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            {!isRunning ? (
              <Button size="lg" onClick={startSession}>
                <Play className="h-5 w-5 mr-2" />
                Iniciar Foco
              </Button>
            ) : (
              <>
                <Button size="lg" variant="outline" onClick={pauseSession}>
                  <Pause className="h-5 w-5 mr-2" />
                  Pausar
                </Button>
                <Button size="lg" variant="destructive" onClick={resetSession}>
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Reiniciar
                </Button>
              </>
            )}
          </div>

          {isRunning && (
            <div className="mt-6 p-4 bg-warning/10 border border-warning rounded-lg text-center">
              <p className="text-sm text-warning font-medium">
                ⚠️ Não saia desta tela ou a sessão será cancelada!
              </p>
            </div>
          )}
        </Card>

        <Card className="border-l-4 border-accent shadow-soft p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sprout className="h-5 w-5 text-accent" />
            Estágios da Planta
          </h2>
          <div className="grid grid-cols-5 gap-4">
            {PLANT_STAGES.map(plant => (
              <div
                key={plant.stage}
                className={`text-center p-3 rounded-lg border-2 ${
                  plant.stage <= plantStage
                    ? 'border-success bg-success/10'
                    : 'border-muted bg-muted/5'
                }`}
              >
                <div className="text-4xl mb-2">{plant.emoji}</div>
                <p className="text-xs font-medium">{plant.label}</p>
                <p className="text-xs text-muted-foreground">
                  {(plant.stage - 1) * 5} sessões
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
