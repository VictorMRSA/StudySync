// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2, Sparkles, Upload, Save, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import DocumentUpload from './DocumentUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkdownContent } from './MarkdownContent';

const AISummaryGenerator: React.FC = () => {
  const [content, setContent] = useState('');
  const [summaryType, setSummaryType] = useState('resumo');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('');
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
  const [materialTitle, setMaterialTitle] = useState('');
  const [userClasses, setUserClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [savedSummaryId, setSavedSummaryId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<'like' | 'dislike' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUserClasses();
  }, []);

  const loadUserClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setUserClasses(data || []);
      if (data && data.length > 0) {
        setSelectedClassId(String(data[0].id));
      }
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  };

  const handleDocumentParsed = (parsedContent: string, fileName: string) => {
    setContent(parsedContent);
    setCurrentFileName(fileName);
    toast({
      title: 'Documento carregado',
      description: `${fileName} foi carregado com sucesso. Agora você pode gerar a análise.`
    });
  };

  const generateSummary = async (userFeedback?: string) => {
    if (!content.trim()) {
      toast({
        title: 'Erro',
        description: inputMode === 'upload' 
          ? 'Carregue um documento primeiro.' 
          : 'Digite o conteúdo que deseja analisar.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setResult('');

    try {
      const requestBody: any = {
        content: content.trim(),
        type: summaryType
      };

      if (userFeedback) {
        requestBody.feedback = userFeedback;
      }

      const { data, error } = await supabase.functions.invoke('gemini-summarize', {
        body: requestBody
      });

      if (error) throw error;

      if (data.success) {
        setResult(data.result);
        setFeedbackGiven(null);
        toast({
          title: 'Sucesso',
          description: 'Análise gerada com sucesso! Salve em Materiais para compartilhar.'
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

  const saveToMaterials = async () => {
    if (!result || !materialTitle.trim() || !selectedClassId) {
      toast({
        title: 'Erro',
        description: 'Preencha o título e selecione uma turma antes de salvar.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Create material (save content in both fields for Phase 2A)
      const { data: material, error: materialError } = await supabase
        .from('materials')
        .insert({
          class_id: parseInt(selectedClassId),
          title: materialTitle,
          description: `Resumo de IA gerado: ${summaryType}`,
          uploaded_by: user.id,
          file_type: currentFileName ? currentFileName.split('.').pop()?.toUpperCase() : 'TEXT',
          storage_path: 'ai-generated',
          file_name: currentFileName || 'Texto manual',
          file_url: content,
          extracted_text: content,
          status: 'approved'
        } as any)
        .select()
        .single();

      if (materialError) throw materialError;

      // Save AI summary
      const { data: summaryData, error: summaryError } = await (supabase
        .from('ai_summaries' as any)
        .insert({
          material_id: material.id,
          summary_type: summaryType,
          content: result,
          generated_by: user.id
        }) as any)
        .select()
        .single();

      if (summaryError) throw summaryError;

      setSavedSummaryId(String(summaryData.id));

      toast({
        title: 'Salvo com sucesso!',
        description: 'O resumo foi adicionado aos materiais da turma.'
      });

      clearAll();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o material. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handleFeedback = async (type: 'like' | 'dislike') => {
    setFeedbackGiven(type);
    
    try {
      if (savedSummaryId) {
        const feedbackText = type === 'like' 
          ? 'Análise aprovada pelo usuário' 
          : 'Usuário solicitou melhoria na análise';
        
        const { error } = await (supabase
          .from('ai_summaries' as any)
          .update({ user_feedback: feedbackText }) as any)
          .eq('id', savedSummaryId);

        if (error) throw error;
      }

      toast({
        title: type === 'like' ? '👍 Ótimo!' : '👎 Entendido',
        description: type === 'like' 
          ? 'Que bom que a análise foi útil!' 
          : 'Vou melhorar na próxima análise.'
      });

      // Se for dislike, refaz automaticamente considerando o feedback
      if (type === 'dislike') {
        setTimeout(() => {
          generateSummary('O usuário não gostou da análise anterior. Por favor, melhore fornecendo mais detalhes, sendo mais específico e focando nos aspectos mais importantes do conteúdo.');
        }, 1500);
      }
    } catch (error) {
      console.error('Erro ao salvar feedback:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o feedback',
        variant: 'destructive'
      });
    }
  };

  const clearAll = () => {
    setContent('');
    setResult('');
    setSummaryType('resumo');
    setCurrentFileName('');
    setMaterialTitle('');
    setFeedbackGiven(null);
    setSavedSummaryId(null);
  };

  return (
    <div className="space-y-6">
      {/* Input Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Gerador de Resumos e Análises IA
          </CardTitle>
          <div className="flex gap-2 pt-2">
            <Button
              variant={inputMode === 'upload' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMode('upload')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload de Arquivo
            </Button>
            <Button
              variant={inputMode === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInputMode('text')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Texto Manual
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Document Upload Section */}
      {inputMode === 'upload' && (
        <DocumentUpload 
          onDocumentParsed={handleDocumentParsed}
          isAnalyzing={isLoading}
        />
      )}

      {/* Manual Text Input Section */}
      {inputMode === 'text' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Entrada Manual de Texto
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* Analysis Configuration - Gestalt: Closure with clear boundaries */}
      <Card className="shadow-medium border-l-4 border-primary">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Configuração da Análise</CardTitle>
              {currentFileName && (
                <p className="text-sm text-muted-foreground mt-1">
                  Documento: <span className="font-medium">{currentFileName}</span>
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Gestalt: Proximity - Related controls grouped */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/30">
            <Label htmlFor="analysis-type" className="text-sm font-medium">Tipo de Análise:</Label>
            <Select value={summaryType} onValueChange={setSummaryType}>
              <SelectTrigger id="analysis-type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resumo">Resumo Geral</SelectItem>
                <SelectItem value="pontos-chave">Pontos-Chave</SelectItem>
                <SelectItem value="perguntas">Perguntas de Estudo</SelectItem>
                <SelectItem value="conceitos">Conceitos Principais</SelectItem>
                <SelectItem value="glossario">Glossário de Termos</SelectItem>
                <SelectItem value="mapa-mental">Mapa Mental (Estruturado)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Gestalt: Proximity - Action buttons grouped */}
          <div className="flex gap-3">
            <Button 
              onClick={() => generateSummary()} 
              disabled={!content.trim() || isLoading}
              className="flex-1"
              variant="gamified"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Gerar Análise
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={clearAll} size="lg">
              <RefreshCw className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {result && (
        <Card className="shadow-medium border-l-4 border-success">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Sparkles className="w-5 h-5 text-success" />
                </div>
                <CardTitle className="text-xl">Resultado da Análise</CardTitle>
              </div>
              
              {/* Gestalt: Proximity - Feedback buttons grouped with label */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium text-muted-foreground">Esta análise foi útil?</span>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleFeedback('like')}
                    variant={feedbackGiven === 'like' ? 'success' : 'outline'}
                    size="sm"
                    disabled={isLoading}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    onClick={() => handleFeedback('dislike')}
                    variant={feedbackGiven === 'dislike' ? 'destructive' : 'outline'}
                    size="sm"
                    disabled={isLoading}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[70dvh] md:max-h-[70vh] overflow-auto bg-muted/50 rounded-lg p-6 pr-6">
              <MarkdownContent content={result} />
            </div>

            {/* Save to Materials Section - Gestalt: Closure with clear grouping */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Save className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-lg">Salvar em Materiais</h4>
              </div>
              
              {/* Gestalt: Proximity - Form fields grouped */}
              <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="material-title">Título do Material</Label>
                  <Input
                    id="material-title"
                    placeholder="Ex: Resumo de Algoritmos - Aula 1"
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class-select">Turma</Label>
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger id="class-select">
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {userClasses.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={saveToMaterials} 
                className="w-full"
                variant="gamified"
                size="lg"
              >
                <Save className="h-5 w-5 mr-2" />
                Salvar nos Materiais
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AISummaryGenerator;
