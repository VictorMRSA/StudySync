import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleNavigation } from '@/components/SimpleNavigation';
import { toast } from '@/hooks/use-toast';
import { RotateCcw, Play } from 'lucide-react';

interface Flashcard {
  term: string;
  definition: string;
}

export default function Flashcards() {
  const { materialId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    loadFlashcards();
  }, [materialId]);

  const loadFlashcards = async () => {
    try {
      const { data: material } = await supabase
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .single();

      if (!material) {
        toast({ title: 'Material não encontrado', variant: 'destructive' });
        navigate(-1);
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: { content: material.description || material.title }
      });

      if (error) throw error;
      
      setFlashcards(data.flashcards);
      setLoading(false);
    } catch (error) {
      console.error('Error loading flashcards:', error);
      toast({ title: 'Erro ao carregar flashcards', variant: 'destructive' });
      navigate(-1);
    }
  };

  const handleNext = () => {
    setFlipped(false);
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(prev => prev + 1);
    } else {
      setCurrentCard(0);
    }
  };

  const handlePrevious = () => {
    setFlipped(false);
    if (currentCard > 0) {
      setCurrentCard(prev => prev - 1);
    } else {
      setCurrentCard(flashcards.length - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SimpleNavigation />
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <p className="text-muted-foreground">Gerando flashcards...</p>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SimpleNavigation />
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <p className="text-muted-foreground">Nenhum flashcard gerado.</p>
        </div>
      </div>
    );
  }

  const card = flashcards[currentCard];

  return (
    <div className="min-h-screen bg-background">
      <SimpleNavigation />
      
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">Flashcards</h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(`/memory-game/${materialId}`)}>
              <Play className="h-4 w-4 mr-2" />
              Jogo da Memória
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </div>
        </div>

        <div className="text-center mb-4 text-muted-foreground">
          Card {currentCard + 1} de {flashcards.length}
        </div>

        <div className="perspective-1000 mb-8">
          <Card 
            className={`border-l-4 border-accent shadow-soft cursor-pointer transition-transform duration-500 transform-style-preserve-3d ${
              flipped ? 'rotate-y-180' : ''
            }`}
            onClick={() => setFlipped(!flipped)}
            style={{ 
              minHeight: '400px',
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            <div className="absolute inset-0 backface-hidden p-12 flex flex-col items-center justify-center">
              <p className="text-sm text-muted-foreground mb-4">Termo</p>
              <h2 className="text-4xl font-bold text-center">{card.term}</h2>
              <p className="text-sm text-muted-foreground mt-8">
                Clique para ver a definição
              </p>
            </div>
            
            <div 
              className="absolute inset-0 backface-hidden p-12 flex flex-col items-center justify-center"
              style={{ transform: 'rotateY(180deg)' }}
            >
              <p className="text-sm text-muted-foreground mb-4">Definição</p>
              <p className="text-2xl text-center">{card.definition}</p>
              <p className="text-sm text-muted-foreground mt-8">
                Clique para voltar ao termo
              </p>
            </div>
          </Card>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={handlePrevious}>
            Anterior
          </Button>
          <Button onClick={() => setFlipped(!flipped)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Virar Card
          </Button>
          <Button variant="outline" onClick={handleNext}>
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
