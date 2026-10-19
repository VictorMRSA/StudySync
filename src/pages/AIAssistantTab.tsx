import React from 'react';
import AIChat from '@/components/AIChat';
import AISummaryGenerator from '@/components/AISummaryGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MessageCircle, FileText, Sparkles } from 'lucide-react';

interface AIAssistantTabProps {
  initialMessage?: string;
  initialMaterialId?: string;
}

const AIAssistantTab: React.FC<AIAssistantTabProps> = ({ initialMessage, initialMaterialId }) => {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1 select-none">Workspace</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
          <span>IA Assistente</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Utilize a inteligência artificial para melhorar seus estudos com conversas interativas, resumos e análises.
        </p>
      </div>
      
      <Tabs defaultValue="chat" className="space-y-4 sm:space-y-6">
        <TabsList className="bg-neutral-100 dark:bg-neutral-900/60 p-1 rounded-lg border border-border/60">
          <TabsTrigger value="chat" className="flex items-center gap-1.5 text-xs sm:text-sm rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:shadow-sm">
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Chat Interativo</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-1.5 text-xs sm:text-sm rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 data-[state=active]:shadow-sm">
            <FileText className="h-3.5 w-3.5" />
            <span>Resumos e Análises</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="space-y-4 sm:space-y-6 mt-4">
          <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <AIChat initialMessage={initialMessage} initialMaterialId={initialMaterialId} />
            </div>
            
            <div className="space-y-3 sm:space-y-4 order-1 lg:order-2">
              <div className="bg-card border border-border/60 rounded-xl p-4 shadow-none">
                <h3 className="font-semibold mb-2.5 flex items-center gap-2 text-xs sm:text-sm text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  Dicas de Uso
                </h3>
                <ul className="text-xs space-y-1.5 text-muted-foreground">
                  <li>• Faça perguntas específicas sobre suas matérias</li>
                  <li>• Peça explicações de conceitos complexos</li>
                  <li>• Solicite exercícios e exemplos práticos</li>
                  <li>• Use para revisar conteúdos antes de provas</li>
                </ul>
              </div>
              
              <div className="bg-card border border-border/60 rounded-xl p-4 shadow-none">
                <h3 className="font-semibold mb-2 text-xs sm:text-sm text-foreground">Exemplos de Perguntas</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="bg-neutral-50 dark:bg-neutral-900/40 border border-border/50 rounded-lg p-2.5 text-muted-foreground">
                    "Explique a lei de Newton de forma simples"
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-900/40 border border-border/50 rounded-lg p-2.5 text-muted-foreground">
                    "Como resolver equações do 2º grau?"
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-900/40 border border-border/50 rounded-lg p-2.5 text-muted-foreground">
                    "Quais são as principais causas da 2ª Guerra Mundial?"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="summary" className="space-y-4 sm:space-y-6 mt-4">
          <AISummaryGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAssistantTab;
