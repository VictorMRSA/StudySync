import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, title } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log('Generating flashcards for:', title);

    const prompt = `Você está criando flashcards de estudo sobre "${title}".

Com base EXCLUSIVAMENTE no seguinte conteúdo, crie 8 pares de flashcards:

${content}

REGRAS OBRIGATÓRIAS:
1. Cada TERMO deve ser uma palavra-chave, conceito ou pergunta curta do conteúdo
2. Cada DEFINIÇÃO deve ser a explicação, resposta ou descrição correspondente
3. Os pares devem ser CLARAMENTE relacionados entre si
4. Extraia apenas informações que EXISTEM no texto acima
5. Não invente termos ou definições
6. Os flashcards devem cobrir diferentes partes do conteúdo
7. TERMO e DEFINIÇÃO devem formar um par lógico para jogo da memória

Retorne APENAS um JSON válido neste formato exato, sem markdown:
{
  "flashcards": [
    {
      "term": "Conceito/Palavra-chave do conteúdo",
      "definition": "Sua explicação/descrição correspondente"
    }
  ]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated');
    }

    const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const flashcardsData = JSON.parse(cleanedText);

    return new Response(JSON.stringify(flashcardsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-flashcards:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
