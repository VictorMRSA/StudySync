import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock, Plus, Filter, AlertCircle, Edit2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReportErrorButton from "@/components/ReportErrorButton";

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  user_id: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

const Calendar = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    all_day: false,
    priority: 3
  });
  const [editEvent, setEditEvent] = useState({
    title: "",
    description: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    all_day: false,
    priority: 3
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para ver seus eventos.",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true })
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar eventos.",
          variant: "destructive"
        });
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar eventos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEditEvent({
      title: event.title,
      description: event.description || "",
      start_date: event.start_date.split('T')[0],
      start_time: event.all_day ? "" : event.start_date.split('T')[1]?.split(':').slice(0, 2).join(':') || "",
      end_date: event.end_date ? event.end_date.split('T')[0] : "",
      end_time: event.all_day || !event.end_date ? "" : event.end_date.split('T')[1]?.split(':').slice(0, 2).join(':') || "",
      all_day: event.all_day,
      priority: event.priority
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para deletar eventos.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting event:', error);
        toast({
          title: "Erro",
          description: "Erro ao deletar evento.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Evento deletado!",
        description: "Seu evento foi removido com sucesso.",
        variant: "default"
      });

      fetchEvents();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar evento.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !editEvent.title || !editEvent.start_date) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o título e a data.",
        variant: "destructive"
      });
      return;
    }

    // Executar validações lógicas para edição
    if (!validateEditEventData()) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para editar eventos.",
          variant: "destructive"
        });
        return;
      }

      let startDateTime = editEvent.start_date;
      let endDateTime = editEvent.end_date || editEvent.start_date;

      if (!editEvent.all_day) {
        if (editEvent.start_time) {
          startDateTime = `${editEvent.start_date}T${editEvent.start_time}:00`;
        }
        if (editEvent.end_time) {
          endDateTime = `${editEvent.end_date || editEvent.start_date}T${editEvent.end_time}:00`;
        }
      }

      const { error } = await supabase
        .from('events')
        .update({
          title: editEvent.title,
          description: editEvent.description || null,
          start_date: startDateTime,
          end_date: endDateTime !== startDateTime ? endDateTime : null,
          all_day: editEvent.all_day,
          priority: editEvent.priority,
        })
        .eq('id', editingEvent.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating event:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar evento.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Evento atualizado!",
        description: "Seu evento foi salvo com sucesso.",
        variant: "default"
      });

      setEditingEvent(null);
      setEditEvent({
        title: "",
        description: "",
        start_date: "",
        start_time: "",
        end_date: "",
        end_time: "",
        all_day: false,
        priority: 3
      });
      setIsEditDialogOpen(false);
      fetchEvents();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar evento.",
        variant: "destructive"
      });
    }
  };

  const validateEditEventData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(editEvent.start_date);
    startDate.setHours(0, 0, 0, 0);
    
    // Validação 1: Data de início não pode ser no passado
    if (startDate < today) {
      toast({
        title: "Erro de Validação",
        description: "A data de início não pode ser anterior à data atual.",
        variant: "destructive"
      });
      return false;
    }
    
    // Validação 2: Se há data de fim, não pode ser anterior à data de início
    if (editEvent.end_date && editEvent.end_date < editEvent.start_date) {
      toast({
        title: "Erro de Validação",
        description: "A data de fim não pode ser anterior à data de início.",
        variant: "destructive"
      });
      return false;
    }
    
    // Validação 3: Para eventos não "dia inteiro", validar horários
    if (!editEvent.all_day && editEvent.start_time && editEvent.end_time) {
      const startDateTime = new Date(`${editEvent.start_date}T${editEvent.start_time}:00`);
      const endDateTime = new Date(`${editEvent.end_date || editEvent.start_date}T${editEvent.end_time}:00`);
      
      if (endDateTime <= startDateTime) {
        toast({
          title: "Erro de Validação",
          description: "O horário de fim deve ser posterior ao horário de início.",
          variant: "destructive"
        });
        return false;
      }
    }
    
    return true;
  };

  const validateEventData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(newEvent.start_date);
    startDate.setHours(0, 0, 0, 0);
    
    // Validação 1: Data de início não pode ser no passado
    if (startDate < today) {
      toast({
        title: "Erro de Validação",
        description: "A data de início não pode ser anterior à data atual.",
        variant: "destructive"
      });
      return false;
    }
    
    // Validação 2: Se há data de fim, não pode ser anterior à data de início
    if (newEvent.end_date && newEvent.end_date < newEvent.start_date) {
      toast({
        title: "Erro de Validação",
        description: "A data de fim não pode ser anterior à data de início.",
        variant: "destructive"
      });
      return false;
    }
    
    // Validação 3: Para eventos não "dia inteiro", validar horários
    if (!newEvent.all_day && newEvent.start_time && newEvent.end_time) {
      const startDateTime = new Date(`${newEvent.start_date}T${newEvent.start_time}:00`);
      const endDateTime = new Date(`${newEvent.end_date || newEvent.start_date}T${newEvent.end_time}:00`);
      
      if (endDateTime <= startDateTime) {
        toast({
          title: "Erro de Validação",
          description: "O horário de fim deve ser posterior ao horário de início.",
          variant: "destructive"
        });
        return false;
      }
    }
    
    return true;
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.start_date) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o título e a data.",
        variant: "destructive"
      });
      return;
    }

    // Executar validações lógicas
    if (!validateEventData()) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para criar eventos.",
          variant: "destructive"
        });
        return;
      }

      let startDateTime = newEvent.start_date;
      let endDateTime = newEvent.end_date || newEvent.start_date;

      if (!newEvent.all_day) {
        if (newEvent.start_time) {
          startDateTime = `${newEvent.start_date}T${newEvent.start_time}:00`;
        }
        if (newEvent.end_time) {
          endDateTime = `${newEvent.end_date || newEvent.start_date}T${newEvent.end_time}:00`;
        }
      }

      const { error } = await supabase
        .from('events')
        .insert([{
          title: newEvent.title,
          description: newEvent.description || null,
          start_date: startDateTime,
          end_date: endDateTime !== startDateTime ? endDateTime : null,
          all_day: newEvent.all_day,
          priority: newEvent.priority,
          user_id: user.id
        }]);

      if (error) {
        console.error('Error creating event:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar evento.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Evento criado!",
        description: "Seu evento foi salvo com sucesso.",
        variant: "default"
      });

      setNewEvent({
        title: "",
        description: "",
        start_date: "",
        start_time: "",
        end_date: "",
        end_time: "",
        all_day: false,
        priority: 3
      });
      setIsDialogOpen(false);
      fetchEvents();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar evento.",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return "bg-destructive text-destructive-foreground";
      case 2: return "bg-orange-500 text-white";
      case 3: return "bg-yellow-500 text-black";
      case 4: return "bg-green-500 text-white";
      case 5: return "bg-blue-500 text-white";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return "Muito Alta";
      case 2: return "Alta";
      case 3: return "Média";
      case 4: return "Baixa";
      case 5: return "Muito Baixa";
      default: return "Média";
    }
  };

  const getPriorityDot = (priority: number) => {
    return <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority).replace('bg-', 'bg-').split(' ')[0]}`} />;
  };

  // Função auxiliar para criar Date local a partir de string YYYY-MM-DD
  const createLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('T')[0].split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  const getDaysUntil = (dateString: string, allDay: boolean = false) => {
    const eventDate = allDay ? createLocalDate(dateString) : new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatEventDate = (dateString: string, allDay: boolean) => {
    if (allDay) {
      const date = createLocalDate(dateString);
      return date.toLocaleDateString('pt-BR');
    }
    const date = new Date(dateString);
    return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const urgentEvents = events.filter(event => getDaysUntil(event.start_date, event.all_day) <= 5 && getDaysUntil(event.start_date, event.all_day) >= 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-accent/5 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header - Hierarquia */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-foreground">Calendário Acadêmico</h1>
            <p className="text-base text-muted-foreground">Organize seus compromissos e nunca perca um prazo</p>
          </div>
          
          {/* Proximidade - botões relacionados agrupados */}
          <div className="flex gap-3">
            <Button variant="outline" size="lg">
              <Filter className="w-5 h-5" />
              Filtros
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gamified" size="lg">
                  <Plus className="w-5 h-5" />
                  Novo Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Criar Novo Evento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Prova de Física I"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Detalhes do evento..."
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Grau de Importância *</Label>
                    <Select value={newEvent.priority.toString()} onValueChange={(value) => setNewEvent({...newEvent, priority: parseInt(value)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                       <SelectContent className="bg-card border-border shadow-lg z-50">
                         <SelectItem value="1" className="bg-card hover:bg-accent focus:bg-accent">
                           <div className="flex items-center gap-2">
                             <div className="w-3 h-3 bg-destructive rounded-full" />
                             <span>Muito Alta</span>
                           </div>
                         </SelectItem>
                         <SelectItem value="2" className="bg-card hover:bg-accent focus:bg-accent">
                           <div className="flex items-center gap-2">
                             <div className="w-3 h-3 bg-orange-500 rounded-full" />
                             <span>Alta</span>
                           </div>
                         </SelectItem>
                         <SelectItem value="3" className="bg-card hover:bg-accent focus:bg-accent">
                           <div className="flex items-center gap-2">
                             <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                             <span>Média</span>
                           </div>
                         </SelectItem>
                         <SelectItem value="4" className="bg-card hover:bg-accent focus:bg-accent">
                           <div className="flex items-center gap-2">
                             <div className="w-3 h-3 bg-green-500 rounded-full" />
                             <span>Baixa</span>
                           </div>
                         </SelectItem>
                         <SelectItem value="5" className="bg-card hover:bg-accent focus:bg-accent">
                           <div className="flex items-center gap-2">
                             <div className="w-3 h-3 bg-blue-500 rounded-full" />
                             <span>Muito Baixa</span>
                           </div>
                         </SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="all_day"
                      checked={newEvent.all_day}
                      onChange={(e) => setNewEvent({...newEvent, all_day: e.target.checked})}
                      className="rounded"
                    />
                    <Label htmlFor="all_day">Evento de dia inteiro</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Data de Início *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={newEvent.start_date}
                        onChange={(e) => setNewEvent({...newEvent, start_date: e.target.value})}
                      />
                    </div>
                    
                    {!newEvent.all_day && (
                      <div className="space-y-2">
                        <Label htmlFor="start_time">Horário de Início</Label>
                        <Input
                          id="start_time"
                          type="time"
                          value={newEvent.start_time}
                          onChange={(e) => setNewEvent({...newEvent, start_time: e.target.value})}
                        />
                      </div>
                    )}
                  </div>

                  {!newEvent.all_day && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="end_date">Data de Fim</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={newEvent.end_date}
                          onChange={(e) => setNewEvent({...newEvent, end_date: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="end_time">Horário de Fim</Label>
                        <Input
                          id="end_time"
                          type="time"
                          value={newEvent.end_time}
                          onChange={(e) => setNewEvent({...newEvent, end_time: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button variant="gamified" onClick={handleCreateEvent}>
                      Criar Evento
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Edit Event Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Editar Evento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Título *</Label>
                    <Input
                      id="edit-title"
                      placeholder="Ex: Prova de Física I"
                      value={editEvent.title}
                      onChange={(e) => setEditEvent({...editEvent, title: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Descrição</Label>
                    <Textarea
                      id="edit-description"
                      placeholder="Detalhes do evento..."
                      value={editEvent.description}
                      onChange={(e) => setEditEvent({...editEvent, description: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-priority">Grau de Importância *</Label>
                    <Select value={editEvent.priority.toString()} onValueChange={(value) => setEditEvent({...editEvent, priority: parseInt(value)})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                       <SelectContent className="bg-card border-border shadow-lg z-50">
                         <SelectItem value="1" className="bg-card hover:bg-accent focus:bg-accent">
                           <div className="flex items-center gap-2">
                             <div className="w-3 h-3 bg-destructive rounded-full" />
                             <span>Muito Alta</span>
                           </div>
                         </SelectItem>
                         <SelectItem value="2" className="bg-card hover:bg-accent focus:bg-accent">
                           <div className="flex items-center gap-2">
                             <div className="w-3 h-3 bg-orange-500 rounded-full" />
                             <span>Alta</span>
                           </div>
                         </SelectItem>
                         <SelectItem value="3" className="bg-card hover:bg-accent focus:bg-accent">
                           <div className="flex items-center gap-2">
                             <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                             <span>Média</span>
                           </div>
                         </SelectItem>
                         <SelectItem value="4" className="bg-card hover:bg-accent focus:bg-accent">
                           <div className="flex items-center gap-2">
                             <div className="w-3 h-3 bg-green-500 rounded-full" />
                             <span>Baixa</span>
                           </div>
                         </SelectItem>
                         <SelectItem value="5" className="bg-card hover:bg-accent focus:bg-accent">
                           <div className="flex items-center gap-2">
                             <div className="w-3 h-3 bg-blue-500 rounded-full" />
                             <span>Muito Baixa</span>
                           </div>
                         </SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit_all_day"
                      checked={editEvent.all_day}
                      onChange={(e) => setEditEvent({...editEvent, all_day: e.target.checked})}
                      className="rounded"
                    />
                    <Label htmlFor="edit_all_day">Evento de dia inteiro</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_start_date">Data de Início *</Label>
                      <Input
                        id="edit_start_date"
                        type="date"
                        value={editEvent.start_date}
                        onChange={(e) => setEditEvent({...editEvent, start_date: e.target.value})}
                      />
                    </div>
                    
                    {!editEvent.all_day && (
                      <div className="space-y-2">
                        <Label htmlFor="edit_start_time">Horário de Início</Label>
                        <Input
                          id="edit_start_time"
                          type="time"
                          value={editEvent.start_time}
                          onChange={(e) => setEditEvent({...editEvent, start_time: e.target.value})}
                        />
                      </div>
                    )}
                  </div>

                  {!editEvent.all_day && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit_end_date">Data de Fim</Label>
                        <Input
                          id="edit_end_date"
                          type="date"
                          value={editEvent.end_date}
                          onChange={(e) => setEditEvent({...editEvent, end_date: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit_end_time">Horário de Fim</Label>
                        <Input
                          id="edit_end_time"
                          type="time"
                          value={editEvent.end_time}
                          onChange={(e) => setEditEvent({...editEvent, end_time: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button variant="gamified" onClick={handleUpdateEvent}>
                      Salvar Alterações
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Urgent Events Alert */}
        {urgentEvents.length > 0 && (
          <Card className="p-4 bg-gradient-to-r from-destructive/10 to-warning/10 border-destructive/20 shadow-medium">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive animate-bounce-subtle" />
              <div>
                <h3 className="font-semibold text-destructive">Atenção! Prazos próximos</h3>
                <p className="text-sm text-muted-foreground">
                  Você tem {urgentEvents.length} compromisso(s) nos próximos 5 dias
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Widget */}
          <Card className="lg:col-span-1 p-6 shadow-medium">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Calendário</h3>
            </div>
            
            <CalendarComponent 
              mode="single"
              className="w-full"
              modifiers={{
                eventDay: events.map(event => new Date(event.start_date))
              }}
              modifiersClassNames={{
                eventDay: "relative"
              }}
              components={{
                DayContent: ({ date }) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const dayEvents = events.filter(event => 
                    event.start_date.split('T')[0] === dateStr
                  );
                  
                  return (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <span>{date.getDate()}</span>
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-0 flex gap-0.5">
                          {dayEvents.slice(0, 3).map((event, index) => (
                            <div
                              key={event.id}
                              className={`w-1.5 h-1.5 rounded-full ${
                                getPriorityColor(event.priority).split(' ')[0]
                              }`}
                              title={event.title}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              }}
            />
            
            <div className="space-y-2 text-xs mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-destructive rounded-full" />
                <span>Muito Alta</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span>Alta</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span>Média</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span>Baixa</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span>Muito Baixa</span>
              </div>
            </div>
          </Card>

          {/* Events List */}
          <Card className="lg:col-span-2 p-6 shadow-medium">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">Próximos Eventos</h3>
              <Badge variant="outline" className="bg-accent-light text-accent">
                {events.length} eventos
              </Badge>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando eventos...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum evento encontrado. Crie seu primeiro evento!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => {
                  const daysUntil = getDaysUntil(event.start_date, event.all_day);
                  return (
                     <div
                       key={event.id}
                       className="p-4 rounded-lg border border-border bg-card hover:shadow-medium transition-smooth"
                     >
                       <div className="flex items-start justify-between gap-4">
                         <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              {getPriorityDot(event.priority)}
                             <div>
                               <h4 className="font-medium text-foreground">{event.title}</h4>
                               <p className="text-sm text-muted-foreground">
                                 {formatEventDate(event.start_date, event.all_day)}
                               </p>
                             </div>
                           </div>
                           
                           {event.description && (
                             <p className="text-sm text-muted-foreground">{event.description}</p>
                           )}
                         </div>
                         
                         <div className="flex flex-col items-end gap-2">
                           <div className="flex items-center gap-2">
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => handleEditEvent(event)}
                               className="h-8 w-8 p-0"
                             >
                               <Edit2 className="w-4 h-4" />
                             </Button>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => handleDeleteEvent(event.id)}
                               className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                             >
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           </div>
                           
                           <Badge className={`${getPriorityColor(event.priority)} cursor-default`}>
                             {getPriorityLabel(event.priority)}
                           </Badge>
                           
                           <div className={`text-sm font-medium ${
                             daysUntil <= 0
                               ? "text-destructive" 
                               : daysUntil <= 3 
                               ? "text-destructive" 
                               : daysUntil <= 7 
                               ? "text-warning" 
                               : "text-muted-foreground"
                           }`}>
                             {daysUntil < 0 ? "Passou" :
                              daysUntil === 0 ? "Hoje" : 
                              daysUntil === 1 ? "Amanhã" : 
                              `${daysUntil} dias`}
                           </div>
                         </div>
                       </div>
                     </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Study Schedule Suggestion */}
        <Card className="p-6 shadow-medium bg-gradient-to-r from-success/5 to-accent/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-success rounded-lg flex items-center justify-center flex-shrink-0">
              <CalendarIcon className="w-6 h-6 text-success-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Sugestão de Cronograma Inteligente</h3>
              <p className="text-muted-foreground">
                Organize seus estudos com base nos eventos mais importantes e urgentes.
              </p>
              <Button variant="success" size="sm" className="mt-3">
                Ver Plano Completo
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Report Error Button */}
      <div className="flex justify-center mt-8">
        <ReportErrorButton area="Calendário" />
      </div>
    </div>
  );
};

export default Calendar;