import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  Users, 
  FileText, 
  BarChart3, 
  CheckCircle,
  Clock,
  Mail,
  Calendar
} from "lucide-react";

interface ErrorReport {
  id: string;
  user_email: string;
  area: string;
  description: string;
  technical_details: any;
  status: string;
  created_at: string;
}

interface SystemStats {
  totalUsers: number;
  totalClasses: number;
  totalReports: number;
  pendingReports: number;
}

const AdminDashboard = () => {
  const [errorReports, setErrorReports] = useState<ErrorReport[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalClasses: 0,
    totalReports: 0,
    pendingReports: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load error reports
      const { data: reports, error: reportsError } = await supabase
        .from('error_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;
      setErrorReports(reports || []);

      // Load system statistics
      const [usersRes, classesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('classes').select('id', { count: 'exact', head: true })
      ]);

      const pendingReports = reports?.filter(r => r.status === 'novo').length || 0;

      setSystemStats({
        totalUsers: usersRes.count || 0,
        totalClasses: classesRes.count || 0,
        totalReports: reports?.length || 0,
        pendingReports
      });

    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados administrativos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('error_reports')
        .update({ 
          status: newStatus,
          resolved_at: newStatus === 'resolvido' ? new Date().toISOString() : null
        })
        .eq('id', reportId);

      if (error) throw error;

      setErrorReports(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { ...report, status: newStatus }
            : report
        )
      );

      toast({
        title: "Sucesso",
        description: `Report marcado como ${newStatus}`,
      });

    } catch (error) {
      console.error('Error updating report status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do report",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'novo':
        return 'destructive';
      case 'em_analise':
        return 'default';
      case 'resolvido':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'novo':
        return 'Novo';
      case 'em_analise':
        return 'Em Análise';
      case 'resolvido':
        return 'Resolvido';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando dados administrativos...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Gerencie reports e monitore o sistema</p>
        </div>
        <Button onClick={loadData} variant="outline">
          Atualizar Dados
        </Button>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Turmas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalClasses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalReports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{systemStats.pendingReports}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">
            Reports de Erro
            {systemStats.pendingReports > 0 && (
              <Badge variant="destructive" className="ml-2">
                {systemStats.pendingReports}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Reports de Erro dos Usuários
              </CardTitle>
              <CardDescription>
                Gerencie e acompanhe os reports enviados pelos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {errorReports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum report encontrado
                    </div>
                  ) : (
                    errorReports.map((report) => (
                      <Card key={report.id} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={getStatusColor(report.status)}>
                                  {getStatusLabel(report.status)}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  Área: {report.area}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                {report.user_email}
                                <Calendar className="h-4 w-4 ml-2" />
                                {new Date(report.created_at).toLocaleString('pt-BR')}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {report.status === 'novo' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateReportStatus(report.id, 'em_analise')}
                                >
                                  <Clock className="h-4 w-4 mr-1" />
                                  Analisar
                                </Button>
                              )}
                              {report.status !== 'resolvido' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateReportStatus(report.id, 'resolvido')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Resolver
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium mb-1">Descrição:</h4>
                              <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                {report.description}
                              </p>
                            </div>
                            {report.technical_details && (
                              <div>
                                <h4 className="font-medium mb-1">Detalhes Técnicos:</h4>
                                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">
                                  {JSON.stringify(report.technical_details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas do Sistema</CardTitle>
              <CardDescription>
                Métricas e informações sobre o uso da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Estatísticas detalhadas em desenvolvimento...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;