import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Zap
} from "lucide-react";

const Materials = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const materials = [
    {
      id: 1,
      title: "Algoritmos e Estruturas de Dados - Aula 1",
      type: "PDF",
      size: "2.4 MB",
      uploadedBy: "Maria Silva",
      uploadDate: "2024-01-15",
      subject: "Ciência da Computação",
      downloads: 23,
      views: 45,
      rating: 4.8,
      hasAISummary: true,
      tags: ["algoritmos", "estruturas", "introdução"]
    },
    {
      id: 2,
      title: "Cálculo Diferencial - Exercícios Resolvidos",
      type: "PDF",
      size: "1.8 MB",
      uploadedBy: "João Santos",
      uploadDate: "2024-01-14",
      subject: "Matemática",
      downloads: 31,
      views: 67,
      rating: 4.9,
      hasAISummary: true,
      tags: ["cálculo", "exercícios", "derivadas"]
    },
    {
      id: 3,
      title: "História do Brasil - Slides Aula 5",
      type: "PPTX",
      size: "5.2 MB",
      uploadedBy: "Ana Costa",
      uploadDate: "2024-01-13",
      subject: "História",
      downloads: 18,
      views: 32,
      rating: 4.6,
      hasAISummary: false,
      tags: ["história", "brasil", "república"]
    },
    {
      id: 4,
      title: "Química Orgânica - Resumo Completo",
      type: "PDF",
      size: "3.1 MB",
      uploadedBy: "Carlos Lima",
      uploadDate: "2024-01-12",
      subject: "Química",
      downloads: 42,
      views: 89,
      rating: 4.7,
      hasAISummary: true,
      tags: ["química", "orgânica", "resumo"]
    }
  ];

  const subjects = ["Todos", "Ciência da Computação", "Matemática", "História", "Química"];
  
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = selectedFilter === "all" || material.subject === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalMaterials: materials.length,
    totalDownloads: materials.reduce((sum, m) => sum + m.downloads, 0),
    avgRating: (materials.reduce((sum, m) => sum + m.rating, 0) / materials.length).toFixed(1),
    withAI: materials.filter(m => m.hasAISummary).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-accent/5 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-primary" />
              Materiais
            </h1>
            <p className="text-muted-foreground">Biblioteca colaborativa de materiais de estudo</p>
          </div>
          
          <Button variant="gamified" size="lg" className="shadow-medium">
            <Upload className="w-5 h-5" />
            Enviar Material
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 shadow-soft">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.totalMaterials}</div>
            </div>
          </Card>
          
          <Card className="p-4 shadow-soft">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-success" />
                <span className="text-sm text-muted-foreground">Downloads</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.totalDownloads}</div>
            </div>
          </Card>
          
          <Card className="p-4 shadow-soft">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-warning" />
                <span className="text-sm text-muted-foreground">Avaliação</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.avgRating}</div>
            </div>
          </Card>
          
          <Card className="p-4 shadow-soft">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                <span className="text-sm text-muted-foreground">Com IA</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{stats.withAI}</div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 shadow-medium">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar materiais por título ou tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {subjects.map((subject) => (
                <Button
                  key={subject}
                  variant={selectedFilter === subject.toLowerCase() || (selectedFilter === "all" && subject === "Todos") ? "gamified" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(subject === "Todos" ? "all" : subject)}
                >
                  {subject}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <Card key={material.id} className="p-6 shadow-medium hover:shadow-large transition-smooth group">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs">
                        {material.type}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{material.size}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>

                {/* Title and Subject */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-smooth">
                    {material.title}
                  </h3>
                  <Badge variant="secondary" className="bg-accent/10 text-accent">
                    {material.subject}
                  </Badge>
                </div>

                {/* AI Summary Badge */}
                {material.hasAISummary && (
                  <div className="flex items-center gap-1 p-2 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20">
                    <Zap className="w-4 h-4 text-accent" />
                    <span className="text-xs font-medium text-accent">Resumo por IA disponível</span>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {material.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs bg-muted/30">
                      #{tag}
                    </Badge>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{material.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{material.downloads}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-warning" />
                      <span className="text-sm text-muted-foreground">{material.rating}</span>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Author */}
                <div className="flex items-center gap-2 pt-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">
                      {material.uploadedBy.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Por {material.uploadedBy} • {new Date(material.uploadDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="gamified" size="sm" className="flex-1">
                    <Eye className="w-4 h-4" />
                    Visualizar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="w-4 h-4" />
                    Baixar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

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
              <Button variant="gamified">
                <Upload className="w-4 h-4" />
                Enviar Primeiro Material
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Materials;