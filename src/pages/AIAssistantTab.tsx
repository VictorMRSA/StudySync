import React from 'react';
import AIChat from '@/components/AIChat';
import AISummaryGenerator from '@/components/AISummaryGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MessageCircle, FileText, Sparkles } from 'lucide-react';

interface AIAssistantTabProps {
  initialMessage?: string;
}

const AIAssistantTab: React.FC<AIAssistantTabProps> = ({ initialMessage }) => {
  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 lg:mb-4 flex items-center gap-2 lg:gap-3">
            <Brain className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-primary" />
            <span className="leading-tight">Assistente Educacional IA</span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
            Utilize a inteligência artificial para melhorar seus estudos com conversas interativas, 
            resumos automáticos e análises de conteúdo.
          </p>
        </div>
        
        <Tabs defaultValue="chat" className="space-y-4 lg:space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto lg:mx-0 lg:w-auto">
            <TabsTrigger value="chat" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Chat Interativo</span>
              <span className="sm:hidden">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Resumos e Análises</span>
              <span className="sm:hidden">Resumos</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="space-y-4 lg:space-y-6">
            <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="lg:col-span-2 order-2 lg:order-1">
                <AIChat initialMessage={initialMessage} />
              </div>
              
              <div className="space-y-3 lg:space-y-4 order-1 lg:order-2">
                <div className="bg-card border rounded-lg p-3 lg:p-4">
                  <h3 className="font-semibold mb-2 lg:mb-3 flex items-center gap-2 text-sm lg:text-base">
                    <Sparkles className="h-3 w-3 lg:h-4 lg:w-4" />
                    Dicas de Uso
                  </h3>
                  <ul className="text-xs lg:text-sm space-y-1 lg:space-y-2 text-muted-foreground">
                    <li>• Faça perguntas específicas sobre suas matérias</li>
                    <li>• Peça explicações de conceitos complexos</li>
                    <li>• Solicite exercícios e exemplos práticos</li>
                    <li>• Use para revisar conteúdos antes de provas</li>
                  </ul>
                </div>
                
                <div className="bg-card border rounded-lg p-3 lg:p-4">
                  <h3 className="font-semibold mb-2 lg:mb-3 text-sm lg:text-base">Exemplos de Perguntas</h3>
                  <div className="space-y-2 text-xs lg:text-sm">
                    <div className="bg-muted/50 rounded p-2">
                      "Explique a lei de Newton de forma simples"
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      "Como resolver equações do 2º grau?"
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      "Quais são as principais causas da 2ª Guerra Mundial?"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="summary" className="space-y-4 lg:space-y-6">
            <AISummaryGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIAssistantTab;
