import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  Copy,
  ExternalLink,
  GraduationCap,
  Target,
  Clock,
  LogOut
} from "lucide-react";

interface Class {
  id: string;
  name: string;
  subject: string;
  description: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  members?: number;
  materials?: number;
  nextDeadline?: string;
  role?: 'admin' | 'member';
}

const Classes = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [joinLink, setJoinLink] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '',
    subject: '',
    description: ''
  });
  const [generatedLink, setGeneratedLink] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserClasses();
    }
  }, [user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
      return;
    }
    setUser(session.user);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  };

  const fetchUserClasses = async () => {
    if (!user) return;

    try {
      const { data: memberData, error: memberError } = await supabase
        .from("class_members")
        .select(`
          role,
          class_id,
          classes (
            id,
            name,
            subject,
            description,
            invite_code,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq("user_id", user.id);

      if (memberError) throw memberError;

      const classesData = memberData.map((member: any) => ({
        ...member.classes,
        role: member.role
      }));

      setClasses(classesData);
    } catch (error: any) {
      toast.error("Erro ao carregar turmas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!joinLink.trim() || !user) {
      toast.error("Por favor, insira um código válido.");
      return;
    }

    try {
      // Extract invite code from the link
      const inviteCodeMatch = joinLink.match(/\/join\/([a-zA-Z0-9]+)$/);
      const inviteCode = inviteCodeMatch ? inviteCodeMatch[1] : joinLink.trim();
      
      console.log("Tentando entrar com código:", inviteCode);

      // Find the class by invite code using secure RPC function
      const { data: classData, error: classError } = await supabase
        .rpc("get_class_by_invite", { invite_code: inviteCode })
        .maybeSingle();
        
      console.log("Resultado da busca:", { classData, classError });

      if (classError || !classData) {
        toast.error("Código de turma inválido.");
        return;
      }

      // Check if user is already a member
      const { data: existingMember, error: memberError } = await supabase
        .from("class_members")
        .select("*")
        .eq("class_id", classData.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMember) {
        toast.error("Você já está nesta turma.");
        return;
      }

      // Join the class
      const { error: joinError } = await supabase
        .from("class_members")
        .insert({
          class_id: classData.id,
          user_id: user.id,
          role: 'member'
        });

      if (joinError) throw joinError;

      toast.success("Você entrou na turma com sucesso!");
      setShowJoinDialog(false);
      setJoinLink('');
      fetchUserClasses();
    } catch (error: any) {
      toast.error("Erro ao entrar na turma");
      console.error(error);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.name.trim() || !createForm.subject.trim() || !user) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const { data: classData, error: createError } = await supabase
        .from("classes")
        .insert({
          name: createForm.name,
          subject: createForm.subject,
          description: createForm.description,
          created_by: user.id
        })
        .select()
        .maybeSingle();

      if (createError) throw createError;
      if (!classData) throw new Error("Falha ao criar turma");

      const newClass = classData;

      const shareableLink = `${window.location.origin}/join/${newClass.invite_code}`;
      setGeneratedLink(shareableLink);
      
      toast.success("Turma criada com sucesso!");
      // Não resetar o form imediatamente para manter o link visível
      // resetForm();
      fetchUserClasses();
    } catch (error: any) {
      toast.error("Erro ao criar turma");
      console.error(error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copiado para a área de transferência!");
    } catch (err) {
      console.error('Erro ao copiar:', err);
      toast.error("Erro ao copiar link");
    }
  };

  const resetForm = () => {
    setCreateForm({
      name: '',
      subject: '',
      description: ''
    });
  };

  const filteredClasses = classes.filter(classItem =>
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenClass = (classId: string) => {
    navigate(`/class/${classId}`);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Minhas Turmas</h1>
            <p className="text-muted-foreground text-lg">
              Gerencie seus estudos e colabore com seus colegas
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 sm:flex-none">
                <Plus className="mr-2 h-4 w-4" />
                Entrar em Turma
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Entrar em uma Turma</DialogTitle>
                <DialogDescription>
                  Cole o link de convite ou código da turma abaixo para participar.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoinClass} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="joinLink">Link ou Código de Convite</Label>
                  <Input
                    id="joinLink"
                    placeholder="Cole o link ou código aqui..."
                    value={joinLink}
                    onChange={(e) => setJoinLink(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Entrar na Turma
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowJoinDialog(false);
                      setJoinLink('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none bg-gradient-primary hover:bg-gradient-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Criar Turma
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Nova Turma</DialogTitle>
                <DialogDescription>
                  Preencha as informações abaixo para criar uma nova turma.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="className">Nome da Turma *</Label>
                  <Input
                    id="className"
                    placeholder="Ex: Matemática 3º Ano"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classSubject">Matéria *</Label>
                  <Input
                    id="classSubject"
                    placeholder="Ex: Matemática"
                    value={createForm.subject}
                    onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classDescription">Descrição</Label>
                  <Textarea
                    id="classDescription"
                    placeholder="Descrição opcional da turma..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Criar Turma
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setGeneratedLink('');
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
              
              {generatedLink && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Turma criada com sucesso!</h4>
                  <p className="text-sm text-green-700 mb-2">Compartilhe este link com seus alunos:</p>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={generatedLink}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(generatedLink)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setGeneratedLink('');
                      resetForm();
                    }}
                    className="w-full"
                  >
                    Criar Outra Turma
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pesquisar turmas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredClasses.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <GraduationCap className="mx-auto h-16 w-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? "Nenhuma turma encontrada" : "Você ainda não está em nenhuma turma"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchTerm 
                ? "Tente pesquisar com termos diferentes ou verifique a ortografia."
                : "Comece criando sua primeira turma ou entrando em uma turma existente usando um código de convite."
              }
            </p>
            {!searchTerm && (
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowJoinDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Entrar em Turma
                </Button>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gradient-primary hover:bg-gradient-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Turma
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredClasses.map((classItem) => (
              <Card key={classItem.id} className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1 text-primary group-hover:text-primary/80 transition-colors">
                        {classItem.name}
                      </CardTitle>
                      <CardDescription className="text-sm font-medium text-secondary">
                        {classItem.subject}
                      </CardDescription>
                    </div>
                    <Badge variant={classItem.role === 'admin' ? 'default' : 'secondary'}>
                      {classItem.role === 'admin' ? 'Admin' : 'Membro'}
                    </Badge>
                  </div>
                  {classItem.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {classItem.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col items-center space-y-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{classItem.members || 0}</span>
                      <span className="text-xs text-muted-foreground">Membros</span>
                    </div>
                    <div className="flex flex-col items-center space-y-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{classItem.materials || 0}</span>
                      <span className="text-xs text-muted-foreground">Materiais</span>
                    </div>
                    <div className="flex flex-col items-center space-y-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {classItem.nextDeadline || "Nenhuma"}
                      </span>
                      <span className="text-xs text-muted-foreground">Próxima</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground shadow-medium hover:shadow-glow transition-all"
                    onClick={() => handleOpenClass(classItem.id)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir Turma
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20">
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center">
            <Target className="mr-2 h-6 w-6" />
            Dicas para um Estudo Eficaz
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Organize seu Tempo</h3>
                <p className="text-sm text-muted-foreground">Mantenha um cronograma regular de estudos</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Colabore</h3>
                <p className="text-sm text-muted-foreground">Participe ativamente das discussões da turma</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-primary/20 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Revise Materiais</h3>
                <p className="text-sm text-muted-foreground">Acesse regularmente os conteúdos compartilhados</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Classes;