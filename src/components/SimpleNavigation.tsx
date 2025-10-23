import { Button } from "@/components/ui/button";
import { BookOpen, Home, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const SimpleNavigation = () => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-soft">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Study Sync
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate('/difficulties')}>
            <TrendingDown className="h-4 w-4 mr-2" />
            Minhas Dificuldades
          </Button>
          <Button variant="outline" onClick={() => navigate('/')}>
            <Home className="h-4 w-4 mr-2" />
            Início
          </Button>
        </div>
      </div>
    </div>
  );
};
