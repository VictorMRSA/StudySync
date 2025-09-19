import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users, BookOpen, Calendar, Plus, Search, Link, Crown, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";

const Classes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [classes, setClasses] = useState([
    {
      id: 1,
      name: "Cálculo I",
      code: "MAT101",
      members: 24,
      materials: 12,
      nextDeadline: "Prova - 3 dias",
      role: "admin",
      color: "bg-gradient-primary"
    },
    {
      id: 2,
      name: "Física I",
      code: "FIS101", 
      members: 18,
      materials: 8,
      nextDeadline: "Lista - 5 dias",
      role: "member",
      color: "bg-gradient-success"
    },
    {
      id: 3,
      name: "Programação",
      code: "CS101",
      members: 31,
      materials: 15,
      nextDeadline: "Projeto - 12 dias",
      role: "member",
      color: "bg-gradient-xp"
    }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClass, setNewClass] = useState({
    name: "",
    room: "",
    code: ""
  });
  const [generatedLink, setGeneratedLink] = useState("");
  const [showSuccessState, setShowSuccessState] = useState(false);
  const { toast } = useToast();

  const handleCreateClass = () => {
    if (!newClass.name.trim() || !newClass.room.trim()) {
      toast({
        title: "Erro",
        description: "Nome e sala são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const classId = Math.random().toString(36).substr(2, 9);
    const shareableLink = `${window.location.origin}/join/${classId}`;
    
    const createdClass = {
      id: Date.now(),
      name: newClass.name,
      code: newClass.code || `TURMA${classId.toUpperCase()}`,
      members: 1,
      materials: 0,
      nextDeadline: "Sem atividades",
      role: "admin",
      color: "bg-gradient-primary"
    };

    setClasses(prev => [...prev, createdClass]);
    setGeneratedLink(shareableLink);
    setShowSuccessState(true);
    
    toast({
      title: "Turma criada com sucesso!",
      description: "Link de compartilhamento gerado",
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência",
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setNewClass({ name: "", room: "", code: "" });
    setGeneratedLink("");
    setShowSuccessState(false);
    setIsCreateDialogOpen(false);
  };

  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-accent/5 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">Minhas Turmas</h1>
            <p className="text-muted-foreground">Gerencie suas disciplinas e colabore com colegas</p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" size="lg">
              <Link className="w-5 h-5" />
              Entrar em Turma
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gamified" size="lg">
                  <Plus className="w-5 h-5" />
                  Criar Turma
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {showSuccessState ? "Turma Criada!" : "Criar Nova Turma"}
                  </DialogTitle>
                </DialogHeader>
                
                {!showSuccessState ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da Turma *</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Cálculo I - Turma A"
                        value={newClass.name}
                        onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="room">Sala *</Label>
                      <Input
                        id="room"
                        placeholder="Ex: A101, Lab 3, Online"
                        value={newClass.room}
                        onChange={(e) => setNewClass(prev => ({ ...prev, room: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="code">Código da Matéria (opcional)</Label>
                      <Input
                        id="code"
                        placeholder="Ex: MAT101, FIS201"
                        value={newClass.code}
                        onChange={(e) => setNewClass(prev => ({ ...prev, code: e.target.value }))}
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={resetForm} className="flex-1">
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateClass} className="flex-1">
                        Criar Turma
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center py-6">
                      <CheckCircle className="w-16 h-16 text-success" />
                    </div>
                    
                    <div className="text-center space-y-2">
                      <h3 className="font-semibold">Turma "{newClass.name}" criada!</h3>
                      <p className="text-sm text-muted-foreground">
                        Compartilhe o link abaixo para convidar alunos
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Link de Convite</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={generatedLink} 
                          readOnly 
                          className="flex-1 font-mono text-xs"
                        />
                        <Button onClick={copyToClipboard} size="sm">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Button onClick={resetForm} className="w-full">
                      Criar Outra Turma
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and filters */}
        <Card className="p-4 shadow-medium">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar turmas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-smooth">
                Todas
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-smooth">
                Admin
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-smooth">
                Membro
              </Badge>
            </div>
          </div>
        </Card>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classItem) => (
            <Card key={classItem.id} className="overflow-hidden shadow-medium hover:shadow-large transition-smooth cursor-pointer group">
              <div className={`h-3 ${classItem.color}`} />
              
              <div className="p-6 space-y-4">
                {/* Class header */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-smooth">
                        {classItem.name}
                      </h3>
                      {classItem.role === "admin" && (
                        <Crown className="w-4 h-4 text-warning" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{classItem.code}</p>
                  </div>
                  <Badge 
                    variant={classItem.role === "admin" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {classItem.role === "admin" ? "Admin" : "Membro"}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{classItem.members} membros</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm">{classItem.materials} materiais</span>
                  </div>
                </div>

                {/* Next deadline */}
                <div className="p-3 rounded-lg bg-warning-light border border-warning/20">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium text-warning">
                      Próximo: {classItem.nextDeadline}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="default" size="sm" className="flex-1">
                    Abrir Turma
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty state or Create first class card */}
        {filteredClasses.length === 0 && searchTerm && (
          <Card className="p-12 text-center shadow-medium">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Nenhuma turma encontrada</h3>
              <p className="text-muted-foreground">
                Tente ajustar sua busca ou criar uma nova turma
              </p>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="gamified">
                    <Plus className="w-4 h-4" />
                    Criar Nova Turma
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </Card>
        )}

        {/* Quick Tips */}
        <Card className="p-6 shadow-medium bg-gradient-to-r from-accent/5 to-primary/5">
          <h3 className="font-semibold mb-3 text-foreground">💡 Dicas para turmas eficazes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <span>Compartilhe materiais regularmente para ganhar XP extra</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0" />
              <span>Use o calendário compartilhado para manter todos atualizados</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-warning rounded-full mt-2 flex-shrink-0" />
              <span>Convide colegas para aumentar a colaboração</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Classes;