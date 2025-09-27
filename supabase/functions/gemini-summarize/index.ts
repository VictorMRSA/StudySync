import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, type = 'resumo' } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    if (!content) {
      throw new Error('Conteúdo é obrigatório');
    }

    let prompt = '';
    switch (type) {
      case 'resumo':
        prompt = `Faça um resumo claro e conciso do seguinte conteúdo educacional. Destaque os pontos principais e conceitos importantes:\n\n${content}`;
        break;
      case 'pontos-chave':
        prompt = `Extraia e liste os pontos-chave mais importantes do seguinte conteúdo:\n\n${content}`;
        break;
      case 'perguntas':
        prompt = `Com base no seguinte conteúdo, gere 5 perguntas de estudo relevantes:\n\n${content}`;
        break;
      default:
        prompt = `Analise o seguinte conteúdo educacional:\n\n${content}`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
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
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Resposta inválida da API Gemini');
    }

    const result = data.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({ 
        result,
        type,
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro no gemini-summarize:', error);
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