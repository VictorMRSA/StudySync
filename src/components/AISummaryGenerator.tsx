import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Loader2, Sparkles, Upload, Save, MessageSquare, RefreshCw } from 'lucide-react';
import DocumentUpload from './DocumentUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
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
        setSelectedClassId(data[0].id);
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
        setShowFeedback(false);
        setFeedback('');
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

      // Create material (save original content in file_url)
      const { data: material, error: materialError } = await supabase
        .from('materials')
        .insert({
          class_id: selectedClassId,
          title: materialTitle,
          description: `Resumo de IA gerado: ${summaryType}`,
          uploaded_by: user.id,
          file_type: currentFileName ? currentFileName.split('.').pop()?.toUpperCase() : 'TEXT',
          file_name: currentFileName || 'Texto manual',
          file_url: content, // Save original parsed document content
          status: 'approved'
        })
        .select()
        .single();

      if (materialError) throw materialError;

      // Save AI summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('ai_summaries')
        .insert({
          material_id: material.id,
          summary_type: summaryType,
          content: result,
          generated_by: user.id
        })
        .select()
        .single();

      if (summaryError) throw summaryError;

      setSavedSummaryId(summaryData.id);

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

  const submitFeedback = async () => {
    if (!feedback.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, escreva seu feedback',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (savedSummaryId) {
        // Save feedback to database
        const { error } = await supabase
          .from('ai_summaries')
          .update({ user_feedback: feedback })
          .eq('id', savedSummaryId);

        if (error) throw error;
      }

      toast({
        title: 'Feedback enviado',
        description: 'Obrigado pelo seu feedback! Vou considerar na próxima análise.'
      });

      setShowFeedback(false);
    } catch (error) {
      console.error('Erro ao salvar feedback:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o feedback',
        variant: 'destructive'
      });
    }
  };

  const redoAnalysis = () => {
    if (feedback.trim()) {
      generateSummary(feedback);
    } else {
      generateSummary();
    }
  };

  const clearAll = () => {
    setContent('');
    setResult('');
    setSummaryType('resumo');
    setCurrentFileName('');
    setMaterialTitle('');
    setFeedback('');
    setShowFeedback(false);
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

      {/* Analysis Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuração da Análise</CardTitle>
          {currentFileName && (
            <p className="text-sm text-muted-foreground">
              Documento carregado: <span className="font-medium">{currentFileName}</span>
            </p>
          )}
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
                <SelectItem value="conceitos">Conceitos Principais</SelectItem>
                <SelectItem value="glossario">Glossário de Termos</SelectItem>
                <SelectItem value="mapa-mental">Mapa Mental (Estruturado)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => generateSummary()} 
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
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>

            {/* Feedback and Redo Analysis Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowFeedback(!showFeedback)}
                variant="outline"
                className="flex-1"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {showFeedback ? 'Cancelar Feedback' : 'Dar Feedback'}
              </Button>
              
              <Button 
                onClick={redoAnalysis}
                variant="outline"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Refazendo...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refazer Análise
                  </>
                )}
              </Button>
            </div>

            {showFeedback && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      O que você acha da análise? Como posso melhorar?
                    </label>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Ex: Gostaria de mais detalhes sobre..., Poderia focar menos em..., etc."
                      rows={4}
                    />
                  </div>
                  <Button 
                    onClick={submitFeedback}
                    className="w-full"
                  >
                    Enviar Feedback
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Save to Materials Section */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-semibold text-sm">Salvar em Materiais</h4>
              
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

              <Button 
                onClick={saveToMaterials} 
                className="w-full"
                variant="gamified"
              >
                <Save className="h-4 w-4 mr-2" />
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
