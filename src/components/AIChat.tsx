import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  BookOpen, 
  Globe, 
  FileText, 
  CheckSquare, 
  Square,
  Sparkles,
  Info
} from 'lucide-react';
import { MarkdownContentCompact } from '@/components/MarkdownContentCompact';
import { useLocation } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'model';
  parts: { text: string }[];
  timestamp: Date;
  mode?: 'general' | 'sources';
  sourcesUsed?: string[];
}

interface MaterialSource {
  id: string;
  title: string;
  content: string;
  file_type?: string;
}

interface AIChatProps {
  initialMessage?: string;
  initialMaterialId?: string;
}

const AIChat: React.FC<AIChatProps> = ({ initialMessage, initialMaterialId }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const effectiveMaterialId = initialMaterialId || (location.state as any)?.materialId || searchParams.get('materialId') || undefined;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'general' | 'sources'>(() => {
    return effectiveMaterialId ? 'sources' : 'general';
  });
  const [materials, setMaterials] = useState<MaterialSource[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(() => {
    return effectiveMaterialId ? new Set([effectiveMaterialId]) : new Set();
  });
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [showSourcesPanel, setShowSourcesPanel] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Se effectiveMaterialId mudar, garante a ativação do modo fontes e do documento
  useEffect(() => {
    if (effectiveMaterialId) {
      setSelectedSourceIds(new Set([effectiveMaterialId]));
      setChatMode('sources');
    }
  }, [effectiveMaterialId]);

  // Carrega os materiais disponíveis para o usuário usar como fontes
  useEffect(() => {
    loadUserMaterials();
  }, [effectiveMaterialId]);

  const loadUserMaterials = async () => {
    setLoadingMaterials(true);
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('id, title, extracted_text, file_type, description')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const validMaterials: MaterialSource[] = (data || [])
        .map(m => ({
          id: m.id,
          title: m.title,
          content: m.extracted_text || m.description || m.title || '',
          file_type: m.file_type || 'DOC'
        }))
        .filter(m => m.content && m.content.trim() && m.content !== 'ai-generated');

      // Se temos um effectiveMaterialId que porventura não passou no filtro, inclui-o para garantir o RAG
      if (effectiveMaterialId) {
        const found = (data || []).find(m => m.id === effectiveMaterialId);
        if (found && !validMaterials.some(m => m.id === effectiveMaterialId)) {
          validMaterials.unshift({
            id: found.id,
            title: found.title,
            content: found.extracted_text || found.description || found.title || 'Conteúdo do documento',
            file_type: found.file_type || 'DOC'
          });
        }
      }

      setMaterials(validMaterials);

      // Se passou um material inicial (ex: vindo de um clique em Materiais)
      if (effectiveMaterialId) {
        setSelectedSourceIds(new Set([effectiveMaterialId]));
        setChatMode('sources');
        const active = validMaterials.find(m => m.id === effectiveMaterialId);
        if (active) {
          toast({
            title: 'Fonte ativada no Chatbot',
            description: `Conversando com foco no material "${active.title}".`
          });
        }
      }
    } catch (err) {
      console.error('Erro ao carregar materiais para fontes:', err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const toggleSource = (id: string) => {
    setSelectedSourceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllSources = () => {
    if (selectedSourceIds.size === materials.length) {
      setSelectedSourceIds(new Set());
    } else {
      setSelectedSourceIds(new Set(materials.map(m => m.id)));
    }
  };

  useEffect(() => {
    if (initialMessage && !isLoading) {
      setMessages([]);
      setInputMessage(initialMessage);
      
      const timer = setTimeout(() => {
        sendMessageWithText(initialMessage);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialMessage]);

  const sendMessageWithText = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    if (chatMode === 'sources' && selectedSourceIds.size === 0) {
      toast({
        title: 'Nenhuma fonte selecionada',
        description: 'Selecione pelo menos um documento para usar o modo "Minhas Fontes" ou mude para o modo "Geral".',
        variant: 'destructive'
      });
      setShowSourcesPanel(true);
      return;
    }

    const activeSources = materials
      .filter(m => selectedSourceIds.has(m.id))
      .map(m => ({ title: m.title, content: m.content }));

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      parts: [{ text: messageText }],
      timestamp: new Date(),
      mode: chatMode,
      sourcesUsed: chatMode === 'sources' ? activeSources.map(s => s.title) : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    const initialBotMessage: Message = {
      id: botMessageId,
      role: 'model',
      parts: [{ text: '' }],
      timestamp: new Date(),
      mode: chatMode,
      sourcesUsed: chatMode === 'sources' ? activeSources.map(s => s.title) : undefined
    };
    
    setMessages(prev => [...prev, initialBotMessage]);

    try {
      const data = await api.chat(
        messageText, 
        messages.map(msg => ({
          role: msg.role,
          parts: msg.parts
        })),
        // onChunk: preenche a mensagem do bot em tempo real
        (chunk: string) => {
          setMessages(prev => prev.map(msg => {
            if (msg.id === botMessageId) {
              return {
                ...msg,
                parts: [{ text: msg.parts[0].text + chunk }]
              };
            }
            return msg;
          }));
        },
        chatMode,
        activeSources
      );

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido');
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem. Verifique a conexão com o servidor.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    await sendMessageWithText(inputMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <Card className="h-[800px] flex flex-col relative overflow-hidden">
      {/* Header com Seletor de Modo (Estilo NotebookLM) */}
      <CardHeader className="pb-3 border-b space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5 text-primary" />
            Assistente Educacional IA
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat} className="text-xs h-8">
                Limpar Conversa
              </Button>
            )}
          </div>
        </div>

        {/* Barra de Seleção de Modo */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <div className="inline-flex items-center bg-muted p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => {
                setChatMode('general');
                setShowSourcesPanel(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                chatMode === 'general'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Conhecimento Geral
            </button>
            <button
              type="button"
              onClick={() => {
                setChatMode('sources');
                if (selectedSourceIds.size === 0 && materials.length > 0) {
                  setShowSourcesPanel(true);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                chatMode === 'sources'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-accent" />
              Minhas Fontes (RAG)
            </button>
          </div>

          {/* Botão de Abrir Gaveta de Fontes quando estiver no modo Sources */}
          {chatMode === 'sources' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSourcesPanel(prev => !prev)}
              className="text-xs h-8 gap-1.5 bg-accent/5 border-accent/30 hover:border-accent"
            >
              <FileText className="w-3.5 h-3.5 text-accent" />
              <span>
                {selectedSourceIds.size === 0
                  ? 'Escolher Fontes'
                  : `${selectedSourceIds.size} ${selectedSourceIds.size === 1 ? 'fonte ativa' : 'fontes ativas'}`}
              </span>
            </Button>
          )}
        </div>

        {/* Indicador de fontes ativas no modo Sources */}
        {chatMode === 'sources' && selectedSourceIds.size > 0 && !showSourcesPanel && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-muted-foreground">Fontes em foco:</span>
            {materials
              .filter(m => selectedSourceIds.has(m.id))
              .map(m => (
                <Badge key={m.id} variant="secondary" className="text-[10px] py-0 px-2 bg-accent/10 text-accent border border-accent/20">
                  {m.title}
                </Badge>
              ))}
          </div>
        )}
      </CardHeader>
      
      {/* Gaveta / Painel Retrátil de Seleção de Fontes */}
      {showSourcesPanel && chatMode === 'sources' && (
        <div className="bg-muted/40 border-b p-3 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold">Selecione os materiais que a IA deve ler:</span>
            </div>
            {materials.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllSources}
                className="text-[11px] h-6 px-2 text-primary"
              >
                {selectedSourceIds.size === materials.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </Button>
            )}
          </div>

          {loadingMaterials ? (
            <div className="text-xs text-muted-foreground flex items-center gap-2 py-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Carregando seus materiais...
            </div>
          ) : materials.length === 0 ? (
            <div className="text-xs text-muted-foreground py-2 bg-background p-3 rounded border">
              Você ainda não possui materiais com texto salvos. Faça upload de um PDF ou texto na aba <strong>Resumos e Análises</strong> e salve-o em Materiais!
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {materials.map((material) => (
                <label
                  key={material.id}
                  className={`flex items-center gap-2.5 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                    selectedSourceIds.has(material.id)
                      ? 'bg-accent/10 border-accent/40 font-medium'
                      : 'bg-background hover:bg-muted/50 border-muted'
                  }`}
                >
                  <Checkbox
                    checked={selectedSourceIds.has(material.id)}
                    onCheckedChange={() => toggleSource(material.id)}
                  />
                  <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1">{material.title}</span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                    {material.file_type}
                  </Badge>
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button
              size="sm"
              variant="default"
              onClick={() => setShowSourcesPanel(false)}
              className="text-xs h-7"
            >
              Concluir Seleção ({selectedSourceIds.size})
            </Button>
          </div>
        </div>
      )}
      
      <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4 overflow-auto">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium text-foreground">
                  {chatMode === 'sources'
                    ? 'Modo Minhas Fontes Ativo (NotebookLM) 📚'
                    : 'Olá! Sou seu assistente educacional.'}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  {chatMode === 'sources'
                    ? 'Pergunte qualquer coisa sobre os materiais selecionados. Responderei citando exatamente os trechos dos seus documentos!'
                    : 'Como posso ajudá-lo com seus estudos hoje? Faça perguntas livres sobre qualquer matéria.'}
                </p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2.5 overflow-hidden break-words ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted/70 border border-muted'
                  }`}
                >
                  {/* Badge de contexto no topo da mensagem */}
                  {message.mode === 'sources' && message.role === 'model' && (
                    <div className="flex items-center gap-1 text-[10px] text-accent font-medium mb-1.5 border-b border-accent/20 pb-1">
                      <BookOpen className="w-3 h-3" />
                      <span>Embasado em {message.sourcesUsed?.length || 1} {message.sourcesUsed?.length === 1 ? 'fonte' : 'fontes'}</span>
                    </div>
                  )}

                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{message.parts[0].text}</p>
                  ) : (
                    <MarkdownContentCompact content={message.parts[0].text} />
                  )}
                  <span className="text-[10px] opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>
                      {chatMode === 'sources' ? 'Consultando suas fontes...' : 'Digitando resposta...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="flex gap-2 mt-4 pt-2 border-t">
          <Input
            placeholder={
              chatMode === 'sources'
                ? selectedSourceIds.size === 0
                  ? 'Selecione fontes acima para perguntar...'
                  : `Pergunte sobre as ${selectedSourceIds.size} fontes selecionadas...`
                : 'Digite sua dúvida de estudos...'
            }
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChat;