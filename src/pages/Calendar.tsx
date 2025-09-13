import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Plus, Filter, AlertCircle } from "lucide-react";
import { useState } from "react";

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const events = [
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
  ];

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
            <Button variant="gamified" size="lg">
              <Plus className="w-5 h-5" />
              Novo Evento
            </Button>
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