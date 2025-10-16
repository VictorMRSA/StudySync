import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleNavigation } from '@/components/SimpleNavigation';
import { useGamification } from '@/hooks/useGamification';
import { toast } from '@/hooks/use-toast';
import { Timer, Trophy } from 'lucide-react';

interface Flashcard {
  term: string;
  definition: string;
}

interface MemoryCard {
  id: string;
  content: string;
  type: 'term' | 'definition';
  pairId: number;
  flipped: boolean;
  matched: boolean;
}

export default function MemoryGame() {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const { addExperience } = useGamification();
  
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    loadGame();
  }, [materialId]);

  useEffect(() => {
    if (!gameStarted || gameFinished) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameFinished]);

  const loadGame = async () => {
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

      // Buscar resumos do material para mais contexto
      const { data: summaries } = await supabase
        .from('ai_summaries')
        .select('content')
        .eq('material_id', materialId)
        .order('created_at', { ascending: false })
        .limit(1);

      const content = summaries?.[0]?.content || material.description || material.title;

      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: { 
          content,
          title: material.title 
        }
      });

      if (error) throw error;
      
      const flashcards: Flashcard[] = data.flashcards;
      const memoryCards: MemoryCard[] = [];

      flashcards.forEach((card, index) => {
        memoryCards.push({
          id: `term-${index}`,
          content: card.term,
          type: 'term',
          pairId: index,
          flipped: false,
          matched: false,
        });
        memoryCards.push({
          id: `def-${index}`,
          content: card.definition,
          type: 'definition',
          pairId: index,
          flipped: false,
          matched: false,
        });
      });

      // Embaralhar
      const shuffled = memoryCards.sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setLoading(false);
    } catch (error) {
      console.error('Error loading memory game:', error);
      toast({ title: 'Erro ao carregar jogo', variant: 'destructive' });
      navigate(-1);
    }
  };

  const handleCardClick = (cardId: string) => {
    if (!gameStarted) setGameStarted(true);
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched || flippedCards.length >= 2) return;

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, flipped: true } : c
    ));

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      
      const [card1Id, card2Id] = newFlipped;
      const card1 = cards.find(c => c.id === card1Id);
      const card2 = cards.find(c => c.id === card2Id);

      if (card1 && card2 && card1.pairId === card2.pairId) {
        // Match!
        setCards(prev => prev.map(c => 
          c.id === card1Id || c.id === card2Id ? { ...c, matched: true } : c
        ));
        setMatchedPairs(prev => prev + 1);
        setFlippedCards([]);

        addExperience(5, 'Par encontrado no jogo da memória!');

        // Verificar se terminou
        if (matchedPairs + 1 === cards.length / 2) {
          finishGame();
        }
      } else {
        // Não é par
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === card1Id || c.id === card2Id ? { ...c, flipped: false } : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const finishGame = () => {
    setGameFinished(true);
    
    if (timeElapsed < 90) {
      addExperience(20, 'Bônus: Jogo da memória em menos de 90s!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SimpleNavigation />
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <p className="text-muted-foreground">Preparando jogo...</p>
        </div>
      </div>
    );
  }

  if (gameFinished) {
    return (
      <div className="min-h-screen bg-background">
        <SimpleNavigation />
        <div className="container mx-auto p-6 max-w-2xl">
          <Card className="border-l-4 border-success shadow-soft p-8 text-center">
            <Trophy className="h-16 w-16 text-success mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-4">Parabéns!</h1>
            <div className="space-y-2 mb-6">
              <p className="text-xl">Tempo: {timeElapsed}s</p>
              <p className="text-xl">Movimentos: {moves}</p>
              <p className="text-muted-foreground">
                Você ganhou {matchedPairs * 5 + (timeElapsed < 90 ? 20 : 0)} XP!
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate(-1)}>Voltar</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Jogar Novamente
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SimpleNavigation />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold">Jogo da Memória</h1>
          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              <span className="text-xl font-bold">{timeElapsed}s</span>
            </div>
            <span className="text-muted-foreground">
              Movimentos: {moves}
            </span>
            <span className="text-muted-foreground">
              Pares: {matchedPairs}/{cards.length / 2}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {cards.map(card => (
            <Card
              key={card.id}
              className={`border-l-4 shadow-soft cursor-pointer transition-all min-h-[150px] flex items-center justify-center p-4 ${
                card.matched 
                  ? 'border-success bg-success/10' 
                  : card.flipped 
                  ? 'border-primary bg-primary/10' 
                  : 'border-muted hover:shadow-medium'
              }`}
              onClick={() => handleCardClick(card.id)}
            >
              {card.flipped || card.matched ? (
                <p className="text-center text-sm font-medium">
                  {card.content}
                </p>
              ) : (
                <div className="text-4xl">🎴</div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
