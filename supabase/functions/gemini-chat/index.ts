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
    const rawBody = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    // Input validation
    const message = rawBody?.message;
    const history = rawBody?.history;

    // Validate message
    if (typeof message !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Mensagem deve ser uma string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userMessage = message.trim();
    
    if (!userMessage) {
      return new Response(
        JSON.stringify({ success: false, error: 'Mensagem não pode estar vazia' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (userMessage.length > 2000) {
      return new Response(
        JSON.stringify({ success: false, error: 'Mensagem muito longa (máximo 2000 caracteres)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize message - remove control characters
    const sanitizedMessage = userMessage.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Validate history
    if (history !== undefined && !Array.isArray(history)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Histórico deve ser um array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (Array.isArray(history) && history.length > 50) {
      return new Response(
        JSON.stringify({ success: false, error: 'Histórico muito longo (máximo 50 mensagens)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar o histórico da conversa (aceitando vários formatos)
    const mappedHistory: ChatMessage[] = Array.isArray(history)
      ? history
          .slice(0, 50) // Hard limit
          .map((h: any) => {
            const role: 'user' | 'model' = h?.role === 'assistant' || h?.role === 'model' ? 'model' : 'user';
            const text: string =
              typeof h?.content === 'string'
                ? h.content
                : typeof h?.parts?.[0]?.text === 'string'
                ? h.parts[0].text
                : '';
            const t = String(text ?? '').trim().substring(0, 4000); // Limit each history message
            return t ? ({ role, parts: [{ text: t }] } as ChatMessage) : undefined;
          })
          .filter((m: any): m is ChatMessage => Boolean(m))
      : [];

    const contents: ChatMessage[] = [
      {
        role: 'user',
        parts: [{ text: 'Você é um assistente educacional inteligente. Ajude os estudantes com suas dúvidas de forma clara e didática.' }]
      },
      {
        role: 'model',
        parts: [{ text: 'Olá! Sou seu assistente educacional. Estou aqui para ajudá-lo com seus estudos. Como posso auxiliá-lo hoje?' }]
      },
      ...mappedHistory,
      {
        role: 'user',
        parts: [{ text: sanitizedMessage }]
      }
    ];


    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
            maxOutputTokens: 4096,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API Gemini:', errorText);
      let errMsg = `Erro da API Gemini (${response.status})`;
      try {
        const j = JSON.parse(errorText);
        errMsg = j?.error?.message || errMsg;
      } catch {}
      return new Response(
        JSON.stringify({ success: false, error: errMsg, status: response.status }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Verificar se a resposta atingiu o limite de tokens
    const finishReason = data?.candidates?.[0]?.finishReason;
    
    // Tentar extrair o texto de forma robusta
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const botResponse = parts
      .map((p: { text?: string }) => p?.text ?? '')
      .filter((t: string) => t && t.trim().length > 0)
      .join('\n')
      .trim();

    if (!botResponse) {
      console.error('Resposta inválida da API Gemini - payload:', JSON.stringify(data));
      
      // Se foi MAX_TOKENS mas não há conteúdo, retornar mensagem explicativa
      if (finishReason === 'MAX_TOKENS') {
        return new Response(
          JSON.stringify({ 
            response: 'Desculpe, a resposta ficou muito longa. Tente fazer uma pergunta mais específica ou divida em partes menores.',
            success: true,
            warning: 'MAX_TOKENS'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error('Resposta inválida da API Gemini');
    }
    
    // Se atingiu MAX_TOKENS, adicionar aviso
    const responseWithWarning = finishReason === 'MAX_TOKENS' 
      ? `${botResponse}\n\n[Nota: A resposta foi truncada por limite de tokens. Considere fazer uma pergunta mais específica.]`
      : botResponse;

    return new Response(
      JSON.stringify({ 
        response: responseWithWarning,
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro no gemini-chat:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno do servidor';
    const status = msg.includes('Mensagem inválida') ? 400 : 500;
    return new Response(
      JSON.stringify({ 
        error: msg,
        success: false 
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});