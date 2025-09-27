import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history = [] } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    // Preparar o histórico da conversa
    const contents: ChatMessage[] = [
      {
        role: 'user',
        parts: [{ text: 'Você é um assistente educacional inteligente. Ajude os estudantes com suas dúvidas de forma clara e didática.' }]
      },
      {
        role: 'model',
        parts: [{ text: 'Olá! Sou seu assistente educacional. Estou aqui para ajudá-lo com seus estudos. Como posso auxiliá-lo hoje?' }]
      },
      ...history,
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro da API Gemini:', error);
      throw new Error(`Erro da API Gemini: ${response.status}`);
    }

    const data = await response.json();
    
    // Tentar extrair o texto de forma robusta
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const botResponse = parts
      .map((p: { text?: string }) => p?.text ?? '')
      .filter((t: string) => t && t.trim().length > 0)
      .join('\n')
      .trim();

    if (!botResponse) {
      console.error('Resposta inválida da API Gemini - payload:', JSON.stringify(data));
      throw new Error('Resposta inválida da API Gemini');
    }

    return new Response(
      JSON.stringify({ 
        response: botResponse,
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro no gemini-chat:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});