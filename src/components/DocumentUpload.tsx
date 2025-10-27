import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, File, Loader2, X, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import * as pdfjsLib from 'pdfjs-dist';

interface UploadedFile {
  file: File;
  id: string;
  parsed?: boolean;
  content?: string;
  error?: string;
}

interface DocumentUploadProps {
  onDocumentParsed: (content: string, fileName: string) => void;
  isAnalyzing?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onDocumentParsed, isAnalyzing }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState<string | null>(null);
  const { toast } = useToast();

  // Configure pdf.js worker
  React.useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }, []);

  const supportedFormats = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain',
    'audio/mpeg',
    'audio/wav'
  ];

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (file.type.includes('presentation')) return <FileText className="h-5 w-5 text-orange-500" />;
    if (file.type.includes('word')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (file.type.includes('sheet')) return <FileText className="h-5 w-5 text-green-500" />;
    if (file.type.includes('audio')) return <FileText className="h-5 w-5 text-purple-500" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (!supportedFormats.includes(file.type) && !file.name.endsWith('.txt')) {
        toast({
          title: 'Formato não suportado',
          description: `O arquivo ${file.name} não é suportado. Use PDF, PPT, Word, Excel, TXT ou MP3.`,
          variant: 'destructive'
        });
        return false;
      }
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        toast({
          title: 'Arquivo muito grande',
          description: `O arquivo ${file.name} excede o limite de 20MB.`,
          variant: 'destructive'
        });
        return false;
      }
      return true;
    });

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      id: `${file.name}-${Date.now()}`
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Parse files automatically
    for (const uploadedFile of newFiles) {
      await parseDocument(uploadedFile);
    }
  }, [toast]);

  const parsePDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    const numPages = Math.min(pdf.numPages, 50); // Limit to first 50 pages
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    if (pdf.numPages > 50) {
      fullText += `\n\n[Nota: Este PDF tem ${pdf.numPages} páginas. Apenas as primeiras 50 páginas foram processadas.]`;
    }
    
    return fullText.trim();
  };

  const parseDocument = async (uploadedFile: UploadedFile) => {
    setParsing(uploadedFile.id);
    
    try {
      // For text files, read directly
      if (uploadedFile.file.type === 'text/plain' || uploadedFile.file.name.endsWith('.txt')) {
        const content = await uploadedFile.file.text();
        
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, parsed: true, content }
            : f
        ));
        
        toast({
          title: 'Documento carregado',
          description: `${uploadedFile.file.name} foi processado com sucesso.`
        });
      } 
      // For PDF files, parse with pdf.js in the client
      else if (uploadedFile.file.type === 'application/pdf' || uploadedFile.file.name.endsWith('.pdf')) {
        toast({
          title: 'Processando PDF',
          description: 'Extraindo texto do documento PDF. Isso pode levar alguns segundos...'
        });
        
        const content = await parsePDF(uploadedFile.file);
        
        if (!content || content.length < 10) {
          throw new Error('O PDF não contém texto extraível ou está protegido.');
        }
        
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, parsed: true, content }
            : f
        ));
        
        toast({
          title: 'PDF processado',
          description: `${uploadedFile.file.name} foi processado com sucesso.`
        });
      }
      // For other binary files (Word, PowerPoint), use edge function
      else {
        const formData = new FormData();
        formData.append('file', uploadedFile.file);
        
        const { data, error } = await supabase.functions.invoke('parse-document', {
          body: formData
        });
        
        if (error) throw error;
        
        if (data.success && data.content) {
          setUploadedFiles(prev => prev.map(f => 
            f.id === uploadedFile.id 
              ? { ...f, parsed: true, content: data.content }
              : f
          ));
          
          toast({
            title: 'Documento processado',
            description: `${uploadedFile.file.name} foi processado com sucesso.`
          });
        } else {
          throw new Error(data.error || 'Erro ao processar documento');
        }
      }
    } catch (error) {
      console.error('Erro ao processar documento:', error);
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, parsed: false, error: error instanceof Error ? error.message : 'Erro ao processar o documento' }
          : f
      ));
      
      toast({
        title: 'Erro no processamento',
        description: error instanceof Error ? error.message : `Não foi possível processar ${uploadedFile.file.name}.`,
        variant: 'destructive'
      });
    } finally {
      setParsing(null);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const analyzeDocument = (uploadedFile: UploadedFile) => {
    if (uploadedFile.content) {
      onDocumentParsed(uploadedFile.content, uploadedFile.file.name);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              Arraste e solte seus documentos aqui
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Ou clique para selecionar arquivos
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt,.mp3,.wav"
            />
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Selecionar Arquivos
              </label>
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Suporta: PDF, PPT, Word, Excel, TXT, MP3 (até 20MB cada)
            </p>
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documentos Carregados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((uploadedFile) => (
                <div 
                  key={uploadedFile.id} 
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  {getFileIcon(uploadedFile.file)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{uploadedFile.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {parsing === uploadedFile.id ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processando...
                      </div>
                    ) : uploadedFile.parsed ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-600">✓ Processado</span>
                        <Button
                          size="sm"
                          onClick={() => analyzeDocument(uploadedFile)}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Analisando...
                            </>
                          ) : (
                            'Analisar'
                          )}
                        </Button>
                      </div>
                    ) : uploadedFile.error ? (
                      <span className="text-sm text-red-600">✗ Erro</span>
                    ) : null}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadedFile.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentUpload;