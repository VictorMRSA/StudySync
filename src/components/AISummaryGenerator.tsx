import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2, Sparkles } from 'lucide-react';

const AISummaryGenerator: React.FC = () => {
  const [content, setContent] = useState('');
  const [summaryType, setSummaryType] = useState('resumo');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateSummary = async () => {
    if (!content.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite o conteúdo que deseja analisar.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setResult('');

    try {
      const { data, error } = await supabase.functions.invoke('gemini-summarize', {
        body: {
          content: content.trim(),
          type: summaryType
        }
      });

      if (error) throw error;

      if (data.success) {
        setResult(data.result);
        toast({
          title: 'Sucesso',
          description: 'Análise gerada com sucesso!'
        });
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar a análise. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setContent('');
    setResult('');
    setSummaryType('resumo');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Gerador de Resumos e Análises IA
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Análise:</label>
            <Select value={summaryType} onValueChange={setSummaryType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resumo">Resumo Geral</SelectItem>
                <SelectItem value="pontos-chave">Pontos-Chave</SelectItem>
                <SelectItem value="perguntas">Perguntas de Estudo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Conteúdo para Analisar:</label>
            <Textarea
              placeholder="Cole aqui o texto, anotações ou material que deseja analisar..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="resize-none"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={generateSummary} 
              disabled={!content.trim() || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Análise
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={clearAll}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resultado da Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AISummaryGenerator;