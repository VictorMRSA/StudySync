import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { SimpleNavigation } from '@/components/SimpleNavigation';
import { AlertCircle, TrendingDown, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Difficulty {
  topic: string;
  incorrectCount: number;
  totalCount: number;
  errorRate: number;
}

export default function DifficultiesAnalysis() {
  const navigate = useNavigate();
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDifficulties();
  }, []);

  const loadDifficulties = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar todas as respostas do usuário
      const { data: results, error } = await supabase
        .from('quiz_question_results')
        .select(`
          question_text,
          is_correct,
          quiz_sessions!inner(user_id)
        `)
        .eq('quiz_sessions.user_id', user.id);

      if (error) throw error;

      // Análise de padrões (exemplo simples por palavras-chave)
      const topicMap = new Map<string, { incorrect: number; total: number }>();

      results?.forEach(result => {
        // Extrair tópico da pergunta (palavras-chave)
        const keywords = extractKeywords(result.question_text);
        
        keywords.forEach(keyword => {
          const current = topicMap.get(keyword) || { incorrect: 0, total: 0 };
          current.total += 1;
          if (!result.is_correct) {
            current.incorrect += 1;
          }
          topicMap.set(keyword, current);
        });
      });

      // Converter para array e calcular taxa de erro
      const difficultiesData: Difficulty[] = Array.from(topicMap.entries())
        .map(([topic, stats]) => ({
          topic,
          incorrectCount: stats.incorrect,
          totalCount: stats.total,
          errorRate: (stats.incorrect / stats.total) * 100
        }))
        .filter(d => d.incorrectCount >= 2) // Mostrar apenas se errou 2+ vezes
        .sort((a, b) => b.errorRate - a.errorRate)
        .slice(0, 10); // Top 10 dificuldades

      setDifficulties(difficultiesData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading difficulties:', error);
      setLoading(false);
    }
  };

  const extractKeywords = (question: string): string[] => {
    // Exemplo simples: extrair substantivos importantes
    const keywords: string[] = [];
    const words = question.toLowerCase().split(/\s+/);
    
    // Lista expandida de palavras-chave comuns por matéria
    const mathKeywords = ['divisão', 'multiplicação', 'fração', 'equação', 'soma', 'subtração', 'potência', 'raiz', 'porcentagem', 'geometria', 'álgebra', 'trigonometria'];
    const bioKeywords = ['célula', 'dna', 'rna', 'genótipo', 'fenótipo', 'mitose', 'meiose', 'gene', 'cromossomo', 'proteína', 'epigenética', 'genoma'];
    const physicsKeywords = ['força', 'energia', 'velocidade', 'aceleração', 'massa', 'movimento', 'atrito', 'gravidade'];
    const chemKeywords = ['átomo', 'molécula', 'ligação', 'reação', 'elemento', 'composto', 'ácido', 'base'];
    const portugueseKeywords = ['verbo', 'substantivo', 'adjetivo', 'oração', 'concordância', 'crase', 'pontuação'];
    const historyKeywords = ['guerra', 'revolução', 'império', 'república', 'colônia', 'independência'];
    
    const allKeywords = [...mathKeywords, ...bioKeywords, ...physicsKeywords, ...chemKeywords, ...portugueseKeywords, ...historyKeywords];
    
    allKeywords.forEach(keyword => {
      if (words.some(word => word.includes(keyword))) {
        keywords.push(keyword);
      }
    });
    
    // Se não encontrou palavras-chave específicas, tenta extrair substantivos principais
    if (keywords.length === 0) {
      const stopWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'da', 'do', 'em', 'na', 'no', 'para', 'com', 'por', 'qual', 'que', 'como', 'quando', 'onde', 'é', 'são'];
      const potentialKeywords = words.filter(word => 
        word.length > 4 && !stopWords.includes(word)
      );
      if (potentialKeywords.length > 0) {
        keywords.push(potentialKeywords[0]);
      }
    }
    
    return keywords;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SimpleNavigation />
        <div className="container mx-auto p-6">
          <p className="text-muted-foreground">Carregando análise...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SimpleNavigation />
      
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <TrendingDown className="h-8 w-8 text-warning" />
            Suas Prováveis Dificuldades
          </h1>
          <p className="text-muted-foreground">
            Baseado nas suas respostas nos quizzes, identificamos os seguintes tópicos que podem precisar de mais atenção.
          </p>
        </div>

        {difficulties.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhuma dificuldade identificada ainda. Continue fazendo quizzes para obter uma análise personalizada!
            </p>
            <Button onClick={() => navigate('/')}>
              Voltar para Dashboard
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {difficulties.map((difficulty, index) => (
              <Card 
                key={difficulty.topic} 
                className="p-6 border-l-4 border-warning hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-warning" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold capitalize">
                        {difficulty.topic}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        #{index + 1}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-3">
                      Você errou <span className="font-bold text-destructive">
                        {difficulty.incorrectCount} de {difficulty.totalCount}
                      </span> perguntas sobre este tópico
                    </p>
                    <div className="bg-muted rounded-full h-3 overflow-hidden mb-2">
                      <div 
                        className="bg-gradient-to-r from-warning to-destructive h-full transition-all duration-500"
                        style={{ width: `${difficulty.errorRate}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-warning">
                        Taxa de erro: {difficulty.errorRate.toFixed(1)}%
                      </p>
                      {difficulty.errorRate >= 50 && (
                        <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                          Atenção especial
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => navigate('/ai-assistant', { 
                        state: { 
                          focusTopic: difficulty.topic,
                          errorRate: difficulty.errorRate 
                        }
                      })}
                      variant="default"
                      className="w-full"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Estudar "{difficulty.topic}" com IA
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            
            <div className="mt-8 text-center">
              <Button onClick={() => navigate('/')} size="lg">
                Voltar para Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
