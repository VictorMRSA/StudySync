// @ts-nocheck
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SimpleNavigation } from '@/components/SimpleNavigation';
import { useGamification } from '@/hooks/useGamification';
import { toast } from '@/hooks/use-toast';
import { Timer, CheckCircle, XCircle } from 'lucide-react';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

export default function Quiz() {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const { addExperience, awardBadge } = useGamification();
  
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [quizFinished, setQuizFinished] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<Array<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>>([]);

  useEffect(() => {
    loadQuiz();
  }, [materialId]);

  useEffect(() => {
    if (loading || quizFinished) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, quizFinished]);

  const loadQuiz = async () => {
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

      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { 
          content,
          title: material.title 
        }
      });

      if (error) throw error;
      
      setQuestions(data.questions);
      setLoading(false);
    } catch (error) {
      console.error('Error loading quiz:', error);
      toast({ title: 'Erro ao carregar quiz', variant: 'destructive' });
      navigate(-1);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(optionIndex);
    const question = questions[currentQuestion];
    const isCorrect = optionIndex === question.correctAnswer;
    
    setAnswers(prev => [...prev, isCorrect]);
    
    // Armazenar resposta detalhada para análise de dificuldades
    setDetailedAnswers(prev => [...prev, {
      question: question.question,
      userAnswer: question.options[optionIndex],
      correctAnswer: question.options[question.correctAnswer],
      isCorrect
    }]);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        finishQuiz();
      }
    }, 1500);
  };

  const finishQuiz = async () => {
    setQuizFinished(true);
    const finalScore = answers.filter(a => a).length;
    const xpEarned = finalScore * 10;
    const bonus = finalScore === questions.length ? 50 : 0;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 1. Salvar sessão do quiz
        const { data: session, error: sessionError } = await supabase
          .from('quiz_sessions')
          .insert({
            user_id: user.id,
            material_id: materialId,
            score: finalScore,
            total_questions: questions.length,
            time_taken_seconds: 60 - timeLeft
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        // 2. Salvar resultados detalhados das perguntas
        if (session && detailedAnswers.length > 0) {
          const questionResults = detailedAnswers.map(answer => ({
            quiz_session_id: session.id,
            question_text: answer.question,
            user_answer: answer.userAnswer,
            correct_answer: answer.correctAnswer,
            is_correct: answer.isCorrect
          }));

          await supabase
            .from('quiz_question_results')
            .insert(questionResults);
        }

        // 3. XP e badges
        await addExperience(xpEarned + bonus, `Quiz completo: ${finalScore}/${questions.length}`);

        if (finalScore === questions.length) {
          await awardBadge('Mestre do Quiz');
        }
      }
    } catch (error) {
      console.error('Error saving quiz:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SimpleNavigation />
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[80vh]">
          <p className="text-muted-foreground">Carregando quiz...</p>
        </div>
      </div>
    );
  }

  if (quizFinished) {
    const finalScore = answers.filter(a => a).length;
    const percentage = (finalScore / questions.length) * 100;

    return (
      <div className="min-h-screen bg-background">
        <SimpleNavigation />
        <div className="container mx-auto p-6 max-w-2xl">
          <Card className="border-l-4 border-primary shadow-soft p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Quiz Concluído!</h1>
            <div className="text-6xl font-bold text-primary mb-4">
              {finalScore}/{questions.length}
            </div>
            <Progress value={percentage} className="mb-6" />
            <p className="text-muted-foreground mb-6">
              Você ganhou {finalScore * 10 + (finalScore === questions.length ? 50 : 0)} XP!
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate(-1)}>Voltar</Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refazer Quiz
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <SimpleNavigation />
      
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-warning" />
            <span className="text-2xl font-bold text-warning">{timeLeft}s</span>
          </div>
          <span className="text-muted-foreground">
            Questão {currentQuestion + 1} de {questions.length}
          </span>
        </div>

        <Progress value={progress} className="mb-6" />

        <Card className="border-l-4 border-primary shadow-soft p-8">
          <h2 className="text-2xl font-bold mb-6">{question.question}</h2>

          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === question.correctAnswer;
              const showResult = selectedAnswer !== null;

              let variant: "default" | "outline" | "destructive" | "secondary" = "outline";
              let icon = null;

              if (showResult) {
                if (isCorrect) {
                  variant = "default";
                  icon = <CheckCircle className="h-5 w-5 text-success" />;
                } else if (isSelected) {
                  variant = "destructive";
                  icon = <XCircle className="h-5 w-5" />;
                }
              }

              return (
                <Button
                  key={index}
                  variant={variant}
                  className={`w-full justify-start text-left h-auto p-4 ${
                    showResult && isCorrect ? 'border-success border-2' : ''
                  }`}
                  onClick={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                >
                  <span className="flex-1">{option}</span>
                  {icon}
                </Button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
