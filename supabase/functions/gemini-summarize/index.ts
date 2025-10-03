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
    const { content, type = 'resumo', feedback } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    if (!content) {
      throw new Error('Conteúdo é obrigatório');
    }

    // Add feedback context if provided
    const feedbackContext = feedback 
      ? `\n\nFEEDBACK DO USUÁRIO SOBRE ANÁLISE ANTERIOR:\n"${feedback}"\n\nPor favor, considere este feedback e melhore a análise focando nos pontos mencionados pelo usuário.\n\n`
      : '';
    
    let prompt = '';
    switch (type) {
      case 'resumo':
        prompt = `Faça um resumo claro e conciso do seguinte conteúdo educacional. Destaque os pontos principais e conceitos importantes:${feedbackContext}\n${content}`;
        break;
      case 'pontos-chave':
        prompt = `Extraia e liste os pontos-chave mais importantes do seguinte conteúdo:${feedbackContext}\n${content}`;
        break;
      case 'perguntas':
        prompt = `Com base no seguinte conteúdo, gere 5-8 perguntas de estudo relevantes com diferentes níveis de dificuldade:${feedbackContext}\n${content}`;
        break;
      case 'conceitos':
        prompt = `Identifique e explique os conceitos principais apresentados no seguinte conteúdo educacional:${feedbackContext}\n${content}`;
        break;
      case 'glossario':
        prompt = `Crie um glossário com os termos técnicos e importantes do seguinte conteúdo, com definições claras:${feedbackContext}\n${content}`;
        break;
      case 'mapa-mental':
        prompt = `Crie um mapa mental estruturado em formato de texto do seguinte conteúdo, organizando hierarquicamente os temas principais e subtemas:${feedbackContext}\n${content}`;
        break;
      default:
        prompt = `Analise o seguinte conteúdo educacional:${feedbackContext}\n${content}`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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