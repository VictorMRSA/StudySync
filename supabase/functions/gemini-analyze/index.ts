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
    const { title, description, content } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada');
    }

    const prompt = `
Analise o seguinte material educacional e forneça:
1. Categoria/Matéria principal (ex: Matemática, História, Ciências, etc.)
2. Nível de dificuldade (Básico, Intermediário, Avançado)
3. Tags relevantes (máximo 5)
4. Breve descrição do conteúdo (1-2 frases)

Material:
Título: ${title || 'Não informado'}
Descrição: ${description || 'Não informado'}
Conteúdo: ${content || 'Não informado'}

Responda no formato JSON:
{
  "category": "categoria",
  "level": "nivel",
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "breve descrição"
}
`;

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
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 512,
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

    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // Tentar extrair JSON da resposta
    let analysis;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback se não conseguir extrair JSON
        analysis = {
          category: "Geral",
          level: "Intermediário",
          tags: ["educação", "estudo"],
          summary: "Material educacional para análise"
        };
      }
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      analysis = {
        category: "Geral",
        level: "Intermediário", 
        tags: ["educação", "estudo"],
        summary: "Material educacional para análise"
      };
    }

    return new Response(
      JSON.stringify({ 
        analysis,
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro no gemini-analyze:', error);
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