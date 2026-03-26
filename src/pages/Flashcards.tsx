// @ts-nocheck
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleNavigation } from '@/components/SimpleNavigation';
import { toast } from '@/hooks/use-toast';
import { RotateCcw, Play, MessageCircle, RefreshCw, Loader2 } from 'lucide-react';

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
  const [errorState, setErrorState] = useState<'none' | 'quota' | 'error'>('none');

  useEffect(() => {
    loadFlashcards();
  }, [materialId]);

  const loadFlashcards = async () => {
    setLoading(true);
    setErrorState('none');
    
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

      // Buscar resumo da IA se existir
      const { data: summaries } = await supabase
        .from('ai_summaries')
        .select('*')
        .eq('material_id', materialId)
        .order('created_at', { ascending: false })
        .limit(1);

      // Priorizar: resumo da IA > texto completo > descrição > título
      const content = summaries?.[0]?.content || material.file_url || material.description || material.title;

      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: { 
          content: content,
          title: material.title 
        }
      });

      if (error) {
        throw error;
      }
      
      // Verificar se houve erro de quota
      if (data?.error === 'quota_exceeded') {
        setErrorState('quota');
        setLoading(false);
        return;
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      setFlashcards(data.flashcards || []);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading flashcards:', error);
      
      // Verificar se é erro de quota pelo status
      if (error?.status === 429 || error?.message?.includes('quota')) {
        setErrorState('quota');
      } else {
        setErrorState('error');
        toast({ 
          title: 'Erro ao carregar flashcards', 
          description: 'Tente novamente em alguns segundos.',
          variant: 'destructive' 
        });
      }
      
      setLoading(false);
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
        <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[80vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Gerando flashcards com IA...</p>
          <p className="text-sm text-muted-foreground/60">Isso pode levar alguns segundos</p>
        </div>
      </div>
    );
  }

  // Estado de erro de quota
  if (errorState === 'quota') {
    return (
      <div className="min-h-screen bg-background">
        <SimpleNavigation />
        <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[80vh] gap-6">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">Limite temporário atingido</h2>
            <p className="text-muted-foreground max-w-md">
              O serviço de IA está com muitas requisições no momento. 
              Aguarde alguns segundos e tente novamente.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={loadFlashcards} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Estado de erro genérico
  if (errorState === 'error') {
    return (
      <div className="min-h-screen bg-background">
        <SimpleNavigation />
        <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[80vh] gap-6">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">Erro ao gerar flashcards</h2>
            <p className="text-muted-foreground max-w-md">
              Ocorreu um problema ao processar o material. Tente novamente.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={loadFlashcards} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SimpleNavigation />
        <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[80vh] gap-6">
          <p className="text-muted-foreground">Nenhum flashcard gerado.</p>
          <div className="flex gap-3">
            <Button onClick={loadFlashcards} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </div>
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
            <div className="absolute inset-0 backface-hidden bg-card rounded-lg p-12 flex flex-col items-center justify-center" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
              <p className="text-sm text-muted-foreground mb-4">Termo</p>
              <h2 className="text-4xl font-bold text-center">{card.term}</h2>
              <p className="text-sm text-muted-foreground mt-8">
                Clique para ver a definição
              </p>
            </div>
            
            <div 
              className="absolute inset-0 backface-hidden bg-card rounded-lg p-12 flex flex-col items-center justify-center"
              style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
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
          <Button
            variant="gamified"
            onClick={() => navigate('/?tab=ai-assistant', {
              state: {
                initialMessage: `Preciso de ajuda para entender melhor o conceito: "${card.term}". Você pode explicar de forma detalhada e com exemplos práticos?`
              }
            })}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Estudar com IA
          </Button>
        </div>
      </div>
    </div>
  );
}
