import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Users, BookOpen, Calendar, Settings, Plus, Check, X, Crown, UserX } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClassData {
  id: string;
  name: string;
  description: string;
  subject: string;
  invite_code: string;
  created_by: string;
}

interface Member {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

interface Material {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  uploaded_by: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  type: 'exam' | 'homework' | 'project';
  due_date: string;
  created_by: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const ClassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'member' | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  // Form states
  const [materialForm, setMaterialForm] = useState({ title: "", description: "", file: null as File | null });
  const [assignmentForm, setAssignmentForm] = useState({ 
    title: "", 
    description: "", 
    type: "homework" as "exam" | "homework" | "project", 
    due_date: "" 
  });
  const [memberEmail, setMemberEmail] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (id && currentUserId) {
      fetchClassData();
    }
  }, [id, currentUserId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
      return;
    }
    setCurrentUserId(session.user.id);
  };

  const fetchClassData = async () => {
    if (!id || !currentUserId) return;

    try {
      // Fetch class details
      const { data: classInfo, error: classError } = await supabase
        .from("classes")
        .select("*")
        .eq("id", id)
        .single();

      if (classError) throw classError;
      setClassData(classInfo);

      // Fetch user role
      const { data: memberData, error: memberError } = await supabase
        .from("class_members")
        .select("role")
        .eq("class_id", id)
        .eq("user_id", currentUserId)
        .single();

      if (memberError) throw memberError;
      setUserRole(memberData.role);

      // Fetch all members using RPC (bypasses RLS restrictions)
      const { data: membersData, error: membersError } = await supabase
        .rpc("get_class_members", { _class_id: id });

      if (membersError) {
        console.error("Erro ao buscar membros:", membersError);
        // Se a RPC falhar, tenta buscar apenas o usuário atual
        const { data: fallbackData } = await supabase
          .from("class_members")
          .select("*")
          .eq("class_id", id)
          .eq("user_id", currentUserId);
        setMembers(fallbackData || []);
      } else {
        setMembers(membersData || []);
      }

      // Fetch materials
      const { data: materialsData, error: materialsError } = await supabase
        .from("materials")
        .select("*")
        .eq("class_id", id)
        .order("created_at", { ascending: false });

      if (materialsError) throw materialsError;
      setMaterials(materialsData);

      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select("*")
        .eq("class_id", id)
        .order("created_at", { ascending: false });

      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData);

    } catch (error: any) {
      toast.error("Erro ao carregar dados da turma");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUserId) return;

    try {
      const { error } = await supabase
        .from("materials")
        .insert({
          class_id: id,
          title: materialForm.title,
          description: materialForm.description,
          uploaded_by: currentUserId,
          status: userRole === 'admin' ? 'approved' : 'pending'
        });

      if (error) throw error;
      
      toast.success("Material adicionado com sucesso!");
      setShowAddMaterial(false);
      setMaterialForm({ title: "", description: "", file: null });
      fetchClassData();
    } catch (error: any) {
      toast.error("Erro ao adicionar material");
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUserId) return;

    try {
      const { error } = await supabase
        .from("assignments")
        .insert({
          class_id: id,
          title: assignmentForm.title,
          description: assignmentForm.description,
          type: assignmentForm.type,
          due_date: assignmentForm.due_date,
          created_by: currentUserId,
          status: userRole === 'admin' ? 'approved' : 'pending'
        });

      if (error) throw error;
      
      toast.success("Atividade adicionada com sucesso!");
      setShowAddAssignment(false);
      setAssignmentForm({ title: "", description: "", type: "homework", due_date: "" });
      fetchClassData();
    } catch (error: any) {
      toast.error("Erro ao adicionar atividade");
    }
  };

  const handleApproveContent = async (table: 'materials' | 'assignments', contentId: string) => {
    if (userRole !== 'admin') return;

    try {
      const { error } = await supabase
        .from(table)
        .update({ 
          status: 'approved',
          approved_by: currentUserId,
          approved_at: new Date().toISOString()
        })
        .eq("id", contentId);

      if (error) throw error;
      
      toast.success("Conteúdo aprovado!");
      fetchClassData();
    } catch (error: any) {
      toast.error("Erro ao aprovar conteúdo");
    }
  };

  const handleRejectContent = async (table: 'materials' | 'assignments', contentId: string) => {
    if (userRole !== 'admin') return;

    try {
      const { error } = await supabase
        .from(table)
        .update({ status: 'rejected' })
        .eq("id", contentId);

      if (error) throw error;
      
      toast.success("Conteúdo rejeitado!");
      fetchClassData();
    } catch (error: any) {
      toast.error("Erro ao rejeitar conteúdo");
    }
  };

  const handlePromoteToAdmin = async (memberId: string) => {
    if (userRole !== 'admin') return;

    try {
      const { error } = await supabase
        .from("class_members")
        .update({ role: 'admin' })
        .eq("id", memberId);

      if (error) throw error;
      
      toast.success("Membro promovido a administrador!");
      fetchClassData();
    } catch (error: any) {
      toast.error("Erro ao promover membro");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (userRole !== 'admin') return;

    try {
      const { error } = await supabase
        .from("class_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      
      toast.success("Membro removido da turma!");
      fetchClassData();
    } catch (error: any) {
      toast.error("Erro ao remover membro");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!classData) {
    return <div className="flex items-center justify-center min-h-screen">Turma não encontrada</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">{classData.name}</h1>
            <p className="text-muted-foreground">{classData.subject}</p>
          </div>
          <Badge variant={userRole === 'admin' ? 'default' : 'secondary'} className="ml-auto">
            {userRole === 'admin' ? 'Admin' : 'Membro'}
          </Badge>
        </div>

        <Tabs defaultValue="materials" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Materiais
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Atividades
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Membros
            </TabsTrigger>
            {userRole === 'admin' && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Administração
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="materials" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Materiais</h2>
              <Dialog open={showAddMaterial} onOpenChange={setShowAddMaterial}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Material
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Material</DialogTitle>
                    <DialogDescription>
                      Adicione um novo material para a turma
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddMaterial} className="space-y-4">
                    <Input
                      placeholder="Título do material"
                      value={materialForm.title}
                      onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                      required
                    />
                    <Textarea
                      placeholder="Descrição (opcional)"
                      value={materialForm.description}
                      onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                    />
                    <Button type="submit">Adicionar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid gap-4">
              {materials.map((material) => (
                <Card key={material.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{material.title}</CardTitle>
                        {material.description && (
                          <CardDescription>{material.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          material.status === 'approved' ? 'default' :
                          material.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {material.status === 'approved' ? 'Aprovado' :
                           material.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                        </Badge>
                        {userRole === 'admin' && material.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleApproveContent('materials', material.id)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRejectContent('materials', material.id)}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Atividades</h2>
              <Dialog open={showAddAssignment} onOpenChange={setShowAddAssignment}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Atividade
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Atividade</DialogTitle>
                    <DialogDescription>
                      Adicione uma nova atividade para a turma
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddAssignment} className="space-y-4">
                    <Input
                      placeholder="Título da atividade"
                      value={assignmentForm.title}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                      required
                    />
                    <Textarea
                      placeholder="Descrição"
                      value={assignmentForm.description}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                    />
                    <Select
                      value={assignmentForm.type}
                      onValueChange={(value: "exam" | "homework" | "project") => 
                        setAssignmentForm({ ...assignmentForm, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homework">Trabalho</SelectItem>
                        <SelectItem value="exam">Prova</SelectItem>
                        <SelectItem value="project">Projeto</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="datetime-local"
                      value={assignmentForm.due_date}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                    />
                    <Button type="submit">Adicionar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid gap-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <CardDescription>{assignment.description}</CardDescription>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">
                            {assignment.type === 'exam' ? 'Prova' :
                             assignment.type === 'homework' ? 'Trabalho' : 'Projeto'}
                          </Badge>
                          {assignment.due_date && (
                            <Badge variant="secondary">
                              Entrega: {format(new Date(assignment.due_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          assignment.status === 'approved' ? 'default' :
                          assignment.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {assignment.status === 'approved' ? 'Aprovado' :
                           assignment.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                        </Badge>
                        {userRole === 'admin' && assignment.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleApproveContent('assignments', assignment.id)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRejectContent('assignments', assignment.id)}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Membros ({members.length})</h2>
            </div>
            
            <div className="grid gap-4">
              {members.map((member) => (
                <Card key={member.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.user_id.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Usuário {member.user_id.substring(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          Entrou em {format(new Date(member.joined_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role === 'admin' ? (
                          <div className="flex items-center gap-1">
                            <Crown className="h-3 w-3" />
                            Admin
                          </div>
                        ) : 'Membro'}
                      </Badge>
                      {userRole === 'admin' && member.user_id !== currentUserId && (
                        <div className="flex gap-1">
                          {member.role === 'member' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePromoteToAdmin(member.id)}
                              title="Promover a Admin"
                            >
                              <Crown className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveMember(member.id)}
                            title="Remover da turma"
                          >
                            <UserX className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {userRole === 'admin' && (
            <TabsContent value="admin" className="space-y-4">
              <h2 className="text-2xl font-semibold">Administração</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>Código de Convite</CardTitle>
                  <CardDescription>
                    Compartilhe este código para que outros possam entrar na turma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Input value={classData.invite_code} readOnly />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(classData.invite_code);
                        toast.success("Código copiado!");
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{members.length}</div>
                    <div className="text-sm text-muted-foreground">Membros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {materials.filter(m => m.status === 'approved').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Materiais</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {assignments.filter(a => a.status === 'approved').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Atividades</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {materials.filter(m => m.status === 'pending').length + 
                       assignments.filter(a => a.status === 'pending').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pendentes</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default ClassDetails;