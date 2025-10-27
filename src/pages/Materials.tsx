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
  ThumbsUp
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
  const [votedMaterials, setVotedMaterials] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

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
          
          <Button variant="gamified" size="lg" className="shadow-medium" onClick={() => navigate('/ai-assistant')}>
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
              <Button variant="gamified" onClick={() => navigate('/ai-assistant')}>
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

      {/* Material Content Dialog */}
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {selectedMaterial?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMaterial && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {selectedMaterial.file_type || 'DOCUMENTO'}
                </Badge>
                {selectedMaterial.file_name && (
                  <span className="text-sm text-muted-foreground">
                    {selectedMaterial.file_name}
                  </span>
                )}
              </div>
              
              {selectedMaterial.file_url ? (
                <div className="bg-muted/50 rounded-lg p-6 border">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedMaterial.file_url}
                  </pre>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-lg p-8 text-center border-2 border-dashed">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    O conteúdo deste material não está disponível para visualização.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Use os resumos IA, quiz ou flashcards para estudar este material.
                  </p>
                </div>
              )}
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
              
              <div className="bg-slate-900 text-slate-100 rounded-lg p-6 border border-slate-700">
                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                  {selectedSummary.summary.content}
                </pre>
              </div>
              
              <p className="text-xs text-muted-foreground italic">
                * Em breve este arquivo terá formatação aprimorada
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Materials;