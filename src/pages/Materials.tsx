// @ts-nocheck
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReportErrorButton from "@/components/ReportErrorButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { MarkdownContent } from "@/components/MarkdownContent";
import { 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  Search, 
  Filter,
  BookOpen,
  Users,
  Calendar,
  Star,
  Share2,
  MoreVertical,
  Zap,
  Brain,
  Sparkles,
  ThumbsUp,
  ExternalLink,
  Download
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Materials = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSummary, setSelectedSummary] = useState<any>(null);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'original' | 'text'>('original');
  const [votedMaterials, setVotedMaterials] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

  // Detecta se o conteúdo é código bruto de PDF
  const isRawPdfContent = (content: string) => {
    return content.startsWith('%PDF-') || content.includes('endobj') || content.includes('/Type /Catalog');
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Falha ao baixar arquivo');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'documento.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Erro ao baixar arquivo:', err);
      // Fallback: abre direto em nova aba caso o fetch seja bloqueado
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    loadMaterials();
    loadVotes();
  }, []);

  const loadMaterials = async () => {
    try {
      setIsLoading(true);
      
      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select(`
          *,
          profiles:uploaded_by (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (materialsError) throw materialsError;

      // Load AI summaries
      const materialsWithSummaries = await Promise.all(
        (materialsData || []).map(async (material) => {
          const { data: summaries } = await supabase
            .from('ai_summaries')
            .select('*')
            .eq('material_id', material.id);

          return {
            ...material,
            hasAISummary: summaries && summaries.length > 0,
            summaries: summaries || []
          };
        })
      );

      setMaterials(materialsWithSummaries);
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os materiais.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const viewSummary = async (material: any) => {
    if (material.summaries && material.summaries.length > 0) {
      setSelectedSummary({
        material,
        summary: material.summaries[0]
      });
      setSummaryDialogOpen(true);
    }
  };

  const viewMaterial = (material: any) => {
    setSelectedMaterial(material);
    const hasOriginalUrl = material.file_url && material.file_url.startsWith('http') && material.file_url !== 'ai-generated';
    setPreviewMode(hasOriginalUrl ? 'original' : 'text');
    setMaterialDialogOpen(true);
  };

  const loadVotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: votes } = await supabase
        .from('material_votes')
        .select('material_id')
        .eq('user_id', user.id);

      if (votes) {
        setVotedMaterials(new Set(votes.map(v => v.material_id)));
      }
    } catch (error) {
      console.error('Error loading votes:', error);
    }
  };

  const toggleVote = async (materialId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Faça login para votar', variant: 'destructive' });
        return;
      }

      const hasVoted = votedMaterials.has(materialId);

      if (hasVoted) {
        await supabase
          .from('material_votes')
          .delete()
          .eq('material_id', materialId)
          .eq('user_id', user.id);

        setVotedMaterials(prev => {
          const newSet = new Set(prev);
          newSet.delete(materialId);
          return newSet;
        });
      } else {
        await supabase
          .from('material_votes')
          .insert({ material_id: materialId, user_id: user.id });

        setVotedMaterials(prev => new Set(prev).add(materialId));
      }

      await loadMaterials();
    } catch (error) {
      console.error('Error toggling vote:', error);
      toast({ title: 'Erro ao votar', variant: 'destructive' });
    }
  };

  const subjects = ["Todos"];
  
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    totalMaterials: materials.length,
    withAI: materials.filter(m => m.hasAISummary).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-accent/5 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <BookOpen className="w-10 h-10 text-primary" />
              Materiais
            </h1>
            <p className="text-base text-muted-foreground">Biblioteca colaborativa de materiais de estudo</p>
          </div>
          
          <Button variant="gamified" size="lg" className="shadow-medium" onClick={() => navigate('/?tab=ai-assistant')}>
            <Upload className="w-5 h-5" />
            Enviar Material
          </Button>
        </div>

        {/* Stats Cards - Proximidade (gap-4) */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 shadow-soft border-l-4 border-primary">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total de Materiais</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.totalMaterials}</div>
            </div>
          </Card>
          
          <Card className="p-4 shadow-soft border-l-4 border-accent">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                <span className="text-sm text-muted-foreground">Com Resumo IA</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.withAI}</div>
            </div>
          </Card>
        </div>

        {/* Search - Figura-fundo */}
        <Card className="p-6 shadow-medium border-l-4 border-muted bg-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar materiais por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </Card>

        {/* Materials Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando materiais...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => (
              <Card key={material.id} className="p-6 shadow-soft border-l-4 border-primary group">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-xs">
                          {material.file_type || 'DOC'}
                        </Badge>
                        {material.file_size && (
                          <p className="text-xs text-muted-foreground">{material.file_size}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title and Class */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-smooth">
                      {material.title}
                    </h3>
                    {material.classes && (
                      <Badge variant="secondary" className="bg-accent/10 text-accent">
                        {material.classes.name}
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  {material.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {material.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => viewMaterial(material)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      <span className="text-xs font-medium">Visualizar Conteúdo</span>
                    </Button>
                    
                    {material.hasAISummary && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20 hover:border-accent/40"
                        onClick={() => viewSummary(material)}
                      >
                        <Zap className="w-4 h-4 mr-2 text-accent" />
                        <span className="text-xs font-medium">Resumo por IA disponível</span>
                      </Button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/quiz/${material.id}`)}
                      >
                        <Brain className="w-4 h-4 mr-1" />
                        <span className="text-xs">Quiz</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/flashcards/${material.id}`)}
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        <span className="text-xs">Flashcards</span>
                      </Button>
                    </div>
                  </div>

                  {/* Author and Upvotes */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={material.profiles?.avatar_url} />
                      <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">
                        {material.profiles?.username?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Por {material.profiles?.username || 'Usuário'} • {new Date(material.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      variant={votedMaterials.has(material.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleVote(material.id)}
                      className="gap-1"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span className="text-xs">{material.upvotes || 0}</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredMaterials.length === 0 && (
          <Card className="p-12 text-center shadow-medium">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted/30 flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Nenhum material encontrado</h3>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros ou termos de busca, ou seja o primeiro a compartilhar um material!
                </p>
              </div>
              <Button variant="gamified" onClick={() => navigate('/?tab=ai-assistant')}>
                <Upload className="w-4 h-4" />
                Enviar Primeiro Material
              </Button>
            </div>
          </Card>
        )}
      </div>
      
      {/* Report Error Button */}
      <div className="flex justify-center mt-8">
        <ReportErrorButton area="Materiais" />
      </div>

      {/* Material Content Dialog - Leitor Fiel Estilo Google Drive */}
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent className="max-w-5xl h-[88vh] flex flex-col p-4 md:p-6">
          <DialogHeader className="pb-3 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold truncate">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <span className="truncate">{selectedMaterial?.title}</span>
              </DialogTitle>

              {/* Botões de Ação do Topo (Download / Abrir em Nova Aba) */}
              {selectedMaterial?.file_url && selectedMaterial.file_url.startsWith('http') && selectedMaterial.file_url !== 'ai-generated' && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    asChild
                  >
                    <a href={selectedMaterial.file_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Abrir em nova aba
                    </a>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => handleDownload(selectedMaterial.file_url, selectedMaterial.file_name || `${selectedMaterial.title}.pdf`)}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          
          {selectedMaterial && (
            <div className="flex-1 flex flex-col min-h-0 pt-3 space-y-3">
              {/* Barra de Sub-cabeçalho com Badges e Alternador de Modo */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-medium">
                    {selectedMaterial.file_type || 'DOCUMENTO'}
                  </Badge>
                  {selectedMaterial.file_name && (
                    <span className="text-xs text-muted-foreground truncate max-w-xs">
                      {selectedMaterial.file_name}
                    </span>
                  )}
                </div>

                {/* Alternador "Ver PDF Original" vs "Texto Extraído" quando ambos existem */}
                {selectedMaterial.file_url && selectedMaterial.file_url.startsWith('http') && selectedMaterial.file_url !== 'ai-generated' && (
                  <div className="flex items-center bg-muted p-1 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewMode('original')}
                      className={`px-3 py-1 rounded-md font-medium transition-colors ${
                        previewMode === 'original'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      📄 Documento Original
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('text')}
                      className={`px-3 py-1 rounded-md font-medium transition-colors ${
                        previewMode === 'text'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      📝 Texto Extraído
                    </button>
                  </div>
                )}
              </div>
              
              {/* Corpo da Visualização */}
              <div className="flex-1 min-h-0">
                {previewMode === 'original' && selectedMaterial.file_url && selectedMaterial.file_url.startsWith('http') && selectedMaterial.file_url !== 'ai-generated' ? (
                  // Visualizador Fiel de PDF estilo Google Drive / Embutido
                  <div className="w-full h-full bg-slate-900/5 rounded-lg border overflow-hidden relative shadow-inner">
                    <iframe
                      src={`${selectedMaterial.file_url}#toolbar=1&navpanes=1&scrollbar=1`}
                      title={selectedMaterial.title}
                      className="w-full h-full border-0 rounded-lg"
                    />
                  </div>
                ) : (
                  // Visualização em Markdown formatado (para texto extraído ou quando não há PDF)
                  (() => {
                    const isUrl = (v?: string) => !!v && /^https?:\/\//.test(v);
                    const rawContent = (selectedMaterial.extracted_text && selectedMaterial.extracted_text !== 'ai-generated')
                      ? selectedMaterial.extracted_text
                      : (selectedMaterial.file_url !== 'ai-generated' && !isUrl(selectedMaterial.file_url) ? selectedMaterial.file_url : null);

                    if (!rawContent) {
                      return (
                        <div className="h-full flex flex-col items-center justify-center bg-muted/20 rounded-lg p-8 text-center border-2 border-dashed">
                          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                          <p className="text-muted-foreground font-medium">
                            O conteúdo textual deste material não está disponível.
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Use os botões de Quiz ou Flashcards para interagir com este material.
                          </p>
                        </div>
                      );
                    }

                    if (isRawPdfContent(rawContent)) {
                      return (
                        <div className="h-full flex flex-col items-center justify-center bg-muted/20 rounded-lg p-8 text-center border-2 border-dashed">
                          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                          <p className="text-muted-foreground font-medium">
                            Este PDF não pôde ser convertido para texto puro.
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Alterne para a aba "Documento Original" acima para vê-lo.
                          </p>
                        </div>
                      );
                    }

                    // Converte marcadores comuns (• ou -) para listas markdown limpas
                    const formattedContent = rawContent
                      .replace(/•\s*/g, '\n* ')
                      .replace(/([0-9]+\.\s+[^\n]+)/g, '\n\n$1\n')
                      .replace(/\n{3,}/g, '\n\n');

                    return (
                      <div className="bg-card rounded-lg p-6 border h-full overflow-y-auto shadow-inner">
                        <MarkdownContent content={formattedContent} />
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Summary Dialog */}
      <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              {selectedSummary?.material?.title}.txt
            </DialogTitle>
          </DialogHeader>
          
          {selectedSummary && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Tipo: {selectedSummary.summary.summary_type}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Gerado em {new Date(selectedSummary.summary.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-6 border">
                <MarkdownContent content={selectedSummary.summary.content} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Materials;