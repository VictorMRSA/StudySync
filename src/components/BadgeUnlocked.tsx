import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Award } from 'lucide-react';

interface BadgeUnlockedProps {
  name: string;
  description: string;
  icon: string;
  onClose: () => void;
}

export const BadgeUnlocked = ({ name, description, icon, onClose }: BadgeUnlockedProps) => {
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
      <Card className="border-l-4 border-success shadow-large p-8 max-w-md text-center animate-scale-in">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-success/20 rounded-full blur-xl animate-pulse" />
            <div className="text-6xl relative z-10">{icon}</div>
          </div>
          
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="h-5 w-5 text-success" />
              <h2 className="text-2xl font-bold text-foreground">
                Nova Conquista!
              </h2>
            </div>
            <p className="text-3xl font-bold text-success mb-2">
              {name}
            </p>
            <p className="text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
