import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import {
  buildCatalogEntries,
  groupByClass,
  needsIndexing,
  resolveStudySet,
  stripStudySet,
  type CatalogMaterialRow,
} from '@/lib/catalog';
import { indexMaterial } from '@/lib/catalogIndexer';
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
  Info,
  Library,
  RefreshCw
} from 'lucide-react';
import { MarkdownContentCompact } from '@/components/MarkdownContentCompact';
import { useLocation } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'model';
  parts: { text: string }[];
  timestamp: Date;
  mode?: 'general' | 'sources' | 'library';
  sourcesUsed?: string[];
  studySetIds?: string[];
}

interface MaterialSource {
  id: string;
  title: string;
  content: string;
  file_type?: string;
  class_name?: string | null;
}

// Acima disso o modo SyncDocs (texto completo) tende a ficar lento/truncado
const LARGE_CONTEXT_CHARS = 150_000;

// Armazenamento temporário do histórico (retenção de 1 hora)
const CHAT_STORAGE_KEY = 'studyflash_ai_chat_session';
const CHAT_STORAGE_TTL_MS = 60 * 60 * 1000; // 1 hora em milissegundos

interface SavedChatSession {
  messages: Array<Omit<Message, 'timestamp'> & { timestamp: string }>;
  savedAt: number;
  chatMode?: 'general' | 'sources' | 'library';
  selectedSourceIds?: string[];
}

function getSavedChatSession(): {
  messages: Message[];
  chatMode?: 'general' | 'sources' | 'library';
  selectedSourceIds?: string[];
} {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return { messages: [] };

    const parsed: SavedChatSession = JSON.parse(raw);
    const now = Date.now();

    // Se passou mais de 1 hora desde a última mensagem / interação, descarta
    if (!parsed.savedAt || now - parsed.savedAt > CHAT_STORAGE_TTL_MS) {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      return { messages: [] };
    }

    if (Array.isArray(parsed.messages)) {
      const restored: Message[] = parsed.messages
        .filter(m => m && m.parts && m.parts.length > 0 && m.parts[0]?.text)
        .map(m => ({
          ...m,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
        }));

      return {
        messages: restored,
        chatMode: parsed.chatMode,
        selectedSourceIds: parsed.selectedSourceIds,
      };
    }
  } catch (err) {
    console.warn('Erro ao carregar histórico temporário do chat:', err);
  }
  return { messages: [] };
}

// Remove o bloco <studyset> (inclusive incompleto durante o streaming) do texto exibido
const displayText = (text: string) => stripStudySet(text).replace(/<studyset[\s\S]*$/i, '').trim();

interface AIChatProps {
  initialMessage?: string;
  initialMaterialId?: string;
}

const AIChat: React.FC<AIChatProps> = ({ initialMessage, initialMaterialId }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const effectiveMaterialId = initialMaterialId || (location.state as any)?.materialId || searchParams.get('materialId') || undefined;

  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialMessage) return [];
    return getSavedChatSession().messages;
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'general' | 'sources' | 'library'>(() => {
    if (effectiveMaterialId) return 'sources';
    if (initialMessage) return 'general';
    return getSavedChatSession().chatMode || 'general';
  });
  const [materials, setMaterials] = useState<MaterialSource[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(() => {
    if (effectiveMaterialId) return new Set([effectiveMaterialId]);
    const savedIds = getSavedChatSession().selectedSourceIds;
    return savedIds && savedIds.length > 0 ? new Set(savedIds) : new Set();
  });
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [catalogRows, setCatalogRows] = useState<CatalogMaterialRow[]>([]);
  const [indexing, setIndexing] = useState<{ done: number; total: number } | null>(null);
  const refToIdRef = useRef<Record<string, string>>({});
  const [showSourcesPanel, setShowSourcesPanel] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Salva o histórico no localStorage temporariamente (TTL de 1 hora)
  useEffect(() => {
    if (isLoading) return;

    if (messages.length === 0) {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      return;
    }

    try {
      const payload: SavedChatSession = {
        messages: messages.map(m => ({
          ...m,
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : new Date().toISOString(),
        })),
        savedAt: Date.now(),
        chatMode,
        selectedSourceIds: Array.from(selectedSourceIds),
      };
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('Falha ao persistir histórico do chat no localStorage:', err);
    }
  }, [messages, isLoading, chatMode, selectedSourceIds]);

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
      // Tenta com os campos da Biblioteca; se a migração ainda não foi aplicada, cai no select antigo
      let rows: any[] = [];
      const full = await supabase
        .from('materials')
        .select('id, title, extracted_text, file_type, description, class_id, created_at, subject, catalog_summary, topics, catalog_status, catalog_edited, classes(name)' as any)
        .order('created_at', { ascending: false });

      if (full.error) {
        const legacy = await supabase
          .from('materials')
          .select('id, title, extracted_text, file_type, description, class_id, created_at, classes(name)' as any)
          .order('created_at', { ascending: false });
        if (legacy.error) throw legacy.error;
        rows = (legacy.data as any[]) || [];
      } else {
        rows = (full.data as any[]) || [];
      }

      const data = rows;
      setCatalogRows(rows as CatalogMaterialRow[]);

      const validMaterials: MaterialSource[] = (data || [])
        .map(m => ({
          id: m.id,
          title: m.title,
          content: m.extracted_text || m.description || m.title || '',
          file_type: m.file_type || 'DOC',
          class_name: m.classes?.name ?? null
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
            file_type: found.file_type || 'DOC',
            class_name: found.classes?.name ?? null
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
            title: 'Modo SyncDocs ativado',
            description: `Conversando com foco no documento "${active.title}".`
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

  // Abre o SyncDocs já com um conjunto de documentos marcados (vindo da Biblioteca)
  const studyDocs = (ids: string[], label?: string) => {
    const usable = ids.filter(id => materials.some(m => m.id === id));
    if (usable.length === 0) {
      toast({
        title: 'Nada para estudar',
        description: 'Esses documentos ainda não têm texto extraído para o SyncDocs.',
        variant: 'destructive'
      });
      return;
    }
    const totalChars = materials
      .filter(m => usable.includes(m.id))
      .reduce((sum, m) => sum + m.content.length, 0);

    setSelectedSourceIds(new Set(usable));
    setChatMode('sources');
    setShowSourcesPanel(false);
    toast({
      title: 'Modo SyncDocs ativado',
      description: `${usable.length} documento(s) ${label ? `de ${label} ` : ''}marcado(s) para estudo.` +
        (usable.length < ids.length ? ` ${ids.length - usable.length} sem texto foram ignorados.` : '') +
        (totalChars > LARGE_CONTEXT_CHARS ? ' Atenção: muito conteúdo — as respostas podem ficar lentas.' : '')
    });
  };

  const pendingIndexRows = catalogRows.filter(needsIndexing);

  const indexPending = async () => {
    const queue = catalogRows.filter(needsIndexing);
    if (queue.length === 0 || indexing) return;
    setIndexing({ done: 0, total: queue.length });
    let ok = 0;
    for (let i = 0; i < queue.length; i++) {
      const row = queue[i];
      const success = await indexMaterial({
        id: row.id,
        title: row.title,
        description: row.description,
        extracted_text: row.extracted_text,
        className: row.classes?.name
      });
      if (success) ok++;
      setIndexing({ done: i + 1, total: queue.length });
    }
    setIndexing(null);
    toast({
      title: 'Indexação concluída',
      description: `${ok} de ${queue.length} documento(s) catalogados.` +
        (ok < queue.length ? ' Os demais podem ser tentados novamente.' : '')
    });
    await loadUserMaterials();
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

    if (chatMode === 'library' && catalogRows.length === 0) {
      toast({
        title: 'Biblioteca vazia',
        description: 'Você ainda não tem documentos nas suas turmas para a IA consultar.',
        variant: 'destructive'
      });
      return;
    }

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

    const { entries: catalogEntries, refToId } = buildCatalogEntries(catalogRows);
    refToIdRef.current = refToId;

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

    let fullText = '';

    try {
      const data = await api.chat(
        messageText, 
        messages.map(msg => ({
          role: msg.role,
          parts: msg.parts
        })),
        // onChunk: preenche a mensagem do bot em tempo real
        (chunk: string) => {
          fullText += chunk;
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
        chatMode === 'sources' ? activeSources : [],
        chatMode === 'library' ? catalogEntries : []
      );

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido');
      }

      // Biblioteca: resolve a seleção sugerida pela IA (<studyset>D1,D4</studyset>) em ids reais
      if (chatMode === 'library') {
        const finalText = (data as any).response || fullText;
        const ids = resolveStudySet(finalText, refToIdRef.current);
        if (ids.length > 0) {
          setMessages(prev => prev.map(msg =>
            msg.id === botMessageId ? { ...msg, studySetIds: ids } : msg
          ));
        }
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
    localStorage.removeItem(CHAT_STORAGE_KEY);
    toast({
      title: 'Conversa limpa',
      description: 'O histórico temporário foi apagado.',
    });
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
              <>
                <Badge variant="outline" className="text-[10px] text-muted-foreground font-normal border-border/60 hidden sm:inline-flex">
                  Histórico temporário (1h)
                </Badge>
                <Button variant="ghost" size="sm" onClick={clearChat} className="text-xs h-8 text-muted-foreground hover:text-destructive">
                  Limpar Conversa
                </Button>
              </>
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
              SyncDocs (Documentos)
            </button>
            <button
              type="button"
              onClick={() => {
                setChatMode('library');
                setShowSourcesPanel(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                chatMode === 'library'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Library className="w-3.5 h-3.5 text-accent" />
              Biblioteca
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
                  ? 'Escolher Documentos'
                  : `${selectedSourceIds.size} ${selectedSourceIds.size === 1 ? 'documento ativo' : 'documentos ativos'}`}
              </span>
            </Button>
          )}
        </div>

        {/* Indicador de fontes ativas no modo Sources */}
        {chatMode === 'sources' && selectedSourceIds.size > 0 && !showSourcesPanel && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-muted-foreground">Documentos em foco:</span>
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
      
      {/* Painel da Biblioteca: visão geral do acervo + atalhos por turma */}
      {chatMode === 'library' && (
        <div className="bg-muted/40 border-b p-3 space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs">
              <Library className="w-4 h-4 text-accent" />
              <span className="font-semibold">
                {catalogRows.length} {catalogRows.length === 1 ? 'documento' : 'documentos'} em {groupByClass(catalogRows).length} {groupByClass(catalogRows).length === 1 ? 'turma' : 'turmas'}
              </span>
            </div>
            {pendingIndexRows.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={indexPending}
                disabled={!!indexing}
                className="text-[11px] h-7 gap-1.5"
              >
                {indexing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                {indexing
                  ? `Indexando ${indexing.done}/${indexing.total}...`
                  : `Indexar ${pendingIndexRows.length} pendente${pendingIndexRows.length > 1 ? 's' : ''}`}
              </Button>
            )}
          </div>
          {groupByClass(catalogRows).length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-muted-foreground">Estudar uma turma inteira:</span>
              {groupByClass(catalogRows).map(group => (
                <Button
                  key={group.classId}
                  variant="outline"
                  size="sm"
                  onClick={() => studyDocs(group.ids, group.className)}
                  className="text-[11px] h-6 px-2"
                >
                  {group.className} ({group.ids.length})
                </Button>
              ))}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            A IA enxerga as fichas (turma, matéria, resumo e tópicos) de todos os seus documentos. Ex.: "Quais documentos contemplam as unidades 3, 4 e 5 de Cálculo?"
          </p>
        </div>
      )}

      {/* Gaveta / Painel Retrátil de Seleção de Fontes */}
      {showSourcesPanel && chatMode === 'sources' && (
        <div className="bg-muted/40 border-b p-3 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold">Selecione os materiais do SyncDocs para a IA ler:</span>
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
                  {material.class_name && (
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5 max-w-[110px] truncate">
                      {material.class_name}
                    </Badge>
                  )}
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
                    ? 'Modo SyncDocs Ativo 📚'
                    : chatMode === 'library'
                    ? 'Biblioteca Ativa 🗂️'
                    : 'Olá! Sou seu assistente educacional.'}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  {chatMode === 'sources'
                    ? 'Pergunte qualquer coisa sobre os materiais selecionados no SyncDocs. Responderei citando exatamente os trechos dos seus documentos!'
                    : chatMode === 'library'
                    ? 'Pergunte quais documentos cobrem um tema ou unidade, ou peça para separar os documentos de uma turma para estudar.'
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
                  {message.mode === 'library' && message.role === 'model' && (
                    <div className="flex items-center gap-1 text-[10px] text-accent font-medium mb-1.5 border-b border-accent/20 pb-1">
                      <Library className="w-3 h-3" />
                      <span>Baseado no catálogo da Biblioteca</span>
                    </div>
                  )}
                  {message.mode === 'sources' && message.role === 'model' && (
                    <div className="flex items-center gap-1 text-[10px] text-accent font-medium mb-1.5 border-b border-accent/20 pb-1">
                      <BookOpen className="w-3 h-3" />
                      <span>Embasado em {message.sourcesUsed?.length || 1} {message.sourcesUsed?.length === 1 ? 'documento do SyncDocs' : 'documentos do SyncDocs'}</span>
                    </div>
                  )}

                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{message.parts[0].text}</p>
                  ) : (
                    <MarkdownContentCompact content={message.mode === 'library' ? displayText(message.parts[0].text) : message.parts[0].text} />
                  )}
                  {message.role === 'model' && message.studySetIds && message.studySetIds.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => studyDocs(message.studySetIds!)}
                      className="mt-2 h-7 text-xs gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Estudar estes {message.studySetIds.length} documentos
                    </Button>
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
                      {chatMode === 'sources'
                        ? 'Consultando documentos no SyncDocs...'
                        : chatMode === 'library'
                        ? 'Consultando o catálogo da Biblioteca...'
                        : 'Digitando resposta...'}
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
                  ? 'Selecione documentos acima para perguntar...'
                  : `Pergunte sobre os ${selectedSourceIds.size} documentos do SyncDocs...`
                : chatMode === 'library'
                ? 'Ex.: Quais documentos contemplam as unidades 3, 4 e 5?'
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