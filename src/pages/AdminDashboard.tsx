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
  totalProfiles: number;
  totalClasses: number;
  totalReports: number;
  pendingReports: number;
}

const AdminDashboard = () => {
  const [errorReports, setErrorReports] = useState<ErrorReport[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalProfiles: 0,
    totalClasses: 0,
    totalReports: 0,
    pendingReports: 0
  });
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setConnectionError(false);
      
      // Verificar conexão e autenticação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Load error reports
      const { data: reports, error: reportsError } = await supabase
        .from('error_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;
      setErrorReports(reports || []);

      // Load system statistics using admin function
      const { data: stats, error: statsError } = await supabase
        .rpc('get_admin_stats');

      if (statsError) {
        console.error('Error loading stats:', statsError);
        // Fallback to manual counting if admin function fails
        const [usersRes, classesRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('classes').select('id', { count: 'exact', head: true })
        ]);

        const pendingReports = reports?.filter(r => r.status === 'novo').length || 0;

        setSystemStats({
          totalUsers: usersRes.count || 0,
          totalProfiles: usersRes.count || 0,
          totalClasses: classesRes.count || 0,
          totalReports: reports?.length || 0,
          pendingReports
        });
      } else if (stats && stats.length > 0) {
        const stat = stats[0];
        setSystemStats({
          totalUsers: stat.total_users || 0,
          totalProfiles: stat.total_profiles || 0,
          totalClasses: stat.total_classes || 0,
          totalReports: stat.total_reports || 0,
          pendingReports: stat.pending_reports || 0
        });
      }

    } catch (error: any) {
      console.error('Error loading admin data:', error);
      setConnectionError(true);
      
      let errorMessage = "Erro ao carregar dados administrativos";
      if (error?.message?.includes('Failed to fetch')) {
        errorMessage = "Erro de conexão com o servidor. Verifique sua internet.";
      } else if (error?.message?.includes('não autenticado')) {
        errorMessage = "Faça login como administrador para acessar esta página.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.rpc('mark_error_report_status', {
        report_id: reportId,
        new_status: newStatus,
      });

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      const updated = Array.isArray(data) && data.length > 0 ? data[0] : null;

      setErrorReports(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { ...report, status: updated?.status ?? newStatus }
            : report
        )
      );

      // Recarregar stats após atualização
      await loadData();

      toast({
        title: "Sucesso",
        description: `Report marcado como ${getStatusLabel(newStatus)}`,
      });

    } catch (error: any) {
      console.error('Error updating report status:', error);
      let errorMessage = "Erro ao atualizar status do report";
      
      if (error?.message?.includes('Failed to fetch')) {
        errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
      } else if (String(error?.message || '').toLowerCase().includes('not authorized')) {
        errorMessage = "Sem permissão. É necessário ser administrador.";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
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

  if (connectionError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erro de Conexão</h2>
            <p className="text-muted-foreground mb-4">
              Não foi possível conectar ao servidor. Verifique sua conexão com a internet.
            </p>
            <Button onClick={loadData} variant="outline">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Gerencie reports e monitore o sistema</p>
        </div>
        <Button onClick={loadData} variant="outline" className="w-full sm:w-auto">
          Atualizar Dados
        </Button>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {systemStats.totalProfiles} com perfil
            </p>
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
            <CardContent className="p-4 sm:p-6">
              <ScrollArea className="h-[400px] sm:h-[600px]">
                <div className="space-y-4">
                  {errorReports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum report encontrado
                    </div>
                  ) : (
                    errorReports.map((report) => (
                       <Card key={report.id} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-3">
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={getStatusColor(report.status)}>
                                  {getStatusLabel(report.status)}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  Área: {report.area}
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">{report.user_email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 flex-shrink-0" />
                                  <span className="whitespace-nowrap">
                                    {new Date(report.created_at).toLocaleString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                              {report.status === 'novo' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateReportStatus(report.id, 'em_analise')}
                                  className="w-full sm:w-auto"
                                >
                                  <Clock className="h-4 w-4 mr-1" />
                                  Analisar
                                </Button>
                              )}
                              {report.status !== 'resolvido' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => updateReportStatus(report.id, 'resolvido')}
                                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Resolver
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 px-3 sm:px-6">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium mb-1 text-sm sm:text-base">Descrição:</h4>
                              <p className="text-sm text-muted-foreground bg-muted p-2 sm:p-3 rounded break-words">
                                {report.description}
                              </p>
                            </div>
                            {report.technical_details && (
                              <div>
                                <h4 className="font-medium mb-1 text-sm sm:text-base">Detalhes Técnicos:</h4>
                                <pre className="text-xs bg-muted p-2 sm:p-3 rounded overflow-x-auto max-h-32 break-all whitespace-pre-wrap">
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