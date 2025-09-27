import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import AIChat from '@/components/AIChat';
import AISummaryGenerator from '@/components/AISummaryGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MessageCircle, FileText, Sparkles } from 'lucide-react';

const AIAssistant: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ai-assistant');

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
              <Brain className="h-10 w-10 text-primary" />
              Assistente Educacional IA
            </h1>
            <p className="text-lg text-muted-foreground">
              Utilize a inteligência artificial para melhorar seus estudos com conversas interativas, 
              resumos automáticos e análises de conteúdo.
            </p>
          </div>
          
          <Tabs defaultValue="chat" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Chat Interativo
              </TabsTrigger>
              <TabsTrigger value="summary" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Resumos e Análises
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <AIChat />
                </div>
                
                <div className="space-y-4">
                  <div className="bg-card border rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Dicas de Uso
                    </h3>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li>• Faça perguntas específicas sobre suas matérias</li>
                      <li>• Peça explicações de conceitos complexos</li>
                      <li>• Solicite exercícios e exemplos práticos</li>
                      <li>• Use para revisar conteúdos antes de provas</li>
                    </ul>
                  </div>
                  
                  <div className="bg-card border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Exemplos de Perguntas</h3>
                    <div className="space-y-2 text-sm">
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
            
            <TabsContent value="summary" className="space-y-6">
              <AISummaryGenerator />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;