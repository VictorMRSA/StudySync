import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Clock, Plus, Filter, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Prova de Física I",
      subject: "Física I",
      date: "2024-01-15",
      time: "14:00",
      type: "exam",
      daysLeft: 3,
      description: "Mecânica clássica e leis de Newton"
    },
    {
      id: 2,
      title: "Entrega da Lista de Cálculo",
      subject: "Cálculo I", 
      date: "2024-01-17",
      time: "23:59",
      type: "assignment",
      daysLeft: 5,
      description: "Exercícios sobre limites e continuidade"
    },
    {
      id: 3,
      title: "Apresentação do Projeto",
      subject: "Programação",
      date: "2024-01-24",
      time: "10:00",
      type: "presentation",
      daysLeft: 12,
      description: "Sistema de gerenciamento acadêmico"
    },
    {
      id: 4,
      title: "Aula de Laboratório",
      subject: "Química Geral",
      date: "2024-01-16",
      time: "16:00",
      type: "class",
      daysLeft: 4,
      description: "Experimento: reações ácido-base"
    }
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    subject: "",
    date: "",
    time: "",
    type: "",
    description: ""
  });
  const { toast } = useToast();

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.type) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const eventDate = new Date(newEvent.date);
    const today = new Date();
    const daysLeft = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const event = {
      id: events.length + 1,
      ...newEvent,
      daysLeft
    };

    setEvents([...events, event]);
    setNewEvent({
      title: "",
      subject: "",
      date: "",
      time: "",
      type: "",
      description: ""
    });
    setIsDialogOpen(false);

    toast({
      title: "Evento criado!",
      description: "Seu novo evento foi adicionado ao calendário.",
      variant: "default"
    });
  };
  

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "exam": return "bg-destructive text-destructive-foreground";
      case "assignment": return "bg-warning text-warning-foreground";
      case "presentation": return "bg-accent text-accent-foreground";
      case "class": return "bg-primary text-primary-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "exam": return "📝";
      case "assignment": return "📋";
      case "presentation": return "🎤";
      case "class": return "📚";
      default: return "📅";
    }
  };

  const urgentEvents = events.filter(event => event.daysLeft <= 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-accent/5 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">Calendário Acadêmico</h1>
            <p className="text-muted-foreground">Organize seus compromissos e nunca perca um prazo</p>
          </div>
          
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
                    <Label htmlFor="subject">Matéria</Label>
                    <Input
                      id="subject"
                      placeholder="Ex: Física I"
                      value={newEvent.subject}
                      onChange={(e) => setNewEvent({...newEvent, subject: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Data *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="time">Horário *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <Select value={newEvent.type} onValueChange={(value) => setNewEvent({...newEvent, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo do evento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exam">Prova</SelectItem>
                        <SelectItem value="assignment">Entrega</SelectItem>
                        <SelectItem value="presentation">Apresentação</SelectItem>
                        <SelectItem value="class">Aula</SelectItem>
                      </SelectContent>
                    </Select>
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
              <h3 className="font-semibold">Janeiro 2024</h3>
            </div>
            
            {/* Simple calendar grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
                <div key={day} className="p-2 font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <div
                  key={day}
                  className={`p-2 rounded-lg cursor-pointer transition-smooth ${
                    day === 12 
                      ? "bg-primary text-primary-foreground shadow-soft" 
                      : day === 15 || day === 17 || day === 24
                      ? "bg-destructive/20 text-destructive font-medium"
                      : "hover:bg-muted"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
            
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full" />
                <span>Hoje</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-destructive rounded-full" />
                <span>Eventos importantes</span>
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
            
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-lg border border-border bg-card hover:shadow-medium transition-smooth"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getEventTypeIcon(event.type)}</span>
                        <div>
                          <h4 className="font-medium text-foreground">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">{event.subject}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{new Date(event.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{event.time}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getEventTypeColor(event.type)}>
                        {event.type === "exam" && "Prova"}
                        {event.type === "assignment" && "Entrega"}
                        {event.type === "presentation" && "Apresentação"}
                        {event.type === "class" && "Aula"}
                      </Badge>
                      
                      <div className={`text-sm font-medium ${
                        event.daysLeft <= 3 
                          ? "text-destructive" 
                          : event.daysLeft <= 7 
                          ? "text-warning" 
                          : "text-muted-foreground"
                      }`}>
                        {event.daysLeft === 0 ? "Hoje" : 
                         event.daysLeft === 1 ? "Amanhã" : 
                         `${event.daysLeft} dias`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                Com base nos seus prazos, recomendamos dedicar 2h diárias para Física I e 1h para Cálculo I nos próximos dias.
              </p>
              <Button variant="success" size="sm" className="mt-3">
                Ver Plano Completo
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Calendar;