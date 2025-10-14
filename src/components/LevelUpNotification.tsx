import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface LevelUpNotificationProps {
  level: number;
  onClose: () => void;
}

export const LevelUpNotification = ({ level, onClose }: LevelUpNotificationProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className="border-l-4 border-xp shadow-large p-8 max-w-md text-center animate-scale-in">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-xp/20 rounded-full blur-xl animate-pulse" />
            <Sparkles className="h-16 w-16 text-xp relative z-10" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Level Up!
            </h2>
            <p className="text-5xl font-bold text-xp mb-2">
              Nível {level}
            </p>
            <p className="text-muted-foreground">
              Continue assim e alcance novos patamares! 🚀
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
