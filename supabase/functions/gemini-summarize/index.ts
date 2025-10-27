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
        prompt = `IMPORTANTE: Responda em Markdown com formatação rica.

Faça um resumo claro e conciso do seguinte conteúdo educacional. Use:
- ## para títulos de seções principais
- ### para subtítulos e tópicos importantes
- **negrito** para conceitos e termos importantes
- - para listas de tópicos
- > para citações ou destaques relevantes

Destaque os pontos principais e conceitos importantes:${feedbackContext}

${content}`;
        break;
      case 'pontos-chave':
        prompt = `IMPORTANTE: Responda em Markdown com formatação rica.

Extraia e liste os pontos-chave mais importantes do seguinte conteúdo. Use:
- ## Pontos-Chave para o título
- - **Termo/Conceito**: descrição para cada item
- **negrito** para destacar conceitos principais

${feedbackContext}

${content}`;
        break;
      case 'perguntas':
        prompt = `IMPORTANTE: Responda em Markdown com formatação rica.

Com base no seguinte conteúdo, gere 5-8 perguntas de estudo relevantes. Use:
- ## Perguntas de Estudo para o título
- ### para numerar cada pergunta (### 1. Pergunta...)
- **negrito** para destacar conceitos nas perguntas
- Organize por níveis: Básico, Intermediário, Avançado

${feedbackContext}

${content}`;
        break;
      case 'conceitos':
        prompt = `IMPORTANTE: Responda em Markdown com formatação rica.

Identifique e explique os conceitos principais. Use:
- ## Conceitos Principais para o título
- ### para cada conceito
- **negrito** para termos técnicos
- - para listar características

${feedbackContext}

${content}`;
        break;
      case 'glossario':
        prompt = `IMPORTANTE: Responda em Markdown com formatação rica.

Crie um glossário com os termos técnicos e importantes. Use:
- ## Glossário de Termos para o título
- - **Termo**: definição clara e objetiva
- _itálico_ para exemplos ou observações

${feedbackContext}

${content}`;
        break;
      case 'mapa-mental':
        prompt = `IMPORTANTE: Responda em Markdown com formatação rica.

Crie um mapa mental estruturado. Use:
- # para o tema central
- ## para temas principais
- ### para subtemas
- - para detalhes e ramificações
- **negrito** para conceitos-chave

${feedbackContext}

${content}`;
        break;
      default:
        prompt = `IMPORTANTE: Responda em Markdown com formatação rica (use ##, ###, **negrito**, listas, etc).

Analise o seguinte conteúdo educacional:${feedbackContext}

${content}`;
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
            maxOutputTokens: 8192,
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